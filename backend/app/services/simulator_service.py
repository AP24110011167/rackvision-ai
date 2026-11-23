import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.database.db import get_connection
from app.schemas.project_schemas import Scene3DData, RackItem, CoolingItem, PDUItem, CableTrayItem

logger = logging.getLogger("rackvision.simulator")

class SimulatorService:
    @staticmethod
    def get_scene(project_id: str) -> Dict[str, Any]:
        """Fetches the 3D scene data for a project, or initializes default."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM scenes_3d WHERE project_id = ?", (project_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                "id": row["id"],
                "project_id": row["project_id"],
                "room_dims": json.loads(row["room_dims_json"]),
                "racks": json.loads(row["racks_json"]),
                "cooling_units": json.loads(row["cooling_units_json"]),
                "pdus": json.loads(row["pdus_json"]),
                "cable_trays": json.loads(row["cable_trays_json"]),
                "updated_at": row["updated_at"]
            }

        # If not present, create default
        return SimulatorService.reset_scene_to_default(project_id)

    @staticmethod
    def update_scene(project_id: str, scene_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves updated 3D scene configuration to SQLite."""
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()

        room_dims_json = json.dumps(scene_data.get("room_dims", {"width": 16.0, "length": 22.0, "height": 4.5}))
        racks_json = json.dumps(scene_data.get("racks", []))
        cooling_units_json = json.dumps(scene_data.get("cooling_units", []))
        pdus_json = json.dumps(scene_data.get("pdus", []))
        cable_trays_json = json.dumps(scene_data.get("cable_trays", []))

        cursor.execute("SELECT id FROM scenes_3d WHERE project_id = ?", (project_id,))
        row = cursor.fetchone()

        if row:
            cursor.execute("""
            UPDATE scenes_3d
            SET room_dims_json = ?, racks_json = ?, cooling_units_json = ?, pdus_json = ?, cable_trays_json = ?, updated_at = ?
            WHERE project_id = ?
            """, (room_dims_json, racks_json, cooling_units_json, pdus_json, cable_trays_json, now, project_id))
        else:
            scene_id = f"scene-{project_id}"
            cursor.execute("""
            INSERT INTO scenes_3d (id, project_id, room_dims_json, racks_json, cooling_units_json, pdus_json, cable_trays_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (scene_id, project_id, room_dims_json, racks_json, cooling_units_json, pdus_json, cable_trays_json, now))

        conn.commit()
        conn.close()

        return SimulatorService.get_scene(project_id)

    @staticmethod
    def reset_scene_to_default(project_id: str) -> Dict[str, Any]:
        """Resets the scene layout to standardized enterprise dual-row cold-aisle setup."""
        room_dims = {"width": 16.0, "length": 22.0, "height": 4.5}
        racks = []
        rack_id = 1
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
            {"id": "tray-row-a", "x": 0.0, "y": 2.8, "z": -3.0, "length": 15.0, "width": 0.6, "orientation": "along_row"},
            {"id": "tray-row-b", "x": 0.0, "y": 2.8, "z": 3.0, "length": 15.0, "width": 0.6, "orientation": "along_row"},
            {"id": "tray-cross-1", "x": -7.0, "y": 3.0, "z": 0.0, "length": 7.0, "width": 0.5, "orientation": "cross"},
            {"id": "tray-cross-2", "x": 7.0, "y": 3.0, "z": 0.0, "length": 7.0, "width": 0.5, "orientation": "cross"}
        ]

        default_data = {
            "room_dims": room_dims,
            "racks": racks,
            "cooling_units": cooling_units,
            "pdus": pdus,
            "cable_trays": cable_trays
        }

        return SimulatorService.update_scene(project_id, default_data)

    @staticmethod
    def sync_scene_from_layout(project_id: str, layout_data: Dict[str, Any]) -> Dict[str, Any]:
        """Reconstructs the 3D simulator scene graph directly from the structured layout JSON."""
        room_info = layout_data.get("room", {})
        room_dims = {
            "width": float(room_info.get("width_m", 16.0)),
            "length": float(room_info.get("length_m", 22.0)),
            "height": float(room_info.get("height_m") or 3.6)
        }

        racks = []
        cooling_units = []
        pdus = []
        cable_trays = []

        components = layout_data.get("components", [])
        for c in components:
            ctype = c.get("type")
            cat = c.get("category")
            if ctype == "server_rack" or cat == "server_infrastructure":
                racks.append({
                    "id": c.get("id"),
                    "name": c.get("label", "Server Rack"),
                    "row": c.get("row", "Row-A"),
                    "x": float(c.get("x", 0.0)),
                    "y": float(c.get("y", 1.1)),
                    "z": float(c.get("z", 0.0)),
                    "width": float(c.get("width_m", 0.8)),
                    "height": float(c.get("height_m", 2.2)),
                    "depth": float(c.get("depth_m", 1.0)),
                    "type": "AI Compute" if "AI" in c.get("label", "") else "Server Blade",
                    "power_kw": float(c.get("power_kw", 10.0)),
                    "status": c.get("status", "Online"),
                    "servers_count": int(c.get("servers_count", 18))
                })
            elif ctype == "cooling_unit" or cat == "cooling_infrastructure":
                cooling_units.append({
                    "id": c.get("id"),
                    "name": c.get("label", "Cooling Unit"),
                    "x": float(c.get("x", 0.0)),
                    "y": float(c.get("y", 1.25)),
                    "z": float(c.get("z", 0.0)),
                    "width": float(c.get("width_m", 1.5)),
                    "height": float(c.get("height_m", 2.2)),
                    "depth": float(c.get("depth_m", 0.8)),
                    "capacity_kw": float(c.get("capacity_kw", 95.0))
                })
            elif ctype == "electrical_unit" or cat == "electrical_infrastructure":
                pdus.append({
                    "id": c.get("id"),
                    "name": c.get("label", "Power Cabinet"),
                    "x": float(c.get("x", 0.0)),
                    "y": float(c.get("y", 1.0)),
                    "z": float(c.get("z", 0.0)),
                    "width": float(c.get("width_m", 1.0)),
                    "height": float(c.get("height_m", 2.0)),
                    "depth": float(c.get("depth_m", 0.8)),
                    "rating_kva": float(c.get("rating_kva", 150.0))
                })

        # Generate cable trays along rack rows
        if racks:
            rows = set(r["row"] for r in racks)
            for row in rows:
                row_racks = [r for r in racks if r["row"] == row]
                z_avg = sum(r["z"] for r in row_racks) / len(row_racks)
                x_min = min(r["x"] for r in row_racks) - 0.5
                x_max = max(r["x"] for r in row_racks) + 0.5
                cable_trays.append({
                    "id": f"tray-{row}",
                    "x": (x_min + x_max) / 2.0,
                    "y": room_dims["height"] * 0.75,
                    "z": z_avg,
                    "length": max(2.0, x_max - x_min),
                    "width": 0.5,
                    "orientation": "along_row"
                })

        scene_data = {
            "room_dims": room_dims,
            "racks": racks,
            "cooling_units": cooling_units,
            "pdus": pdus,
            "cable_trays": cable_trays
        }

        return SimulatorService.update_scene(project_id, scene_data)
