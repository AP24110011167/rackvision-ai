import sqlite3
import json
import logging
import hashlib
import secrets
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from app.core.config import settings

logger = logging.getLogger("rackvision.db")

_db_initialized = False

def get_connection() -> sqlite3.Connection:
    global _db_initialized
    conn = sqlite3.connect(str(settings.DATABASE_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    if not _db_initialized:
        _db_initialized = True
        init_db()
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        client TEXT,
        location TEXT,
        target_tier TEXT DEFAULT 'Tier III',
        status TEXT DEFAULT 'Active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Sketches table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sketches (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_url TEXT NOT NULL,
        preprocessed_url TEXT NOT NULL,
        canny_url TEXT NOT NULL,
        params_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    """)

    # Designs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS designs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        sketch_id TEXT,
        prompt TEXT NOT NULL,
        negative_prompt TEXT NOT NULL,
        style TEXT NOT NULL,
        rack_count INTEGER DEFAULT 24,
        cooling_type TEXT DEFAULT 'CRAC Perimeter',
        image_url TEXT NOT NULL,
        seed INTEGER DEFAULT 42,
        guidance_scale REAL DEFAULT 7.5,
        steps INTEGER DEFAULT 30,
        resolution TEXT DEFAULT '768x768',
        mode TEXT DEFAULT 'demo',
        is_favorite INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    """)

    # 3D Scenes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scenes_3d (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL UNIQUE,
        room_dims_json TEXT NOT NULL,
        racks_json TEXT NOT NULL,
        cooling_units_json TEXT NOT NULL,
        pdus_json TEXT NOT NULL,
        cable_trays_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    """)

    # Materials table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        purpose TEXT NOT NULL,
        specification TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        selection_criteria TEXT NOT NULL,
        location TEXT NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    """)

    # Construction Plans table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS construction_plans (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL UNIQUE,
        stages_json TEXT NOT NULL,
        total_duration_days INTEGER NOT NULL,
        target_completion_date TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    """)

    # Central Structured Layouts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS layouts (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL UNIQUE,
        sketch_id TEXT,
        layout_json TEXT NOT NULL,
        status TEXT DEFAULT 'confirmed',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    """)

    # Safe Schema Migrations for Photorealistic Visualization & Output 3 Master Renders
    try:
        cursor.execute("ALTER TABLE designs ADD COLUMN output_type TEXT DEFAULT 'technical'")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE designs ADD COLUMN camera_viewpoint TEXT DEFAULT 'front_symmetrical'")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE designs ADD COLUMN model_identifier TEXT DEFAULT 'neural_master_v2.5'")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE designs ADD COLUMN layout_version TEXT DEFAULT 'v1.0'")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE designs ADD COLUMN upscaled INTEGER DEFAULT 1")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE designs ADD COLUMN generation_status TEXT DEFAULT 'completed'")
    except Exception:
        pass

    # Final Master Renders table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS final_master_renders (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        design_id TEXT,
        layout_version TEXT DEFAULT 'v1.0',
        model_identifier TEXT NOT NULL,
        prompt TEXT NOT NULL,
        negative_prompt TEXT,
        camera_viewpoint TEXT NOT NULL,
        viewpoint_label TEXT,
        style TEXT NOT NULL,
        lighting TEXT NOT NULL,
        image_url TEXT NOT NULL,
        resolution TEXT NOT NULL,
        upscaled INTEGER DEFAULT 1,
        generation_settings_json TEXT,
        generation_status TEXT DEFAULT 'completed',
        inference_time_seconds REAL DEFAULT 0.0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    """)

    # Enterprise Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT DEFAULT 'architect',
        organization TEXT DEFAULT 'Helios Data Systems',
        status TEXT DEFAULT 'Active',
        designs_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        last_login TEXT
    )
    """)

    # User Sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Audit Logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        details TEXT,
        ip_address TEXT DEFAULT '127.0.0.1',
        timestamp TEXT NOT NULL
    )
    """)

    seed_default_users_and_logs(cursor)

    conn.commit()
    conn.close()
    logger.info("Database initialized successfully at %s", settings.DATABASE_PATH)
    seed_demo_project_if_empty()

def seed_demo_project_if_empty():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM projects")
    count = cursor.fetchone()["count"]
    if count == 0:
        logger.info("Seeding initial showcase project: Project Helios Hyperscale DC-1")
        now = datetime.now().isoformat()
        proj_id = "proj-helios-01"
        cursor.execute("""
        INSERT INTO projects (id, name, description, client, location, target_tier, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            proj_id,
            "Helios Cloud Hyperscale DC-1",
            "High-density AI enterprise datacenter layout with cold-aisle containment and N+1 CRAC perimeter redundancy.",
            "Helios Neural Infrastructure Corp",
            "Frankfurt Campus / Pod A",
            "Tier III (Uptime Institute)",
            "Active",
            now,
            now
        ))

        # Default 3D scene data
        room_dims = {"width": 16.0, "length": 22.0, "height": 4.5}
        racks = []
        rack_id = 1
        # Create 2 rows of racks with cold aisle in between
        for z_row, z_pos in [("Row-A", -3.0), ("Row-B", 3.0)]:
            for x_idx, x_pos in enumerate([-7.0, -5.5, -4.0, -2.5, -1.0, 0.5, 2.0, 3.5, 5.0, 6.5]):
                racks.append({
                    "id": f"rack-{rack_id:02d}",
                    "name": f"Rack {z_row}-{x_idx+1:02d}",
                    "row": z_row,
                    "x": x_pos,
                    "y": 1.1,
                    "z": z_pos,
                    "width": 0.8,
                    "height": 2.2,
                    "depth": 1.0,
                    "type": "AI Compute" if x_idx % 2 == 0 else "Storage / Core Switch",
                    "power_kw": 12.5 if x_idx % 2 == 0 else 7.0,
                    "status": "Online",
                    "servers_count": 18
                })
                rack_id += 1

        cooling_units = [
            {"id": "crac-01", "name": "CRAC Unit North-1", "x": -6.0, "y": 1.25, "z": -8.5, "width": 1.8, "height": 2.5, "depth": 1.0, "capacity_kw": 95},
            {"id": "crac-02", "name": "CRAC Unit North-2", "x": 4.0, "y": 1.25, "z": -8.5, "width": 1.8, "height": 2.5, "depth": 1.0, "capacity_kw": 95},
            {"id": "crac-03", "name": "CRAC Unit South-1", "x": -6.0, "y": 1.25, "z": 8.5, "width": 1.8, "height": 2.5, "depth": 1.0, "capacity_kw": 95},
            {"id": "crac-04", "name": "CRAC Unit South-2", "x": 4.0, "y": 1.25, "z": 8.5, "width": 1.8, "height": 2.5, "depth": 1.0, "capacity_kw": 95},
        ]

        pdus = [
            {"id": "pdu-01", "name": "PDU Primary A-Feed", "x": -7.5, "y": 1.0, "z": 0.0, "width": 1.0, "height": 2.0, "depth": 0.9, "rating_kva": 250},
            {"id": "pdu-02", "name": "PDU Redundant B-Feed", "x": 7.5, "y": 1.0, "z": 0.0, "width": 1.0, "height": 2.0, "depth": 0.9, "rating_kva": 250},
        ]

        cable_trays = [
            {"id": "tray-row-a", "x": 0.0, "y": 2.8, "z": -3.0, "length": 15.0, "width": 0.6},
            {"id": "tray-row-b", "x": 0.0, "y": 2.8, "z": 3.0, "length": 15.0, "width": 0.6},
            {"id": "tray-cross-1", "x": -7.0, "y": 3.0, "z": 0.0, "length": 7.0, "width": 0.5, "orientation": "cross"},
            {"id": "tray-cross-2", "x": 7.0, "y": 3.0, "z": 0.0, "length": 7.0, "width": 0.5, "orientation": "cross"}
        ]

        cursor.execute("""
        INSERT INTO scenes_3d (id, project_id, room_dims_json, racks_json, cooling_units_json, pdus_json, cable_trays_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "scene-helios-01",
            proj_id,
            json.dumps(room_dims),
            json.dumps(racks),
            json.dumps(cooling_units),
            json.dumps(pdus),
            json.dumps(cable_trays),
            now
        ))

        # Seed Materials BOM
        materials_data = [
            # Server Infrastructure
            ("mat-01", proj_id, "Server Infrastructure", "42U Heavy-Duty Server Enclosure", "Houses high-density blade compute servers & cabling", "EIA-310-D standard, 800x1200mm, 1500kg static load", 20, "Units", "High ventilation perforations (80% hex)", "Data Hall Pod A", 2850.0),
            ("mat-02", proj_id, "Server Infrastructure", "Smart Monitored 3-Phase PDU Strip", "Rack-level power metering & branch circuit protection", "400V 32A 3-Phase, 24x C13 + 6x C19 outlets", 40, "Units", "IEC 60309 inlet, Ethernet SNMPv3 management", "Per Server Rack (Dual A+B)", 1250.0),
            ("mat-03", proj_id, "Server Infrastructure", "100G/400G Leaf-Spine Switch Array", "Top-of-Rack network aggregation & spine routing", "32-port 400GbE QSFP-DD, ultra-low latency ASIC", 6, "Units", "Redundant hot-swap power & fan trays", "ToR in Racks A-01, A-10, B-01, B-10", 18500.0),
            
            # Cooling Infrastructure
            ("mat-04", proj_id, "Cooling Infrastructure", "Downflow CRAC Precision Unit", "Computer room air conditioning with EC fans", "95kW Sensible Cooling, Dual DX circuits, R410A", 4, "Units", "ASHRAE TC 9.9 compliance, Variable speed compressors", "Perimeter Data Hall Walls", 42000.0),
            ("mat-05", proj_id, "Cooling Infrastructure", "Cold Aisle Containment Enclosure", "Prevents bypass mixing between supply and hot exhaust", "Clear polycarbonate ceiling panels with sliding end doors", 2, "Assemblies", "FM Global Class 1 fire-safe drop-away panels", "Center aisles between Row A & Row B", 12400.0),
            ("mat-06", proj_id, "Cooling Infrastructure", "Perforated Airflow Floor Grilles", "Underfloor chilled air delivery into cold aisles", "600x600mm steel floor tiles, 56% open area dampers", 40, "Panels", "Heavy concentrated load rating (Class 6)", "Cold Aisle Ingress Plenum", 320.0),

            # Electrical Infrastructure
            ("mat-07", proj_id, "Electrical Infrastructure", "Online Double-Conversion Modular UPS", "Uninterruptible clean power conditioning & battery backup", "250kVA / 250kW scalable modular N+1 frame", 2, "Systems", "97% VFI high efficiency mode, LiFePO4 battery cabinet", "Dedicated Electrical Plant Room", 85000.0),
            ("mat-08", proj_id, "Electrical Infrastructure", "Overhead Track Busway Power Trunk", "Modular plug-in power delivery above rack rows", "400A 415V 4-wire + Ground aluminium housing", 60, "Meters", "Finger-safe drop boxes with branch breakers", "Suspended above Row A & Row B racks", 380.0),
            ("mat-09", proj_id, "Electrical Infrastructure", "Power Distribution Unit (PDU) Cabinet", "Step-down isolation & circuit breaker distribution", "225kVA, K-20 rated copper isolation transformer", 2, "Cabinets", "Waveform monitoring & revenue-grade submetering", "Data Hall North & South Perimeter", 24500.0),

            # Physical Infrastructure
            ("mat-10", proj_id, "Physical Infrastructure", "Heavy-Duty Anti-Static Raised Access Floor", "Forms pressurized cooling plenum and underfloor cabling space", "600x600mm steel-cementitious panels, 600mm pedestal height", 352, "Square Meters", "Static dissipative HPL surface (10^6 - 10^9 ohms)", "Entire Data Hall Footprint", 145.0),
            ("mat-11", proj_id, "Physical Infrastructure", "Overhead Wire Mesh Cable Tray System", "Separated pathways for fiber optic and copper cabling", "400mm width x 100mm depth electro-galvanized wire basket", 90, "Meters", "UL Classified, rounded safety edges", "Suspended 3.0m AFF throughout aisles", 85.0),
            ("mat-12", proj_id, "Physical Infrastructure", "Clean Agent Fire Suppression System (Novec 1230)", "Total flooding environmentally benign fire suppression", "FK-5-1-12 synthetic fluid, zero ODP, 30-bar cylinders", 1, "Complete System", "NFPA 2001 & ISO 14520 compliant with VESDA sampling", "Data Hall & Battery Rooms", 58000.0),
            ("mat-13", proj_id, "Physical Infrastructure", "Low-Glare Anti-Stroboscopic LED Luminaires", "High efficiency task illumination with emergency battery packs", "Linear 40W 4000K 500 lux maintained data center luminaire", 24, "Fixtures", "PIR motion sensor dimming, 90-min emergency backup", "Aisle ceiling unistrut grid", 220.0)
        ]

        for m_id, p_id, cat, name, purpose, spec, qty, unit, crit, loc, price in materials_data:
            cursor.execute("""
            INSERT INTO materials (id, project_id, category, name, purpose, specification, quantity, unit, selection_criteria, location, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (m_id, p_id, cat, name, purpose, spec, qty, unit, crit, loc, price, qty * price))

        # Seed Construction Plan
        stages_data = [
            {
                "stage_num": 1,
                "title": "Site Preparation & Civil Structural Assessment",
                "duration_days": 14,
                "status": "Completed",
                "progress_percent": 100,
                "dependencies": ["Architectural Permit Approval", "Floor Slab Load Certification"],
                "description": "Subfloor slab leveling, structural live-load capacity verification (15 kN/m²), perimeter wall sealing, and anti-dust epoxy coating application.",
                "tools_equipment": ["Laser leveler", "Core drill rig", "Concrete moisture meter", "Industrial epoxy application rigs"],
                "safety_precautions": ["Respirator protection for epoxy vapor", "Floor loading boundary enforcement", "OSHA 1926 subfloor safety guidelines"],
                "inspection_checklist": ["Concrete compressive strength test > 30 MPa", "Slab moisture emission < 3 lbs/1000 sq ft/24hr", "Perimeter penetrations fire-stopped with UL rating"]
            },
            {
                "stage_num": 2,
                "title": "Room Measurements, Vapor Barrier & Civil Works",
                "duration_days": 10,
                "status": "Completed",
                "progress_percent": 100,
                "dependencies": ["Stage 1: Civil Structural Assessment"],
                "description": "Installation of high-density vapor retarder sheet, acoustic insulation panels, fire-rated security doors with biometric interlocks, and perimeter drainage berms.",
                "tools_equipment": ["Ultrasonic distance meters", "Thermal imaging scanner", "Sheet metal brake", "Pneumatic fasteners"],
                "safety_precautions": ["Air quality monitoring in enclosed spaces", "Hearing protection during drilling"],
                "inspection_checklist": ["Vapor barrier continuous without punctures", "Emergency egress panic bars operational", "Acoustic rating STC > 45 verified"]
            },
            {
                "stage_num": 3,
                "title": "Anti-Static Raised Floor System Installation",
                "duration_days": 12,
                "status": "Completed",
                "progress_percent": 100,
                "dependencies": ["Stage 2: Vapor Barrier & Civil Works"],
                "description": "Grid layout, seismic pedestal anchoring with structural epoxy, stringer assembly, 600mm pedestal height alignment, and anti-static panel placement.",
                "tools_equipment": ["Dual-beam laser alignment tool", "Torque wrenches", "Pedestal epoxy mixing station", "Vacuum tile lifters"],
                "safety_precautions": ["Open floor pit hazard tape and safety barriers", "PPE steel-toe footwear"],
                "inspection_checklist": ["Level tolerance within +/- 1.5mm over 10m", "Pedestal seismic anchor pull-out test certified", "Surface-to-ground resistance 1.0 x 10^6 to 1.0 x 10^9 ohms"]
            },
            {
                "stage_num": 4,
                "title": "High-Voltage Electrical & UPS Infrastructure",
                "duration_days": 21,
                "status": "In Progress",
                "progress_percent": 65,
                "dependencies": ["Stage 3: Anti-Static Raised Floor System Installation"],
                "description": "Rigging and anchoring of 250kVA Modular UPS cabinets, LiFePO4 battery racks, main distribution switchboards, and primary 400V feed busway installation.",
                "tools_equipment": ["Heavy-machinery skates and rigging hoists", "Hydraulic crimpers", "Digital insulation resistance meter (Megger)", "Busway alignment lasers"],
                "safety_precautions": ["NFPA 70E Arc Flash PPE Category 4 requirements", "Lock-out / Tag-out (LOTO) procedures strictly enforced", "DC battery isolation switches verified open"],
                "inspection_checklist": ["Insulation resistance test > 100 Megaohms", "Torque verification on busway joints with tamper seals", "UPS bypass transfer calibration verified"]
            },
            {
                "stage_num": 5,
                "title": "Precision CRAC/CRAH Cooling & Chilled Water Loops",
                "duration_days": 18,
                "status": "In Progress",
                "progress_percent": 40,
                "dependencies": ["Stage 4: High-Voltage Electrical & UPS Infrastructure"],
                "description": "Placement of 4x 95kW perimeter CRAC units, refrigerant/chilled piping connection, dual condensate pump tie-ins, underfloor damper balancing, and duct plenums.",
                "tools_equipment": ["Nitrogen pressure test rig", "Refrigerant recovery and charging station", "Anemometer airflow hood", "Pipe threading & grooving machine"],
                "safety_precautions": ["Pressure vessel safety compliance", "Refrigerant leak detection sensors active during charging"],
                "inspection_checklist": ["Hydrostatic / Nitrogen pressure hold for 24 hours at 1.5x working pressure", "Condensate overflow high-level alarm trip verified", "Variable speed EC fan modulation curve configured"]
            },
            {
                "stage_num": 6,
                "title": "Server Rack Framing & Aisle Alignment",
                "duration_days": 8,
                "status": "Pending",
                "progress_percent": 0,
                "dependencies": ["Stage 4: High-Voltage Electrical & UPS Infrastructure", "Stage 5: Precision CRAC/CRAH Cooling"],
                "description": "Anchoring of 20x 42U server cabinets to subfloor concrete via unistrut stanchions, row ganging, cold aisle containment frame assembly, and grounding bonding.",
                "tools_equipment": ["Rack ganging hardware kits", "Ground bond resistance tester", "Magnetic plumb levels"],
                "safety_precautions": ["Two-man lift protocols for rack uncrating", "Seismic anchoring bolt torque inspection"],
                "inspection_checklist": ["Plumbness within 2mm across full 2.2m height", "Subfloor grounding strap resistance < 0.1 ohm to main halo", "Containment door sliding mechanism smooth and self-closing"]
            },
            {
                "stage_num": 7,
                "title": "Overhead Cable Tray & Fiber Raceway Routing",
                "duration_days": 10,
                "status": "Pending",
                "progress_percent": 0,
                "dependencies": ["Stage 6: Server Rack Framing & Aisle Alignment"],
                "description": "Installation of dual-tier overhead suspension: lower yellow fiber raceway and upper zinc wire-basket tray for copper power and copper data separation.",
                "tools_equipment": ["Unistrut drop-rod threaders", "Wire tray angle cutters and radius bend formers"],
                "safety_precautions": ["Fall protection when working on step ladders", "Debris nets to protect raised floor surfaces"],
                "inspection_checklist": ["Minimum 300mm clearance from sprinkler heads", "Fiber raceway bend radius limiters installed at all drop-offs", "Tray grounding jumpers bonded every 12 meters"]
            },
            {
                "stage_num": 8,
                "title": "Structured Cabling & Network Core Distribution",
                "duration_days": 15,
                "status": "Pending",
                "progress_percent": 0,
                "dependencies": ["Stage 7: Overhead Cable Tray & Fiber Raceway Routing"],
                "description": "Pulling MTP/MPO 24-core trunk fiber from Central Patch Field to Top-of-Rack switches, Cat6A management copper termination, Fluke certification testing, and labeling.",
                "tools_equipment": ["Fluke Versiv DSX-8000 CableAnalyzer", "OTDR Fiber optic tester", "Fiber microscope / end-face cleaner", "Thermal heat-shrink label printers"],
                "safety_precautions": ["Laser safety precautions during fiber fault finding", "Proper cable pull tension monitoring"],
                "inspection_checklist": ["100% of fiber links pass Tier-2 OTDR attenuation loss budget", "Cat6A alien crosstalk compliance verified", "ANSI/TIA-606-B labeling compliance verified on both ends"]
            },
            {
                "stage_num": 9,
                "title": "VESDA Smoke Detection & Novec 1230 Clean Agent Fire Suppression",
                "duration_days": 12,
                "status": "Pending",
                "progress_percent": 0,
                "dependencies": ["Stage 3: Anti-Static Raised Floor System Installation", "Stage 6: Server Rack Framing & Aisle Alignment"],
                "description": "Dual-zone aspiration piping (VESDA) underfloor and at ceiling return air, high-pressure Novec 1230 piping, discharge nozzles, and abort switch installation.",
                "tools_equipment": ["Aspiration pipe drill hole gauges", "High-pressure pipe threading equipment", "Enclosure integrity fan door test rig"],
                "safety_precautions": ["System lock pins engaged during installation to prevent accidental discharge", "Audible/visual pre-discharge warning strobes tested"],
                "inspection_checklist": ["Enclosure Room Integrity Fan Test achieves 10-minute hold time retention", "VESDA sample point transport time < 60 seconds", "HVAC shutdown interlock confirmed on 2nd stage alarm"]
            },
            {
                "stage_num": 10,
                "title": "Integrated Testing, Thermal Commissioning & Load Banking",
                "duration_days": 14,
                "status": "Pending",
                "progress_percent": 0,
                "dependencies": ["Stage 5: Precision CRAC/CRAH Cooling", "Stage 8: Structured Cabling", "Stage 9: VESDA Smoke Detection"],
                "description": "Deployment of portable electric load banks to simulate 250kW IT thermal load, pull-the-plug black-start generator failover test, and thermal imaging mapping.",
                "tools_equipment": ["250kW Resistive heat load banks", "Calibrated FLIR thermal imaging cameras", "High-speed power quality event loggers", "Sound level decibel meter"],
                "safety_precautions": ["High voltage safety zone barricades", "Continuous thermal surveillance during 100% burn-in"],
                "inspection_checklist": ["Full load generator transfer executed within 10 seconds without UPS dropping load", "Hot-spot temperature delta across cold aisle containment < 2.0°C", "PUE calculated under full load test within target 1.25 +/- 0.05"]
            }
        ]

        cursor.execute("""
        INSERT INTO construction_plans (id, project_id, stages_json, total_duration_days, target_completion_date, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "plan-helios-01",
            proj_id,
            json.dumps(stages_data),
            124,
            "2026-12-15",
            now
        ))

        conn.commit()
    conn.close()

# -------------------------------------------------------------
# AUTHENTICATION & ACCESS CONTROL HELPERS
# -------------------------------------------------------------

def hash_password(password: str, salt: Optional[str] = None) -> tuple:
    if not salt:
        salt = secrets.token_hex(16)
    pwd_bytes = password.encode('utf-8')
    salt_bytes = salt.encode('utf-8')
    key = hashlib.pbkdf2_hmac('sha256', pwd_bytes, salt_bytes, 100000)
    return key.hex(), salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(new_hash, password_hash)

def seed_default_users_and_logs(cursor):
    cursor.execute("SELECT COUNT(*) as count FROM users")
    row = cursor.fetchone()
    count = row["count"] if isinstance(row, sqlite3.Row) else row[0]
    if count == 0:
        logger.info("Seeding default enterprise users and initial audit trails")
        now = datetime.now().isoformat()

        # 1. Lead Architect (Elena Rostova)
        pwd_hash, salt = hash_password("HeliosArchitect2026!")
        cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, salt, role, organization, status, designs_count, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "usr-elena-01",
            "Elena Rostova",
            "architect@helios-datacenter.com",
            pwd_hash,
            salt,
            "architect",
            "Helios Data Systems",
            "Active",
            42,
            now,
            now
        ))

        # 1b. Elena Alias (e.rostova@helios.internal)
        pwd_hash_alias, salt_alias = hash_password("HeliosArchitect2026!")
        cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, salt, role, organization, status, designs_count, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "usr-elena-02",
            "Elena Rostova",
            "e.rostova@helios.internal",
            pwd_hash_alias,
            salt_alias,
            "architect",
            "Helios Data Systems",
            "Active",
            42,
            now,
            now
        ))

        # 2. Infrastructure Director (Marcus Chen)
        pwd_hash_2, salt_2 = hash_password("HeliosArchitect2026!")
        cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, salt, role, organization, status, designs_count, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "usr-marcus-01",
            "Marcus Chen",
            "m.chen@hyperinfra.io",
            pwd_hash_2,
            salt_2,
            "architect",
            "HyperScale Infra",
            "Active",
            28,
            now,
            now
        ))

        # 3. SuperAdmin (superadmin@rackvision.internal)
        pwd_hash_admin, salt_admin = hash_password("SysAdminRack2026!")
        cursor.execute("""
        INSERT INTO users (id, name, email, password_hash, salt, role, organization, status, designs_count, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "usr-admin-01",
            "Platform SuperAdmin",
            "superadmin@rackvision.internal",
            pwd_hash_admin,
            salt_admin,
            "admin",
            "RackVision Infrastructure Operations",
            "Active",
            1429,
            now,
            now
        ))

        # Initial Audit Logs
        audit_events = [
            ("usr-admin-01", "Platform SuperAdmin", "SYSTEM_INITIALIZE", "SYSTEM", "Initial database schema bootstrap and enterprise roles configuration"),
            ("usr-elena-01", "Elena Rostova", "PROJECT_IMPORT", "proj-helios-01", "Imported Project Helios Hyperscale DC-1 CAD spatial envelope"),
            ("usr-elena-01", "Elena Rostova", "MODEL_INFERENCE", "OUTPUT_3", "Executed PBR + SDXL ControlNet hybrid perspective reconstruction"),
            ("usr-marcus-01", "Marcus Chen", "ASHRAE_AUDIT", "proj-helios-01", "Validated PUE 1.14 baseline against ASHRAE TC 9.9 thermal envelopes")
        ]
        for u_id, u_name, act, res, det in audit_events:
            cursor.execute("""
            INSERT INTO audit_logs (id, user_id, user_name, action, resource, details, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (f"aud-{uuid.uuid4().hex[:8]}", u_id, u_name, act, res, det, "127.0.0.1", now))

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return None
    user_dict = dict(user)
    if not verify_password(password, user_dict["password_hash"], user_dict["salt"]):
        conn.close()
        return None
    
    # Update last login
    now = datetime.now().isoformat()
    cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (now, user_dict["id"]))
    conn.commit()
    conn.close()

    # Log audit event
    log_audit_event(
        action="AUTH_LOGIN",
        resource="AUTH_GATE",
        details=f"User {user_dict['email']} authenticated successfully with role {user_dict.get('role', 'architect')}",
        user_id=user_dict["id"],
        user_name=user_dict["name"]
    )

    del user_dict["password_hash"]
    del user_dict["salt"]
    return user_dict

def create_user(name: str, email: str, password: str, role: str = "architect", organization: str = "Helios Data Systems") -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if exists
    cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
    if cursor.fetchone():
        conn.close()
        raise ValueError("An enterprise account with this email address already exists.")
    
    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    pwd_hash, salt = hash_password(password)
    now = datetime.now().isoformat()

    cursor.execute("""
    INSERT INTO users (id, name, email, password_hash, salt, role, organization, status, designs_count, created_at, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        name.strip(),
        email.strip().lower(),
        pwd_hash,
        salt,
        role,
        organization.strip(),
        "Active",
        0,
        now,
        now
    ))
    conn.commit()
    conn.close()

    log_audit_event(
        action="USER_PROVISION",
        resource=user_id,
        details=f"New enterprise account provisioned for {name} ({email}) with role {role}",
        user_id=user_id,
        user_name=name
    )

    return {
        "id": user_id,
        "name": name,
        "email": email.lower(),
        "role": role,
        "organization": organization,
        "status": "Active",
        "designs_count": 0,
        "created_at": now
    }

def create_session(user_id: str, duration_days: int = 7) -> str:
    token = f"rv_sess_{uuid.uuid4().hex}_{secrets.token_hex(8)}"
    now = datetime.now()
    expires_at = (now + timedelta(days=duration_days)).isoformat()
    created_at = now.isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO sessions (token, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
    """, (token, user_id, created_at, expires_at))
    conn.commit()
    conn.close()
    return token

def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT u.*, s.expires_at 
    FROM sessions s 
    JOIN users u ON s.user_id = u.id 
    WHERE s.token = ?
    """, (token.strip(),))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None
    row_dict = dict(row)
    # Check expiration
    expires_at = datetime.fromisoformat(row_dict["expires_at"])
    if expires_at < datetime.now():
        delete_session(token)
        return None
    
    del row_dict["password_hash"]
    del row_dict["salt"]
    return row_dict

def delete_session(token: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?", (token.strip(),))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def log_audit_event(action: str, resource: str, details: str = "", user_id: Optional[str] = None, user_name: Optional[str] = None, ip_address: str = "127.0.0.1"):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        log_id = f"aud-{uuid.uuid4().hex[:8]}"
        now = datetime.now().isoformat()
        cursor.execute("""
        INSERT INTO audit_logs (id, user_id, user_name, action, resource, details, ip_address, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (log_id, user_id or "system", user_name or "System Principal", action, resource, details, ip_address, now))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.warning("Failed to record audit event: %s", e)

def get_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_users() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role, organization, status, designs_count, created_at, last_login FROM users ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_system_telemetry() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as count FROM projects")
    projects_count = cursor.fetchone()["count"]
    
    cursor.execute("SELECT COUNT(*) as count FROM users")
    users_count = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM designs")
    designs_count = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM final_master_renders")
    master_renders_count = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) as count FROM audit_logs")
    audit_count = cursor.fetchone()["count"]

    conn.close()

    return {
        "status": "healthy",
        "api_service": "FastAPI Uvicorn (Active)",
        "database_persistence": "SQLite Relational WAL",
        "gpu_inference": "Colab SDXL + ControlNet Tunnel (pycloudflared)",
        "metrics": {
            "projects_total": projects_count,
            "users_total": users_count,
            "designs_total": designs_count,
            "master_renders_total": master_renders_count,
            "audit_logs_total": audit_count,
            "avg_pue": 1.14,
            "uptime_percent": 99.98
        },
        "timestamp": datetime.now().isoformat()
    }
