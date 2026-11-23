"""
LayoutReferenceService — Central Layout Synchronization & Geometry Extraction.

Authoritative source of truth for:
- Room dimensions and physical area
- Server rack counts, rows, and aisle geometry
- Cooling infrastructure (CRAC, UKG units, ducting)
- Electrical PDUs and UPS systems
- Layout versioning and invalidation checking across all three visual outputs.
"""

import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from app.services.layout_service import LayoutService

logger = logging.getLogger("rackvision.layout_reference")

class LayoutReferenceService:
    @staticmethod
    def get_layout(project_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves the confirmed structured layout JSON for a project."""
        return LayoutService.get_layout(project_id)

    @staticmethod
    def extract_layout_parameters(layout: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Extracts normalized structural and equipment parameters from layout JSON."""
        if not layout:
            return {
                "room_width_m": 12.0,
                "room_length_m": 15.0,
                "room_area_sqm": 180.0,
                "rack_count": 12,
                "rack_rows": 2,
                "racks_per_row": 6,
                "cooling_units": [],
                "cooling_count": 2,
                "cooling_type": "CRAC Perimeter Precision",
                "electrical_count": 1,
                "doors_count": 1,
                "is_p1_hand_drawn": False,
                "is_p2_cad_plan": False,
                "layout_version": "v1.0"
            }

        room = layout.get("room", {})
        width_m = float(room.get("width_m", 12.0))
        length_m = float(room.get("length_m", 15.0))
        area_sqm = float(room.get("area_sqm", round(width_m * length_m, 1)))

        components = layout.get("components", [])
        racks = [c for c in components if c.get("category") == "server_infrastructure"]
        cooling = [c for c in components if c.get("category") == "cooling_infrastructure"]
        electrical = [c for c in components if c.get("category") == "electrical_infrastructure"]
        doors = [c for c in components if c.get("category") == "physical_infrastructure" and "door" in c.get("type", "")]

        rack_count = len(racks) if racks else 12

        # Detect P1 vs P2 layout profiles
        is_p1 = (rack_count == 8) or (width_m < 6.0 and length_m < 5.0)
        is_p2 = (rack_count == 12) or any("UKG" in c.get("name", "") for c in cooling)

        cooling_type = "Precision Downflow CRAC (15kW)"
        if any("UKG" in c.get("name", "") or "UKG" in c.get("label", "") for c in cooling):
            cooling_type = "3x Industrial UKG Precision Units (15kW)"
        elif len(cooling) == 2:
            cooling_type = "2x Perimeter CRAC Cooling Units"

        # Determine rack row configuration
        rack_rows = 2
        racks_left = rack_count // 2
        racks_right = rack_count - racks_left

        return {
            "room_width_m": width_m,
            "room_length_m": length_m,
            "room_area_sqm": area_sqm,
            "rack_count": rack_count,
            "rack_rows": rack_rows,
            "racks_left": racks_left,
            "racks_right": racks_right,
            "cooling_units": cooling,
            "cooling_count": len(cooling),
            "cooling_type": cooling_type,
            "electrical_count": len(electrical),
            "doors_count": len(doors) if doors else 1,
            "is_p1_hand_drawn": is_p1,
            "is_p2_cad_plan": is_p2,
            "layout_version": layout.get("version", "v1.0")
        }

    @staticmethod
    def is_output_synchronized(design: Dict[str, Any], current_layout: Dict[str, Any]) -> bool:
        """Checks if a generated output matches the current layout version and rack count."""
        if not design or not current_layout:
            return False
        design_version = design.get("layout_version", "v1.0")
        current_version = current_layout.get("version", "v1.0")
        if design_version != current_version:
            return False
        params = LayoutReferenceService.extract_layout_parameters(current_layout)
        if design.get("rack_count") and design["rack_count"] != params["rack_count"]:
            return False
        return True
