"""
ThermalService — Simplified educational thermal model for data-centre layouts.

⚠️  DISCLAIMER:
    This module implements a *simplified, educational* thermal model.
    It is NOT a validated Computational Fluid Dynamics (CFD) simulation.
    All temperature values are rough estimates derived from basic heat-transfer
    assumptions and should NOT be used for real engineering decisions.
    Consult a qualified mechanical/thermal engineer for production data-centre
    thermal management.

Model assumptions
-----------------
1. Supply air temperature (cold aisle): 18 °C (ASHRAE A1 baseline).
2. Airflow rate per CRAC/CRAH unit: 2.0 m³/s (typical 1-row CRAC assumption).
3. Temperature rise per rack:
       T_rack = supply_temp + (rack_power_kw / airflow_m3_per_s) * 20
   The factor 20 is an empirical constant (°C·s/kW·m³) that approximates the
   heat load contribution under simplified uniform-mixing conditions.
4. Return air (hot aisle) = average of all rack outlet temperatures.
5. Cooling coverage is the ratio of installed cooling capacity to total IT load.
"""

import logging
from typing import Any, Dict, List

logger = logging.getLogger("rackvision.thermal")

# ---------------------------------------------------------------------------
# Physical / modelling constants  (all clearly labelled as assumptions)
# ---------------------------------------------------------------------------
SUPPLY_TEMP_C: float = 18.0          # °C — cold-aisle supply temperature (ASHRAE A1)
AIRFLOW_PER_CRAC_M3S: float = 2.0   # m³/s — assumed airflow per CRAC unit
TEMP_RISE_FACTOR: float = 20.0       # °C·s/(kW·m³) — empirical mixing assumption
DEFAULT_RACK_POWER_KW: float = 10.0  # kW — assumed power when not specified

# Risk thresholds (°C)
_RISK_NORMAL_MAX: float = 24.0
_RISK_ELEVATED_MAX: float = 28.0
_RISK_HIGH_MAX: float = 30.0

DISCLAIMER: str = (
    "Educational thermal model — not validated CFD. "
    "All temperatures are estimates based on simplified heat transfer assumptions."
)

MODEL_ASSUMPTIONS: List[str] = [
    f"Supply air temperature (cold aisle): {SUPPLY_TEMP_C} °C (ASHRAE A1 baseline)",
    f"Airflow rate per CRAC/CRAH unit: {AIRFLOW_PER_CRAC_M3S} m³/s (typical single-row CRAC assumption)",
    f"Temperature rise formula: T_rack = supply_temp + (rack_power_kw / airflow_m3_per_s) × {TEMP_RISE_FACTOR} "
    f"(simplified uniform-mixing constant; units: °C·s·m⁻³·kW⁻¹)",
    "Return air temperature = arithmetic mean of all rack outlet temperatures",
    "Cooling coverage (%) = installed cooling capacity / total IT load × 100",
    "No airflow short-circuiting, bypass, or leakage is modelled",
    "All racks in a row share the same effective airflow supply",
]


def _risk_level(temp_c: float) -> str:
    """Classify an estimated rack outlet temperature into a risk category."""
    if temp_c < _RISK_NORMAL_MAX:
        return "normal"
    elif temp_c < _RISK_ELEVATED_MAX:
        return "elevated"
    elif temp_c <= _RISK_HIGH_MAX:
        return "high"
    return "critical"


