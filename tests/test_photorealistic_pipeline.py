"""
RackVision AI — Photorealistic Architectural Visualization Test Suite
Validates all requirements:
TEST 1: Generate technical and photorealistic outputs for Input 1 (P1 hand-drawn sketch)
TEST 2: Generate technical and photorealistic outputs for Input 2 (P2 detailed CAD floor plan)
TEST 3: Verify outputs strictly correspond to their respective confirmed layouts (P1: 8 racks; P2: 12 racks)
TEST 4: Verify photorealistic output does not simply reuse the technical visualization
TEST 5: Verify different projects do not receive the same cached image
TEST 6: Verify both images can be independently fetched and downloaded
TEST 7: Verify independent generation and error handling
TEST 8: Verify multiple camera viewpoints produce distinct perspective renderings
"""

import os
import sys
import hashlib
from pathlib import Path

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))

from app.core.config import settings
from app.services.layout_service import LayoutService
from app.services.ai_generation_service import AIGenerationService
from app.services.photorealistic_service import PhotorealisticService, CAMERA_VIEWPOINTS
from ai_engine.sketch_intelligence import SketchIntelligenceEngine

def get_design_path(image_url: str) -> str:
    filename = os.path.basename(image_url)
    return str(settings.DESIGNS_DIR / filename)

def file_hash(path: str) -> str:
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def print_header(title: str):
    print(f"\n{'='*75}")
    print(f"  {title}")
    print(f"{'='*75}")

def assert_ok(condition: bool, msg: str):
    if condition:
        print(f"  ✓ [PASS] {msg}")
    else:
        print(f"  ✗ [FAIL] {msg}")
        raise AssertionError(msg)

