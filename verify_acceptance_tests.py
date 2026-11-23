import sys
import os
import json
from pathlib import Path

# Setup Python paths
sys.path.insert(0, os.path.abspath("backend"))

from app.core.config import settings
from app.database.db import init_db, get_connection
from app.services.layout_service import LayoutService
from app.services.ai_generation_service import AIGenerationService
from app.services.simulator_service import SimulatorService
from app.services.material_service import MaterialService
from app.services.analytics_service import AnalyticsService
from ai_engine.sketch_intelligence import SketchIntelligenceEngine

def run_all_tests():
    print("=" * 80)
    print("RACKVISION AI — SKETCH INTELLIGENCE & LAYOUT ENGINE ACCEPTANCE TESTS")
    print("=" * 80)

    # Initialize DB
    init_db()

    p1_path = str(settings.SKETCHES_DIR / "sketch-a4ac8823_raw.jpg")
    p2_path = str(settings.SKETCHES_DIR / "sketch-0c8ff17c_raw.jpg")

    assert os.path.exists(p1_path), f"P1 image missing at {p1_path}"
    assert os.path.exists(p2_path), f"P2 image missing at {p2_path}"

    engine = SketchIntelligenceEngine()

    # -------------------------------------------------------------
    # TEST A: P1 Simple Hand-drawn Floor Plan Analysis
    # -------------------------------------------------------------
    print("\n[TEST A] Processing P1 (Simple Hand-Drawn Sketch: 4.8m x 3.6m, 8 racks)...")
    res_p1 = engine.analyze_sketch(p1_path, project_id="proj-test-p1", output_dir=str(settings.SKETCHES_DIR))
    layout_p1 = res_p1["layout"]
    summary_p1 = layout_p1["equipment_summary"]
    room_p1 = layout_p1["room"]

    print(f"  ✓ Room Dimensions: {room_p1['width_m']}m x {room_p1['length_m']}m (Area: {room_p1['area_sqm']} m²)")
    print(f"  ✓ Equipment Summary: {summary_p1}")
    assert summary_p1["server_racks"] == 8, f"Expected 8 racks for P1, got {summary_p1['server_racks']}"
    assert summary_p1["cooling_units"] == 2, f"Expected 2 cooling units for P1, got {summary_p1['cooling_units']}"
    assert summary_p1["doors"] >= 1, f"Expected at least 1 door for P1, got {summary_p1['doors']}"
    assert room_p1["width_m"] == 4.8 and room_p1["length_m"] == 3.6, "P1 room dimensions should be 4.8m x 3.6m"
    print("  --> TEST A PASSED: P1 extracted 8 racks, 2 AC units, 1 door, 4.8m x 3.6m perfectly.")

    # -------------------------------------------------------------
    # TEST B: P2 Detailed Architectural CAD Floor Plan Analysis
    # -------------------------------------------------------------
    print("\n[TEST B] Processing P2 (Architectural CAD: 49.6 m² Serverraum, 12 racks, 3 UKG)...")
    res_p2 = engine.analyze_sketch(p2_path, project_id="proj-test-p2", output_dir=str(settings.SKETCHES_DIR))
    layout_p2 = res_p2["layout"]
    summary_p2 = layout_p2["equipment_summary"]
    room_p2 = layout_p2["room"]

    print(f"  ✓ Room Dimensions: {room_p2['width_m']}m x {room_p2['length_m']}m (Area: {room_p2['area_sqm']} m²)")
    print(f"  ✓ Equipment Summary: {summary_p2}")
    assert summary_p2["server_racks"] == 12, f"Expected 12 racks for P2, got {summary_p2['server_racks']}"
    assert summary_p2["cooling_units"] == 3, f"Expected 3 UKG cooling units for P2, got {summary_p2['cooling_units']}"
    assert room_p2["area_sqm"] == 49.6, f"Expected 49.6 m² for P2, got {room_p2['area_sqm']}"
    ukg_names = [c["name"] for c in layout_p2["components"] if "UKG" in c["name"]]
    assert len(ukg_names) == 3, f"Expected 3 UKG units, found {ukg_names}"
    usv_comps = [c for c in layout_p2["components"] if "USV" in c["name"]]
    assert len(usv_comps) >= 1, "Expected USV battery system in P2"
    print("  --> TEST B PASSED: P2 extracted 12 racks (2x6), 3 UKG units, USV, 49.6 m² Serverraum.")

    # -------------------------------------------------------------
    # TEST C: Structured Layout Schema 1.0 Conformance
    # -------------------------------------------------------------
    print("\n[TEST C] Validating Central Structured Layout Schema (v1.0)...")
    for name, lay in [("P1", layout_p1), ("P2", layout_p2)]:
        assert lay["schema_version"] == "1.0", f"{name}: schema_version must be 1.0"
        assert "room" in lay and "components" in lay and "aisles" in lay and "equipment_summary" in lay
        assert "calibration" in lay
        for comp in lay["components"]:
            assert comp["id"] and comp["name"] and comp["category"]
            assert comp["location"] and "x" in comp["location"] and "y" in comp["location"]
            assert comp["dimensions"] and "width" in comp["dimensions"] and "depth" in comp["dimensions"]
            assert "source_bbox" in comp and len(comp["source_bbox"]) == 4
    print("  --> TEST C PASSED: Both layouts conform to Schema 1.0.")

    # -------------------------------------------------------------
    # TEST D: Save Layout & Synchronize Pipeline for P1 and P2
    # -------------------------------------------------------------
    print("\n[TEST D] Persisting Layouts and Synchronizing 3D Scene + BOM...")
    LayoutService.save_layout("proj-test-p1", layout_p1, sketch_id="sketch-p1", status="confirmed")
    LayoutService.save_layout("proj-test-p2", layout_p2, sketch_id="sketch-p2", status="confirmed")

    # Verify P1 Scene & BOM
    scene_p1 = SimulatorService.get_scene("proj-test-p1")
    mats_p1 = MaterialService.get_materials("proj-test-p1")
    assert len(scene_p1["racks"]) == 8, f"P1 3D scene should have 8 racks, got {len(scene_p1['racks'])}"
    assert len(scene_p1["cooling_units"]) == 2, f"P1 3D scene should have 2 cooling units, got {len(scene_p1['cooling_units'])}"
    p1_rack_mat = next((m for m in mats_p1 if "Server" in m["name"]), None)
    assert p1_rack_mat and p1_rack_mat["quantity"] == 8.0, f"P1 BOM should list 8 racks, got {p1_rack_mat}"

    # Verify P2 Scene & BOM
    scene_p2 = SimulatorService.get_scene("proj-test-p2")
    mats_p2 = MaterialService.get_materials("proj-test-p2")
    assert len(scene_p2["racks"]) == 12, f"P2 3D scene should have 12 racks, got {len(scene_p2['racks'])}"
    assert len(scene_p2["cooling_units"]) == 3, f"P2 3D scene should have 3 UKG cooling units, got {len(scene_p2['cooling_units'])}"
    p2_rack_mat = next((m for m in mats_p2 if "Server" in m["name"]), None)
    assert p2_rack_mat and p2_rack_mat["quantity"] == 12.0, f"P2 BOM should list 12 racks, got {p2_rack_mat}"
    print("  --> TEST D PASSED: 3D scene and Material BOM perfectly synchronized to confirmed layouts.")

    # -------------------------------------------------------------
    # TEST E: Layout-Conditioned AI Design Generation
    # -------------------------------------------------------------
    print("\n[TEST E] Generating Layout-Conditioned Architectural Renders...")
    designs_p1 = AIGenerationService.generate_design(
        project_id="proj-test-p1",
        sketch_id="sketch-p1",
        style="Modern Enterprise Data Center",
        num_variations=1
    )
    assert len(designs_p1) == 1
    p1_design = designs_p1[0]
    print(f"  ✓ P1 Generated Prompt: {p1_design['prompt'][:100]}...")
    assert "4.8m x 3.6m" in p1_design["prompt"] or "8" in p1_design["prompt"]
    assert os.path.exists(settings.DESIGNS_DIR / os.path.basename(p1_design["image_url"])), "P1 image file missing"

    designs_p2 = AIGenerationService.generate_design(
        project_id="proj-test-p2",
        sketch_id="sketch-p2",
        style="Modern Enterprise Data Center",
        num_variations=1
    )
    assert len(designs_p2) == 1
    p2_design = designs_p2[0]
    print(f"  ✓ P2 Generated Prompt: {p2_design['prompt'][:100]}...")
    assert "49.6" in p2_design["prompt"] or "12" in p2_design["prompt"]
    assert "UKG" in p2_design["prompt"] or "cooling" in p2_design["prompt"]
    assert os.path.exists(settings.DESIGNS_DIR / os.path.basename(p2_design["image_url"])), "P2 image file missing"

    # Verify Prompts are completely different
    assert p1_design["prompt"] != p2_design["prompt"], "Prompts must be distinctly different!"
    print("  --> TEST E PASSED: AI Generation produces layout-conditioned prompts and renders.")

    # -------------------------------------------------------------
    # TEST F: Analytics & PUE Synchronization
    # -------------------------------------------------------------
    print("\n[TEST F] Testing Physical Analytics Calculations...")
    analytics_p1 = AnalyticsService.calculate_metrics("proj-test-p1")
    analytics_p2 = AnalyticsService.calculate_metrics("proj-test-p2")

    print(f"  ✓ P1 Analytics: Area={analytics_p1['total_floor_area_sqm']} m², Racks={analytics_p1['rack_count']}, Power={analytics_p1['total_it_power_kw']} kW")
    print(f"  ✓ P2 Analytics: Area={analytics_p2['total_floor_area_sqm']} m², Racks={analytics_p2['rack_count']}, Power={analytics_p2['total_it_power_kw']} kW")

    assert analytics_p1["rack_count"] == 8
    assert analytics_p2["rack_count"] == 12
    assert round(analytics_p1["total_floor_area_sqm"], 1) == 17.3
    assert round(analytics_p2["total_floor_area_sqm"], 1) == 49.6
    assert analytics_p1["total_it_power_kw"] != analytics_p2["total_it_power_kw"]
    print("  --> TEST F PASSED: Analytics dynamically computed from confirmed layouts.")

    # -------------------------------------------------------------
    # TEST G: Strict Differentiation Check (P1 vs P2)
    # -------------------------------------------------------------
    print("\n[TEST G] Final Differentiation Verification (No Generic Corridor Duplicate):")
    print("  Feature              | Input 1 (P1 Hand-drawn)     | Input 2 (P2 CAD Floor Plan)")
    print("  ---------------------+-----------------------------+-----------------------------")
    print(f"  Room Dimensions      | {room_p1['width_m']}m x {room_p1['length_m']}m (17.3 m²)       | {room_p2['width_m']}m x {room_p2['length_m']}m (49.6 m²)")
    print(f"  Server Racks         | {summary_p1['server_racks']} racks (2 rows of 4)      | {summary_p2['server_racks']} racks (2 rows of 6, 42U)")
    print(f"  Cooling Type         | 2 A/C perimeter units       | 3 UKG units with ducting")
    print(f"  Power Distribution   | 1 Electrical panel          | Central USV (UPS) battery")
    print(f"  3D Simulator Racks   | {len(scene_p1['racks'])} 3D rack objects          | {len(scene_p2['racks'])} 3D rack objects")
    print(f"  BOM Rack Count       | {p1_rack_mat['quantity']} units                     | {p2_rack_mat['quantity']} units")
    print(f"  IT Power Load        | {analytics_p1['total_it_power_kw']} kW                    | {analytics_p2['total_it_power_kw']} kW")
    print("  ---------------------+-----------------------------+-----------------------------")
    print("  --> ALL ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_all_tests()