class ThermalService:
    """
    Provides simplified thermal estimates for a data-centre 3D scene.

    Uses SimulatorService.get_scene() as the source of truth for rack and
    cooling-unit data.  All results are for educational/planning purposes only.
    """

    @staticmethod
    def calculate_thermal_model(project_id: str) -> Dict[str, Any]:
        """
        Compute an educational thermal estimate for *project_id*.

        Parameters
        ----------
        project_id : str
            The project whose 3D scene is used as input.

        Returns
        -------
        dict with keys:
            rack_temps            — per-rack temperature estimates
            hotspots              — subset where risk_level in {"high","critical"}
            cooling_units         — CRAC/CRAH unit inventory from scene
            supply_temp_c         — assumed cold-aisle supply temperature
            return_temp_c         — estimated hot-aisle return temperature
            airflow_m3_per_sec    — total effective airflow across all CRAC units
            model_assumptions     — list of modelling assumptions (plain-text)
            cooling_coverage_percent — ratio of installed capacity to IT load
            disclaimer            — mandatory disclaimer string
        """
        from app.services.simulator_service import SimulatorService

        scene = SimulatorService.get_scene(project_id)
        racks: List[Dict] = scene.get("racks", [])
        cooling_units_raw: List[Dict] = scene.get("cooling_units", [])

        # --- Effective airflow -----------------------------------------------
        num_crac = max(len(cooling_units_raw), 1)   # at least 1 to avoid /0
        total_airflow_m3s = num_crac * AIRFLOW_PER_CRAC_M3S

        # --- Per-rack temperature estimates ----------------------------------
        rack_temps: List[Dict[str, Any]] = []
        total_it_power_kw: float = 0.0

        for rack in racks:
            power_kw = float(rack.get("power_kw", DEFAULT_RACK_POWER_KW))
            total_it_power_kw += power_kw

            # Simplified heat-transfer model (see module docstring)
            estimated_temp = SUPPLY_TEMP_C + (power_kw / total_airflow_m3s) * TEMP_RISE_FACTOR
            estimated_temp = round(estimated_temp, 2)
            risk = _risk_level(estimated_temp)

            rack_temps.append({
                "rack_id": rack.get("id", "unknown"),
                "rack_name": rack.get("name", "Unknown Rack"),
                "x": rack.get("x", 0.0),
                "y": rack.get("y", 1.1),
                "z": rack.get("z", 0.0),
                "estimated_temp_c": estimated_temp,
                "risk_level": risk,
                "power_kw": power_kw,
            })

        # --- Hotspots --------------------------------------------------------
        hotspots = [r for r in rack_temps if r["risk_level"] in ("high", "critical")]

        # --- Return (hot-aisle) temperature ----------------------------------
        if rack_temps:
            return_temp_c = round(
                sum(r["estimated_temp_c"] for r in rack_temps) / len(rack_temps), 2
            )
        else:
            return_temp_c = SUPPLY_TEMP_C  # no racks → no heat load

        # --- Cooling units inventory -----------------------------------------
        cooling_units_out: List[Dict[str, Any]] = []
        total_cooling_capacity_kw: float = 0.0
        for cu in cooling_units_raw:
            cap_kw = float(cu.get("capacity_kw", 95.0))
            total_cooling_capacity_kw += cap_kw
            cooling_units_out.append({
                "id": cu.get("id", "unknown"),
                "name": cu.get("name", "Cooling Unit"),
                "x": cu.get("x", 0.0),
                "y": cu.get("y", 1.25),
                "z": cu.get("z", 0.0),
                "capacity_kw": cap_kw,
            })

        # --- Cooling coverage ------------------------------------------------
        if total_it_power_kw > 0:
            cooling_coverage_pct = round(
                min((total_cooling_capacity_kw / total_it_power_kw) * 100, 200.0), 1
            )
        else:
            cooling_coverage_pct = 100.0  # no load → fully covered by definition

        logger.info(
            "Thermal model computed for project %s: %d racks, %d hotspots, "
            "total IT load %.1f kW, cooling %.1f kW, coverage %.0f%%",
            project_id, len(rack_temps), len(hotspots),
            total_it_power_kw, total_cooling_capacity_kw, cooling_coverage_pct
        )

        return {
            "rack_temps": rack_temps,
            "hotspots": hotspots,
            "cooling_units": cooling_units_out,
            "supply_temp_c": SUPPLY_TEMP_C,
            "return_temp_c": return_temp_c,
            "airflow_m3_per_sec": round(total_airflow_m3s, 2),
            "model_assumptions": MODEL_ASSUMPTIONS,
            "cooling_coverage_percent": cooling_coverage_pct,
            "disclaimer": DISCLAIMER,
        }