def run_photorealistic_tests():
    engine = SketchIntelligenceEngine()
    sketches_dir = Path(settings.SKETCHES_DIR)
    p1_path = str(sketches_dir / "sketch-a4ac8823_raw.jpg")
    p2_path = str(sketches_dir / "sketch-0c8ff17c_raw.jpg")

    assert os.path.exists(p1_path), f"P1 sketch missing at {p1_path}"
    assert os.path.exists(p2_path), f"P2 sketch missing at {p2_path}"

    passed = 0
    failed = 0

    # -------------------------------------------------------------
    # TEST 1: Process P1 (Hand-drawn) & Generate Both Outputs
    # -------------------------------------------------------------
    print_header("TEST 1: Process P1 Hand-Drawn Sketch & Generate Both Outputs")
    try:
        p1_proj = "proj-test-photo-p1"
        res_p1 = engine.analyze_sketch(p1_path, project_id=p1_proj, output_dir=str(sketches_dir))
        layout_p1 = res_p1["layout"]
        LayoutService.save_layout(p1_proj, layout_p1, sketch_id="sketch-p1", status="confirmed")

        # Output 1: Technical Architectural Visualization
        tech_p1 = AIGenerationService.generate_design(
            project_id=p1_proj,
            sketch_id="sketch-p1",
            style="Modern Enterprise Data Center",
            rack_count=8,
            num_variations=1
        )[0]

        # Output 2: Ultra-Photorealistic Architectural Visualization
        photo_p1 = PhotorealisticService.generate_photorealistic_visualization(
            project_id=p1_proj,
            sketch_id="sketch-p1",
            style="Modern Enterprise Data Center",
            camera_viewpoint="front_symmetrical",
            resolution="1024x768",
            num_variations=1
        )[0]

        assert_ok(tech_p1["output_type"] == "technical", "Output 1 marked with output_type='technical'")
        assert_ok(photo_p1["output_type"] == "photorealistic", "Output 2 marked with output_type='photorealistic'")
        assert_ok(os.path.exists(get_design_path(tech_p1["image_url"])), "Technical image file exists on disk")
        assert_ok(os.path.exists(get_design_path(photo_p1["image_url"])), "Photorealistic image file exists on disk")
        print(f"    Technical Image:      {tech_p1['image_url']}")
        print(f"    Photorealistic Image: {photo_p1['image_url']}")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # -------------------------------------------------------------
    # TEST 2: Process P2 (CAD Floor Plan) & Generate Both Outputs
    # -------------------------------------------------------------
    print_header("TEST 2: Process P2 CAD Floor Plan & Generate Both Outputs")
    try:
        p2_proj = "proj-test-photo-p2"
        res_p2 = engine.analyze_sketch(p2_path, project_id=p2_proj, output_dir=str(sketches_dir))
        layout_p2 = res_p2["layout"]
        LayoutService.save_layout(p2_proj, layout_p2, sketch_id="sketch-p2", status="confirmed")

        # Output 1: Technical Architectural Visualization
        tech_p2 = AIGenerationService.generate_design(
            project_id=p2_proj,
            sketch_id="sketch-p2",
            style="Modern Enterprise Data Center",
            rack_count=12,
            num_variations=1
        )[0]

        # Output 2: Ultra-Photorealistic Architectural Visualization
        photo_p2 = PhotorealisticService.generate_photorealistic_visualization(
            project_id=p2_proj,
            sketch_id="sketch-p2",
            style="Hyperscale Cloud Data Center",
            camera_viewpoint="wide_angle",
            resolution="1024x768",
            num_variations=1
        )[0]

        assert_ok(tech_p2["output_type"] == "technical", "P2 Output 1 is technical")
        assert_ok(photo_p2["output_type"] == "photorealistic", "P2 Output 2 is photorealistic")
        assert_ok(os.path.exists(get_design_path(tech_p2["image_url"])), "P2 technical image exists")
        assert_ok(os.path.exists(get_design_path(photo_p2["image_url"])), "P2 photorealistic image exists")
        print(f"    Technical Image:      {tech_p2['image_url']}")
        print(f"    Photorealistic Image: {photo_p2['image_url']}")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # -------------------------------------------------------------
    # TEST 3: Verify Outputs Strictly Correspond to Respective Layouts
    # -------------------------------------------------------------
    print_header("TEST 3: Verify Visual Output Conditioning on Confirmed Layouts")
    try:
        # P1 must reflect 8 racks, 4.8m x 3.6m
        p1_racks = [c for c in layout_p1["components"] if c.get("category") == "server_infrastructure"]
        assert_ok(len(p1_racks) == 8, f"P1 layout confirmed with 8 racks (got {len(p1_racks)})")
        assert_ok(layout_p1["room"]["width_m"] == 4.8, "P1 room width is 4.8m")

        # P2 must reflect 12 racks, 3 UKG, 49.6 m²
        p2_racks = [c for c in layout_p2["components"] if c.get("category") == "server_infrastructure"]
        assert_ok(len(p2_racks) == 12, f"P2 layout confirmed with 12 racks (got {len(p2_racks)})")
        assert_ok(layout_p2["room"]["area_sqm"] == 49.6, "P2 room area is 49.6 m²")

        # Verify photorealistic prompts encode these exact layout features
        p1_prompt = photo_p1["prompt"]
        p2_prompt = photo_p2["prompt"]
        assert_ok("8 enterprise server cabinets" in p1_prompt, "P1 photorealistic prompt encodes 8 cabinets")
        assert_ok("12 enterprise" in p2_prompt, "P2 photorealistic prompt encodes 12 cabinets")
        assert_ok("4.8m" in p1_prompt, "P1 photorealistic prompt contains 4.8m room length")
        assert_ok("49.6" in p2_prompt, "P2 photorealistic prompt contains 49.6 m² area")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # -------------------------------------------------------------
    # TEST 4: Photorealistic Output Does Not Reuse Technical Visualization
    # -------------------------------------------------------------
    print_header("TEST 4: Verify Photorealistic Does Not Simply Reuse Technical Image")
    try:
        p1_tech_path = get_design_path(tech_p1["image_url"])
        p1_photo_path = get_design_path(photo_p1["image_url"])

        hash_tech = file_hash(p1_tech_path)
        hash_photo = file_hash(p1_photo_path)

        assert_ok(hash_tech != hash_photo, "P1 Technical and Photorealistic have completely distinct file hashes")
        assert_ok(tech_p1["id"] != photo_p1["id"], "Different unique generation IDs assigned")
        assert_ok(tech_p1["output_type"] != photo_p1["output_type"], "Different output_type labels")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # -------------------------------------------------------------
    # TEST 5: Verify Different Projects Do Not Receive Cached Images
    # -------------------------------------------------------------
    print_header("TEST 5: Verify Cross-Project Differentiation (No Shared Caches)")
    try:
        p2_tech_path = get_design_path(tech_p2["image_url"])
        p2_photo_path = get_design_path(photo_p2["image_url"])

        hash_p1_photo = file_hash(get_design_path(photo_p1["image_url"]))
        hash_p2_photo = file_hash(p2_photo_path)

        assert_ok(hash_p1_photo != hash_p2_photo, "P1 and P2 photorealistic visualizations are completely distinct files")
        assert_ok(photo_p1["project_id"] != photo_p2["project_id"], "Project IDs strictly partitioned")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # -------------------------------------------------------------
    # TEST 6: Independent Image Fetching and Downloadability
    # -------------------------------------------------------------
    print_header("TEST 6: Independent Image Fetching and File Integrity")
    try:
        from app.api.endpoints import get_project_design_outputs

        outputs_p1 = get_project_design_outputs(p1_proj)
        assert_ok(outputs_p1["technical"] is not None, "Outputs query returns technical design")
        assert_ok(outputs_p1["photorealistic"] is not None, "Outputs query returns photorealistic design")
        assert_ok(outputs_p1["technical"]["id"] == tech_p1["id"], "Technical ID matches")
        assert_ok(outputs_p1["photorealistic"]["id"] == photo_p1["id"], "Photorealistic ID matches")

        # Verify sizes are non-trivial (>10KB)
        tech_size = os.path.getsize(get_design_path(tech_p1["image_url"]))
        photo_size = os.path.getsize(get_design_path(photo_p1["image_url"]))
        assert_ok(tech_size > 15000, f"Technical image is high-res ({tech_size} bytes)")
        assert_ok(photo_size > 15000, f"Photorealistic image is high-res ({photo_size} bytes)")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # -------------------------------------------------------------
    # TEST 7: Independent Generation and Error Isolation
    # -------------------------------------------------------------
    print_header("TEST 7: Independent Generation and Error Isolation")
    try:
        from app.schemas.project_schemas import GenerationRequest, PhotorealisticGenerationRequest
        from app.api.endpoints import generate_technical_design, generate_photorealistic_design

        isolated_proj = "proj-test-isolated"
        # 1. Generate ONLY technical
        tech_only = generate_technical_design(GenerationRequest(
            project_id=isolated_proj,
            rack_count=10,
            style="Industrial Data Center"
        ))[0]
        assert_ok(tech_only["output_type"] == "technical", "Technical generated independently")

        # 2. Generate ONLY photorealistic
        photo_only = generate_photorealistic_design(PhotorealisticGenerationRequest(
            project_id=isolated_proj,
            style="Industrial Data Center",
            camera_viewpoint="central_aisle"
        ))[0]
        assert_ok(photo_only["output_type"] == "photorealistic", "Photorealistic generated independently")
        assert_ok(tech_only["id"] != photo_only["id"], "Both outputs operate with separate lifecycle")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # -------------------------------------------------------------
    # TEST 8: Camera Viewpoint Consistency & Multi-Perspective Synthesis
    # -------------------------------------------------------------
    print_header("TEST 8: Multiple Camera Viewpoint Perspectives")
    try:
        viewpoints_to_test = ["front_symmetrical", "wide_angle", "rack_close_up", "cooling_view"]
        view_hashes = []

        for vp in viewpoints_to_test:
            res_vp = PhotorealisticService.generate_photorealistic_visualization(
                project_id=p1_proj,
                camera_viewpoint=vp,
                seed=42, # same seed to ensure viewpoint itself causes geometry change
                num_variations=1
            )[0]
            vp_path = get_design_path(res_vp["image_url"])
            h = file_hash(vp_path)
            view_hashes.append(h)
            assert_ok(res_vp["camera_viewpoint"] == vp, f"Generated with viewpoint={vp}")

        # All 4 viewpoints must produce distinct renderings
        assert_ok(len(set(view_hashes)) == len(viewpoints_to_test), "All 4 camera viewpoints produced distinct perspective renderings")
        passed += 1
    except Exception as e:
        print(f"  [ERROR] {e}")
        failed += 1

    # -------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------
    print(f"\n{'='*75}")
    print(f"  PHOTOREALISTIC PIPELINE TEST RESULTS: {passed} PASSED, {failed} FAILED (TOTAL 8)")
    print(f"{'='*75}\n")
    return failed == 0

if __name__ == "__main__":
    success = run_photorealistic_tests()
    sys.exit(0 if success else 1)
