"""
RackVision AI — Advanced Features Acceptance Tests
Tests the 8 scenarios for the advanced capabilities:
1. Sketch to layout conditioning & distinctness
2. 3D Scene reconstruction & synchronization from layout JSON
3. AI Design Copilot natural language command processing & undo/redo
4. Interactive Component selection & specifications resolution
5. Thermal & Airflow Simulation with educational disclaimer & hotspot detection
6. Room dimension modification & area synchronization
7. PDF Engineering report generation
8. Google Colab GPU graceful fallback when not configured
"""

import sys
import os
import json

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))

TEST_PROJECT_ID = "proj-helios-01"

def print_header(name: str):
    print(f"\n{'='*70}")
    print(f"  TEST: {name}")
    print(f"{'='*70}")

def assert_ok(condition: bool, msg: str):
    if condition:
        print(f"  [PASS] {msg}")
    else:
        print(f"  [FAIL] {msg}")
        raise AssertionError(msg)

def run_tests():
    passed = 0
    failed = 0

    # ---------------------------------------------------------
    # TEST 1: Layout Conditioning & Distinctness
    # ---------------------------------------------------------
    print_header("T1: Layout-Conditioned AI Design Prompt Distinctness")
    try:
        from app.services.ai_generation_service import AIGenerationService
        from app.services.layout_service import LayoutService

        # P1 layout
        p1_layout = {
            "room": {"width_m": 4.8, "length_m": 3.6, "height_m": 3.0},
            "summary": {"total_racks": 8, "cooling_units": 2, "doors": 1},
            "components": [
                {"id": "r1", "category": "server_infrastructure", "type": "server_rack", "label": "Rack 1", "source": "extracted"},
                {"id": "c1", "category": "cooling_infrastructure", "type": "cooling_unit", "label": "A/C Unit", "source": "extracted"}
            ]
        }
        # P2 layout
        p2_layout = {
            "room": {"width_m": 7.2, "length_m": 6.8, "height_m": 3.6},
            "summary": {"total_racks": 12, "cooling_units": 3, "electrical_units": 1},
            "components": [
                {"id": "r1", "category": "server_infrastructure", "type": "server_rack", "label": "Rack 1", "source": "extracted"},
                {"id": "u1", "category": "electrical_infrastructure", "type": "electrical_unit", "label": "USV Unit", "source": "extracted"}
            ]
        }

        p1_pos, p1_neg = AIGenerationService.construct_prompts_from_layout(
            p1_layout, "cyberpunk", "neon_cyan_purple", "cold_aisle_contained", "perimeter_crac"
        )
        p2_pos, p2_neg = AIGenerationService.construct_prompts_from_layout(
            p2_layout, "cyberpunk", "neon_cyan_purple", "hot_aisle_contained", "chilled_water"
        )

        assert_ok(p1_pos != p2_pos, "P1 and P2 generated completely distinct architectural prompts")
        assert_ok("8" in p1_pos or "8 server racks" in p1_pos or "4.8" in p1_pos, "P1 prompt incorporates extracted dimensions/counts")
        assert_ok("12" in p2_pos or "12 server racks" in p2_pos or "7.2" in p2_pos, "P2 prompt incorporates extracted dimensions/counts")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # ---------------------------------------------------------
    # TEST 2: 3D Scene Reconstruction from Layout JSON
    # ---------------------------------------------------------
    print_header("T2: 3D Scene Reconstruction & Sync from Central Layout JSON")
    try:
        from app.services.simulator_service import SimulatorService

        test_layout = {
            "room": {"width_m": 12.0, "length_m": 16.0, "height_m": 4.0},
            "components": [
                {"id": "rack-sync-1", "category": "server_infrastructure", "type": "server_rack", "label": "Sync Rack 1", "x": -2.0, "y": 1.1, "z": -1.5, "width_m": 0.8, "height_m": 2.2, "depth_m": 1.0, "power_kw": 12.0, "status": "Online"},
                {"id": "rack-sync-2", "category": "server_infrastructure", "type": "server_rack", "label": "Sync Rack 2", "x": 0.0, "y": 1.1, "z": -1.5, "width_m": 0.8, "height_m": 2.2, "depth_m": 1.0, "power_kw": 12.0, "status": "Online"},
                {"id": "rack-sync-3", "category": "server_infrastructure", "type": "server_rack", "label": "Sync Rack 3", "x": 2.0, "y": 1.1, "z": -1.5, "width_m": 0.8, "height_m": 2.2, "depth_m": 1.0, "power_kw": 12.0, "status": "Online"},
                {"id": "crac-sync-1", "category": "cooling_infrastructure", "type": "cooling_unit", "label": "Sync CRAC", "x": -4.0, "y": 1.25, "z": -6.0, "width_m": 1.6, "height_m": 2.4, "depth_m": 0.9, "capacity_kw": 80.0}
            ]
        }
        synced_scene = SimulatorService.sync_scene_from_layout("proj-adv-test", test_layout)
        assert_ok(len(synced_scene["racks"]) == 3, f"Synchronized 3 racks into 3D scene (got {len(synced_scene['racks'])})")
        assert_ok(len(synced_scene["cooling_units"]) == 1, "Synchronized cooling unit into 3D scene")
        assert_ok(synced_scene["room_dims"]["width"] == 12.0, "Room width updated to 12.0m")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # ---------------------------------------------------------
    # TEST 3: AI Design Copilot Command & Undo/Redo
    # ---------------------------------------------------------
    print_header("T3: AI Design Copilot NLP Command Execution & Undo/Redo")
    try:
        from app.services.copilot_service import CopilotService
        from app.services.layout_service import LayoutService

        proj_copilot = "proj-copilot-test"
        # Initialize with baseline layout
        init_layout = {
            "room": {"width_m": 10.0, "length_m": 14.0, "height_m": 3.5},
            "components": [
                {"id": f"rack-{i}", "category": "server_infrastructure", "type": "server_rack", "label": f"Rack {i}", "x": float(i), "y": 1.1, "z": 0.0, "width_m": 0.8, "height_m": 2.2, "depth_m": 1.0, "power_kw": 8.0, "source": "manual"}
                for i in range(4)
            ],
            "summary": {"total_racks": 4}
        }
        LayoutService.save_layout(proj_copilot, init_layout)

        # Process command: "Add 4 server racks"
        cmd_result = CopilotService.process_command(proj_copilot, "Add 4 server racks")
        assert_ok(cmd_result["layout_updated"] is True, "Layout updated flag is True")
        assert_ok("4 rack" in cmd_result["confirmation_text"].lower(), "Confirmation text mentions adding racks")

        # Verify layout after command
        updated_layout = LayoutService.get_layout(proj_copilot)
        racks_after = [c for c in updated_layout.get("components", []) if c.get("type") == "server_rack"]
        assert_ok(len(racks_after) == 8, f"Rack count increased from 4 to 8 (got {len(racks_after)})")

        # Test Undo
        undo_res = CopilotService.undo(proj_copilot)
        assert_ok(undo_res["status"] == "undo_applied", "Undo applied successfully")
        layout_undone = LayoutService.get_layout(proj_copilot)
        racks_undone = [c for c in layout_undone.get("components", []) if c.get("type") == "server_rack"]
        assert_ok(len(racks_undone) == 4, f"After undo, rack count restored to 4 (got {len(racks_undone)})")

        # Test Redo
        redo_res = CopilotService.redo(proj_copilot)
        assert_ok(redo_res["status"] == "redo_applied", "Redo applied successfully")
        layout_redone = LayoutService.get_layout(proj_copilot)
        racks_redone = [c for c in layout_redone.get("components", []) if c.get("type") == "server_rack"]
        assert_ok(len(racks_redone) == 8, f"After redo, rack count returned to 8 (got {len(racks_redone)})")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # ---------------------------------------------------------
    # TEST 4: Component Selection & Information Panel
    # ---------------------------------------------------------
    print_header("T4: Component Selection Details & Construction Specifications")
    try:
        from app.services.simulator_service import SimulatorService
        from app.api.endpoints import get_component_details

        # Ensure default scene for test project
        SimulatorService.reset_scene_to_default("proj-helios-01")

        # Query details for rack-01
        details = get_component_details("proj-helios-01", "rack-01")
        assert_ok(details["component_id"] == "rack-01", "Component ID matches query")
        assert_ok(details["category"] == "Server Infrastructure", "Category is Server Infrastructure")
        assert_ok("purpose" in details and len(details["purpose"]) > 20, "Contains comprehensive purpose description")
        assert_ok("specifications" in details, "Contains technical specifications dictionary")
        assert_ok("materials" in details and len(details["materials"]) >= 3, "Contains BOM material requirements")
        assert_ok("installation_procedure" in details and len(details["installation_procedure"]) >= 4, "Contains numbered installation steps")
        assert_ok("safety_considerations" in details and len(details["safety_considerations"]) >= 2, "Contains safety considerations")
        assert_ok(details["construction_stage"] == 3, "Mapped to construction stage 3")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # ---------------------------------------------------------
    # TEST 5: Educational Thermal Simulation & Hotspot Detection
    # ---------------------------------------------------------
    print_header("T5: Thermal Simulation Model with Educational Disclaimer")
    try:
        from app.services.thermal_service import ThermalService

        thermal = ThermalService.calculate_thermal_model("proj-helios-01")
        assert_ok("rack_temps" in thermal and len(thermal["rack_temps"]) > 0, "Computes rack-level temperatures")
        assert_ok("disclaimer" in thermal, "Thermal model includes mandatory disclaimer")
        assert_ok("educational" in thermal["disclaimer"].lower() or "not validated" in thermal["disclaimer"].lower(), "Disclaimer explicitly notes educational / non-CFD nature")
        assert_ok("model_assumptions" in thermal and len(thermal["model_assumptions"]) >= 3, "Lists mathematical and physical assumptions")
        assert_ok("cooling_coverage_percent" in thermal, "Calculates cooling coverage percentage")

        # Validate risk classification
        valid_risks = {"normal", "elevated", "high", "critical"}
        for r in thermal["rack_temps"]:
            assert_ok(r["risk_level"] in valid_risks, f"Rack {r['rack_id']} has valid risk level {r['risk_level']}")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # ---------------------------------------------------------
    # TEST 6: Room Dimension Update & Area Sync
    # ---------------------------------------------------------
    print_header("T6: Room Dimension Modification & Analytics Area Recalculation")
    try:
        from app.services.copilot_service import CopilotService
        from app.services.analytics_service import AnalyticsService

        proj_dim = "proj-dim-test"
        base_layout = {
            "room": {"width_m": 10.0, "length_m": 10.0, "height_m": 3.5},
            "components": [],
            "summary": {}
        }
        from app.services.layout_service import LayoutService
        LayoutService.save_layout(proj_dim, base_layout)

        # Update room width to 20m via Copilot
        res = CopilotService.process_command(proj_dim, "Set room width to 20")
        assert_ok(res["layout_updated"] is True, "Width update command succeeded")

        # Check analytics
        analytics = AnalyticsService.calculate_metrics(proj_dim)
        assert_ok(analytics["total_floor_area_sqm"] == 200.0, f"Area dynamically updated to 200.0 m² (got {analytics['total_floor_area_sqm']})")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # ---------------------------------------------------------
    # TEST 7: Downloadable Engineering Report Generation
    # ---------------------------------------------------------
    print_header("T7: Downloadable Engineering PDF Report Generation")
    try:
        from app.services.report_service import ReportService
        from app.core.config import settings

        pdf_path = ReportService.generate_pdf_report("proj-helios-01")
        assert_ok(os.path.exists(pdf_path), f"Report generated at {pdf_path}")
        file_size = os.path.getsize(pdf_path)
        assert_ok(file_size > 1000, f"Report PDF is non-empty ({file_size} bytes)")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # ---------------------------------------------------------
    # TEST 8: Google Colab Graceful Fallback When Offline/Unset
    # ---------------------------------------------------------
    print_header("T8: Google Colab GPU Adapter Graceful Fallback")
    try:
        from app.services.colab_inference_service import ColabInferenceService

        # Temporarily ensure COLAB_INFERENCE_URL is not set
        old_val = os.environ.get("COLAB_INFERENCE_URL")
        try:
            if "COLAB_INFERENCE_URL" in os.environ:
                del os.environ["COLAB_INFERENCE_URL"]

            health = ColabInferenceService.health_check()
            assert_ok(health["configured"] is False, "Reports configured=False when env var is absent")
            assert_ok(health["health"] == "not_configured", "Reports health='not_configured'")
            assert_ok(health["mode"] == "procedural", "Gracefully falls back to mode='procedural'")
            assert_ok("procedural" in health["message"].lower(), "Message informs user of procedural synthesis fallback")
        finally:
            if old_val is not None:
                os.environ["COLAB_INFERENCE_URL"] = old_val

        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # ---------------------------------------------------------
    # Summary
    # ---------------------------------------------------------
    print(f"\n{'='*70}")
    print(f"  ADVANCED ACCEPTANCE TESTS SUMMARY: {passed} PASSED, {failed} FAILED (TOTAL 8)")
    print(f"{'='*70}\n")
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
