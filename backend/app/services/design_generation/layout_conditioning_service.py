"""
LayoutConditioningService — Conditioning and Prompt Synthesis Service.

Converts structured layout JSON and user's visual quality targets into
high-precision prompts strictly conditioning Output 3 FLUX.2 Pro image generation:
- Target 1 (Primary): Clean white powder-coated cabinet frames (#F3F5F8), transparent tempered glass doors,
  dark server blades with electric cyan and cold-white micro-LED link lights, electric blue floor-wash LED glow,
  polished graphite floor with central row of silver rectangular perforated ventilation air tiles,
  modular ceiling with recessed linear daylight LEDs and louvers, double white exit doors.
- Target 2: Overhead round ventilation ducting, clear glass containment partitions, dual-tone floor tiles.
- Target 3: Telephoto server rack close-up, wire mesh cable trays, micro-LED activity lights.
"""

from typing import Dict, Any, List, Optional, Tuple
import logging

logger = logging.getLogger("rackvision.layout_conditioning")


class LayoutConditioningService:
    """
    Extracts structural conditioning metrics and constructs the authoritative
    architectural prompts for FLUX.2 Pro image generation.
    """

    @staticmethod
    def extract_layout_metrics(layout: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Extracts rack counts, room dimensions, and cooling infrastructure from layout JSON."""
        room = layout.get("room", {}) if layout else {}
        room_w = float(room.get("width_m", 12.0))
        room_l = float(room.get("length_m", 15.0))
        room_area = float(room.get("area_sqm", round(room_w * room_l, 1)))

        components = layout.get("components", []) if layout else []
        racks = [c for c in components if c.get("category") == "server_infrastructure"]
        cooling_units = [c for c in components if c.get("category") == "cooling_infrastructure"]
        electrical = [c for c in components if c.get("category") == "electrical_infrastructure"]
        doors = [c for c in components if c.get("category") == "physical_infrastructure" and "door" in c.get("type", "")]

        rack_count = len(racks) if racks else 12

        return {
            "room_width_m": room_w,
            "room_length_m": room_l,
            "room_area_sqm": room_area,
            "rack_count": rack_count,
            "racks": racks,
            "cooling_units": cooling_units,
            "electrical_units": electrical,
            "doors": doors,
            "has_ukg": any("ukg" in str(c.get("name", "")).lower() or "ukg" in str(c.get("label", "")).lower() or "ukg" in str(c.get("id", "")).lower() for c in cooling_units),
        }

    @staticmethod
    def build_flux_master_prompt(
        layout: Optional[Dict[str, Any]],
        style: str = "Modern Enterprise Data Center",
        camera_viewpoint: str = "cinematic_central_aisle",
        lighting: str = "Professional White Lighting",
        user_prompt: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Constructs the high-fidelity prompt for FLUX.2 Pro conditioned on the
        confirmed layout JSON and visual references.
        """
        metrics = LayoutConditioningService.extract_layout_metrics(layout)
        rack_count = metrics["rack_count"]
        room_w = metrics["room_width_m"]
        room_l = metrics["room_length_m"]
        room_area = metrics["room_area_sqm"]

        tech_area = layout.get("technical_area", {}) if layout else {}
        has_tech = bool(tech_area.get("present", False)) or metrics["has_ukg"]
        has_hot_aisle = any("hot" in a.get("type", "").lower() for a in (layout.get("aisles", []) if layout else [])) or metrics["has_ukg"]

        if rack_count == 8:
            rack_desc = "exactly 8 enterprise server cabinets arranged in two parallel rows of 4 (4.8m room length)"
        elif rack_count == 12:
            rack_desc = "exactly 12 enterprise 42U server cabinets arranged in two rows of 6 (8.3m room length, 1200x800mm each)"
        else:
            rack_desc = f"exactly {rack_count} enterprise server cabinets arranged in two parallel rows"

        cooling_desc = "perimeter downflow CRAC precision cooling units"
        if metrics["has_ukg"]:
            cooling_desc = "3 heavy-duty industrial UKG precision downflow cooling units with acoustic exhaust ducting (15 kW each) in the dedicated right-side technical area"
        elif len(metrics["cooling_units"]) == 2:
            cooling_desc = "2 wall-mounted precision A/C cooling units along the perimeter"

        # Viewpoint-specific optical perspective
        if camera_viewpoint == "wide_angle_architecture":
            viewpoint_desc = "elevated three-quarter architectural perspective overview capturing the entire 49.6 m² server room, both parallel rows of six enterprise racks (12 racks total), central enclosed hot-aisle containment, fire-rated partition wall, and adjacent right-side technical utility room with all three 15 kW UKG precision downflow cooling units in view, shot on Hasselblad H6D-100c at f/8.0, ISO 64, razor-sharp architectural focus"
        elif camera_viewpoint == "cinematic_central_aisle":
            if has_tech or rack_count >= 12:
                viewpoint_desc = "angled architectural perspective inside the server room looking along the two rows of six enterprise server cabinets and central hot-aisle containment without generic corridor symmetry, showing cabinet row A on the left, cabinet row B on the right, overhead translucent glass containment canopy with structural ribs, central perforated ventilation air tiles, and ending at the fire-rated partition wall with interconnecting T30 door, shot on Sony FE 24mm f/1.4 GM at f/5.6"
            else:
                viewpoint_desc = "perspective architectural photograph looking down the central aisle, shot on Hasselblad H6D-100c at f/8.0, ISO 64, razor-sharp focus"
        elif camera_viewpoint == "cooling_infrastructure":
            viewpoint_desc = "dedicated technical utility plant (Technikspange) architectural perspective photograph showcasing all three heavy-duty 15 kW UKG industrial precision downflow cooling units aligned along the facility wall, distinct acoustic exhaust ducting plenums, front intake louvers, fire-rated acoustic partition wall, and interconnecting T30 security fire door to the server room, shot on Sony FE 24mm f/1.4 GM at f/4.0"
        elif camera_viewpoint == "isometric_axonometric":
            viewpoint_desc = "elevated axonometric architectural view showcasing dual-row containment structure and cooling plant, shot on 50mm Zeiss Planar at f/5.6"
        elif camera_viewpoint == "server_rack_closeup":
            viewpoint_desc = "telephoto architectural close-up of 42U server rack faceplates and micro-LED indicators, shot on Sony FE 85mm f/1.4 GM"
        else:
            viewpoint_desc = "elevated three-quarter architectural perspective overview capturing both server cabinet rows, enclosed central hot-aisle containment, fire-rated partition wall, and dedicated right-side technical utility room with all three UKG cooling units in view, shot on Hasselblad H6D-100c at f/8.0, ISO 64, razor-sharp architectural focus"

        if (49.0 <= room_area <= 50.0) or rack_count == 12 or has_tech:
            room_desc = "exact room footprint: 8.267 m x 6.0 m (8.3m x 6.0m), approximately 49.6 m² server room with adjacent dedicated technical plant (Technikspange)"
        else:
            room_desc = f"exact room footprint: {room_w:.1f}m x {room_l:.1f}m ({room_area:.1f} m²)"

        positive_tokens = [
            f"master architectural interior photograph of a hyperscale {style}",
            viewpoint_desc,
            room_desc,
            f"server cabinets: {rack_desc}, pristine white powder-coated outer cabinet frames (#F3F5F8) with completely transparent tempered glass doors",
            "clearly visible dark server hardware inside cabinets, vertical columns of cyan 480nm transceivers and cold-white micro-LED activity indicator lights",
            "cabinet details: black vertical latch handles on white door frames, continuous electric blue under-rack floor-wash LED glow strip along both cabinet rows",
            f"cooling infrastructure: {cooling_desc}",
            "central aisle floor: row of rectangular perforated silver metal ventilation air tiles with dark horizontal airflow slots centered between cabinet rows",
            "flooring: dark polished high-gloss anti-static access floor tiles with vivid specular reflections of overhead ceiling troffers and blue LED floor glow",
            "ceiling: white modular acoustic ceiling panels with suspended wire mesh cable ladder trays, recessed linear daylight LED troffers (5000K), and rectangular ventilation louvers",
            "physically based materials, ray-traced global illumination, authentic architectural photography, Architectural Digest standard"
        ]

        if has_hot_aisle:
            positive_tokens.append("central hot-aisle containment: translucent overhead containment canopy with structural ribs and end sliding doors enclosing the 1.5m wide hot exhaust corridor between the two cabinet rows")
        if has_tech:
            positive_tokens.append("technical separation: fire-rated partition wall separating server room from technical area (Technikspange) with interconnecting T30 security door")

        if metrics["electrical_units"]:
            positive_tokens.append("dedicated power distribution unit with emergency shutdown controls")
        if metrics["doors"]:
            positive_tokens.append("architectural steel security door with illuminated keypad")
        if user_prompt:
            positive_tokens.insert(0, user_prompt)

        negative_tokens = [
            "top-down view, aerial view, bird-eye view, floor plan, blueprint, architectural plan, CAD schematic, orthographic view, flat diagram, map, 2D drawing, schematic elevation",
            "symmetrical corridor, centered aisle tunnel, forced symmetrical hallway, mirrored equipment, mirrored symmetrical rows against opposite walls, symmetrical rear double exit doors, generic server room, invented extra rows, missing cooling units, occluded technical room",
            "blurry, noisy, cartoon, 3d render artifacts, CGI video game look, flat illustration, sketch, drawing, low resolution, messy unmanaged cables, neon laser clutter, fantasy sci-fi glowing corridors, generic empty room, distorted perspective, oversaturated, text watermark, fake plastic materials"
        ]

        return ", ".join(positive_tokens), ", ".join(negative_tokens)
