import logging
from typing import Dict, Any
from app.services.simulator_service import SimulatorService
from app.services.layout_service import LayoutService

logger = logging.getLogger("rackvision.analytics")

class AnalyticsService:
    @staticmethod
    def calculate_metrics(project_id: str) -> Dict[str, Any]:
        """Calculates quantitative physical, power, thermal, and network metrics conditioned on the confirmed layout."""
        layout = LayoutService.get_layout(project_id)
        scene = SimulatorService.get_scene(project_id)

        # Default fallbacks
        width = 16.0
        length = 22.0
        height = 4.5
        total_floor_area_sqm = round(width * length, 1)

        if layout and "room" in layout:
            room = layout["room"]
            width = float(room.get("width_m", width))
            length = float(room.get("length_m", length))
            height = float(room.get("height_m", height))
            total_floor_area_sqm = float(room.get("area_sqm", round(width * length, 1)))
        elif scene and "room_dims" in scene:
            room_dims = scene["room_dims"]
            width = float(room_dims.get("width", width))
            length = float(room_dims.get("length", length))
            height = float(room_dims.get("height", height))
            total_floor_area_sqm = round(width * length, 1)

        # Count components
        racks = []
        cooling_units = []
        if layout and "components" in layout:
            racks = [c for c in layout["components"] if c.get("category") == "server_infrastructure"]
            cooling_units = [c for c in layout["components"] if c.get("category") == "cooling_infrastructure"]
        elif scene:
            racks = scene.get("racks", [])
            cooling_units = scene.get("cooling_units", [])

        rack_count = len(racks)

        # Total IT Power calculation
        if layout and racks:
            total_it_power_kw = sum(r.get("properties", {}).get("power_kw", 10.0) for r in racks)
        elif scene and racks:
            total_it_power_kw = sum(r.get("power_kw", 10.0) for r in racks)
        else:
            total_it_power_kw = 120.0

        avg_density = round(total_it_power_kw / rack_count, 2) if rack_count > 0 else 8.0

        # Usable IT footprint (rack area + immediate clearance)
        rack_footprint = rack_count * (0.8 * 1.2)
        usable_it_area_sqm = round(rack_footprint * 2.2, 1)
        space_utilization = round((usable_it_area_sqm / total_floor_area_sqm) * 100, 1) if total_floor_area_sqm > 0 else 45.0
        space_utilization = min(95.0, space_utilization)

        # Thermal and Cooling Metrics
        required_cooling_kw = round(total_it_power_kw * 1.15, 1)
        cooling_capacity_tons = round(required_cooling_kw / 3.51685, 1)

        installed_cooling_kw = sum(
            c.get("properties", {}).get("capacity_kw", c.get("capacity_kw", 95.0))
            for c in cooling_units
        ) if cooling_units else max(150.0, required_cooling_kw * 1.3)
        installed_cooling_kw = round(installed_cooling_kw, 1)

        heat_dissipation_btu = round(total_it_power_kw * 3412.142, 0)

        # Power Usage Effectiveness (PUE)
        estimated_pue = 1.22
        pue_breakdown = {
            "it_equipment_percent": 82.0,
            "cooling_systems_percent": 13.2,
            "power_distribution_losses_percent": 3.6,
            "lighting_and_building_auxiliary_percent": 1.2
        }

        # Energy consumption
        facility_power_kw = total_it_power_kw * estimated_pue
        annual_energy_mwh = round((facility_power_kw * 8760) / 1000, 1)
        carbon_footprint = round(annual_energy_mwh * 0.385, 1)

        # Cable Infrastructure estimations
        cable_requirements = {
            "cat6a_copper_horizontal_meters": round(rack_count * 24 * (width + length) * 0.7, 0),
            "om4_multimode_fiber_meters": round(rack_count * 12 * (width + length) * 0.9, 0),
            "os2_singlemode_spine_fiber_meters": round(rack_count * 4 * (width + length) * 1.2, 0),
            "grounding_copper_busbar_meters": round((width + length) * 2 + rack_count * 2.5, 0)
        }

        return {
            "project_id": project_id,
            "rack_count": rack_count,
            "room_dimensions": {"width": width, "length": length, "height": height},
            "total_floor_area_sqm": total_floor_area_sqm,
            "usable_it_area_sqm": usable_it_area_sqm,
            "space_utilization_percent": space_utilization,
            "rack_density_kw_per_rack": avg_density,
            "total_it_power_kw": round(total_it_power_kw, 1),
            "facility_total_power_kw": round(facility_power_kw, 1),
            "required_cooling_kw": required_cooling_kw,
            "installed_cooling_kw": installed_cooling_kw,
            "cooling_capacity_tons": cooling_capacity_tons,
            "cooling_redundancy": "N+1 Redundant" if installed_cooling_kw >= required_cooling_kw * 1.25 else "N Redundant",
            "heat_dissipation_btu_hr": heat_dissipation_btu,
            "annual_energy_consumption_mwh": annual_energy_mwh,
            "carbon_footprint_tonnes_yr": carbon_footprint,
            "estimated_pue": estimated_pue,
            "pue_breakdown": pue_breakdown,
            "cable_requirements_meters": cable_requirements
        }
