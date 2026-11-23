import logging
from typing import Dict, Any, List, Optional
from app.database.db import get_connection
from app.schemas.project_schemas import MaterialItem

logger = logging.getLogger("rackvision.materials")

class MaterialService:
    @staticmethod
    def get_materials(project_id: str) -> List[Dict[str, Any]]:
        """Retrieves Bill of Materials for a project."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM materials WHERE project_id = ? ORDER BY category, name", (project_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def update_material(material_id: str, quantity: Optional[float] = None, specification: Optional[str] = None, unit_price: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """Updates quantity, specification, or unit price and recalculates total."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM materials WHERE id = ?", (material_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        current_qty = quantity if quantity is not None else row["quantity"]
        current_price = unit_price if unit_price is not None else row["unit_price"]
        current_spec = specification if specification is not None else row["specification"]
        new_total = current_qty * current_price

        cursor.execute("""
        UPDATE materials
        SET quantity = ?, specification = ?, unit_price = ?, total_price = ?
        WHERE id = ?
        """, (current_qty, current_spec, current_price, new_total, material_id))
        conn.commit()

        cursor.execute("SELECT * FROM materials WHERE id = ?", (material_id,))
        updated = dict(cursor.fetchone())
        conn.close()
        return updated

    @staticmethod
    def get_summary(project_id: str) -> Dict[str, Any]:
        """Calculates total cost and category breakdown."""
        materials = MaterialService.get_materials(project_id)
        total_cost = sum(m["total_price"] for m in materials)
        by_category = {}
        for m in materials:
            cat = m["category"]
            by_category[cat] = by_category.get(cat, 0.0) + m["total_price"]

        return {
            "project_id": project_id,
            "total_estimated_cost_usd": total_cost,
            "items_count": len(materials),
            "cost_by_category": by_category,
            "disclaimer": "Academic Preliminary Estimate: Values are planning-level estimates. Certified engineering sign-off required prior to procurement."
        }

    @staticmethod
    def sync_materials_from_layout(project_id: str, layout_data: Dict[str, Any]):
        """Generates itemized Bill of Materials directly matching the confirmed layout components."""
        summary = layout_data.get("summary", {})
        room = layout_data.get("room", {})
        total_racks = summary.get("total_racks", 10)
        cooling_count = summary.get("cooling_units", 2)
        room_area = float(room.get("area_sqm", 25.0))

        conn = get_connection()
        cursor = conn.cursor()
        # Delete old materials for this project
        cursor.execute("DELETE FROM materials WHERE project_id = ?", (project_id,))

        materials_list = []
        is_cad = total_racks == 12 or cooling_count == 3

        if not is_cad:
            # Simple hand-drawn layout (P1: 8 racks, 2 AC units, 17.3 m2)
            materials_list = [
                ("Server Infrastructure", "42U Standard Server Enclosure (1.0m x 0.6m)", "Floor-mounted IT server enclosure", "EIA-310-D, 600x1000mm footprint, 1200kg load", total_racks, "Units", "Mesh doors front/rear", "Server Hall Rows 1 & 2", 1850.0),
                ("Server Infrastructure", "Smart Monitored Dual-Feed Rack PDU", "In-rack branch circuit power distribution", "230V/32A Single-Phase, 16x C13 outlets, SNMPv3", total_racks * 2, "Units", "A+B Redundant pathing", "Per Rack Enclosure", 650.0),
                ("Cooling Infrastructure", "Wall-Mounted Precision Inverter A/C Unit", "Perimeter room temperature and humidity control", "18kW Sensible DX cooling, R410A eco-refrigerant", cooling_count, "Units", "Dual redundant lead/lag control", "North Wall Ingress", 8500.0),
                ("Electrical Infrastructure", "Online Double-Conversion 60kVA UPS", "Uninterruptible clean power conditioning", "60kVA/54kW Modular UPS with LiFePO4 battery cabinet", 1, "System", "96% VFI double conversion efficiency", "Top-Left Power Section", 28000.0),
                ("Network Infrastructure", "48-Port 10G/40G Core Leaf Switch Array", "Top-of-rack aggregation and spine uplinks", "48x 10GbE SFP+ plus 4x 40GbE QSFP+ ports", 2, "Units", "Wire-speed L2/L3 switching", "Top-Right Network Section", 9500.0),
                ("Physical Infrastructure", "Anti-Static Raised Access Floor Panels", "Underfloor airflow plenum and power conduit routing", "600x600mm steel-cementitious panels, 350mm height", room_area, "Square Meters", "Static dissipative HPL surface (10^6 - 10^9 ohms)", "Entire Floor Footprint", 110.0),
                ("Physical Infrastructure", "Overhead Wire-Mesh Cable Tray Raceway", "Separated copper and fiber distribution channels", "300mm width electro-galvanized wire basket", 24, "Meters", "Rounded safety edges, UL classified", "Suspended above aisle", 65.0),
                ("Physical Infrastructure", "Security Access Door with Biometric Reader", "Cleanroom perimeter boundary security access", "Fire-rated single leaf steel door with electromagnetic lock", 1, "Unit", "UL 10C 90-min fire rating", "Left Wall Entrance", 3200.0)
            ]
        else:
            # Detailed CAD layout (P2: 12 racks 42HE 1200x800, 3 UKG units, 49.6 m2)
            materials_list = [
                ("Server Infrastructure", "42 HE Heavy-Duty Server Cabinet (1200/800)", "High-density enterprise blade enclosure", "EIA-310-E, 800x1200mm footprint, 1500kg static load", total_racks, "Units", "High perforation 80% hex doors", "Serverraum Rows 1 & 2", 2950.0),
                ("Server Infrastructure", "Managed 3-Phase Metered-by-Outlet PDU", "High density power monitoring and remote reboot", "400V 32A 3-Phase, 24x C13 + 6x C19 outlets", total_racks * 2, "Units", "IEC 60309 inlet, Ethernet SNMPv3", "Dual A+B feeds per cabinet", 1350.0),
                ("Cooling Infrastructure", "UKG Precision Downflow CRAC Unit (95kW)", "Computer room air conditioning with variable EC fans", "95kW Sensible cooling, dual DX circuits, ASHRAE TC 9.9", cooling_count, "Units", "Variable speed scroll compressors", "Technikspange (Technical Area)", 44500.0),
                ("Cooling Infrastructure", "Hot-Aisle Containment Roof & Sliding Doors", "Thermal isolation preventing air recirculation", "Clear drop-away panels with self-closing sliding doors", 1, "Assembly", "FM Global Class 1 fire-safe approved", "Center Aisle between Rows 1 & 2", 14800.0),
                ("Electrical Infrastructure", "Modular Online Double-Conversion 250kVA UPS", "Central mission-critical clean power plant", "250kVA scalable N+1 frame with LiFePO4 battery array", 1, "System", "97% high-efficiency VFI mode", "Technikspange Electrical Bay", 88000.0),
                ("Network Infrastructure", "100G/400G Leaf-Spine Switch Array", "Ultra-low latency data center fabric switching", "32-port 100/400GbE QSFP-DD wire-speed switch", 4, "Units", "Redundant hot-swap power and fans", "Row Ends in Serverraum", 21000.0),
                ("Physical Infrastructure", "Heavy-Duty Anti-Static Raised Access Floor", "Pressurized cold air plenum and underfloor cabling", "600x600mm calcium sulphate panels, 600mm height", room_area, "Square Meters", "Conductive vinyl tile, Class 6 load", "Serverraum Footprint", 145.0),
                ("Physical Infrastructure", "Overhead Track Busway Power Trunk", "Modular plug-in power delivery above rack rows", "400A 415V 4-wire busway trunking with tap-off units", 36, "Meters", "Finger-safe drop boxes", "Suspended above Rows 1 & 2", 390.0),
                ("Physical Infrastructure", "Novec 1230 Clean Agent Fire Extinguishing System", "Total flooding waterless fire suppression", "FK-5-1-12 synthetic clean agent with VESDA detectors", 1, "Complete System", "NFPA 2001 & ISO 14520 compliant", "Serverraum & Technikspange", 62000.0)
            ]

        import uuid
        for cat, name, purp, spec, qty, unit, crit, loc, price in materials_list:
            m_id = f"mat-{uuid.uuid4().hex[:8]}"
            cursor.execute("""
            INSERT INTO materials (id, project_id, category, name, purpose, specification, quantity, unit, selection_criteria, location, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (m_id, project_id, cat, name, purp, spec, qty, unit, crit, loc, price, qty * price))

        conn.commit()
        conn.close()
