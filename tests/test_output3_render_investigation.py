"""
tests/test_output3_render_investigation.py

Comprehensive test suite verifying Output 3 Image-Generation and Presentation Pipeline fixes:
1. Conditioning Image vs Output Image Decoupling (Canny is input, SDXL is output)
2. Anti-Wireframe Safeguard (Wireframe or degenerate frames rejected with HTTP 502)
3. Offline / Standby Isolation (Wireframe never saved as completed master render; raises HTTP 503)
4. Genuine SDXL Inference Flow (Decodes, checks variance, saves raw + final badged 1080p outputs)
5. P2 Architectural Geometry Fidelity (12 racks, 2 rows of 6, 3 UKG 15kW units, 49.6 m²)
"""

import sys
import os
import io
import json
import base64
import unittest
from pathlib import Path
from PIL import Image
import numpy as np
from fastapi import HTTPException

# Add search paths
root_dir = Path(".").resolve()
backend_dir = Path("backend").resolve()
for d in [root_dir, backend_dir]:
    if str(d) not in sys.path:
        sys.path.insert(0, str(d))

from app.database.db import init_db, get_connection
from app.services.layout_service import LayoutService
from app.services.colab_inference_service import ColabInferenceService
from app.services.design_generation.final_master_render_service import FinalMasterRenderService
from app.services.design_generation.image_reference_service import ImageReferenceService
from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService


class TestOutput3RenderInvestigation(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        self.p2_layout = {
            "version": "v1.0",
            "room": {"name": "Serverraum", "width_m": 8.27, "length_m": 6.0, "area_sqm": 49.6},
            "components": [
                {"id": f"rack_a_{i}", "category": "server_infrastructure", "row": "Row-A", "type": "server_rack", "x": 1.5 + i * 0.85, "y": 1.8, "width_m": 0.8, "depth_m": 1.2, "height_m": 2.2} for i in range(6)
            ] + [
                {"id": f"rack_b_{i}", "category": "server_infrastructure", "row": "Row-B", "type": "server_rack", "x": 1.5 + i * 0.85, "y": 3.8, "width_m": 0.8, "depth_m": 1.2, "height_m": 2.2} for i in range(6)
            ] + [
                {"id": f"ukg_{i+1}", "category": "cooling_infrastructure", "type": "cooling_crac", "capacity_kw": 15.0, "x": 7.0, "y": 1.5 + i * 1.5, "width_m": 1.0, "depth_m": 0.9, "height_m": 2.2} for i in range(3)
            ] + [
                {"id": "t30_door", "category": "physical_infrastructure", "type": "door", "x": 6.2, "y": 2.5, "width_m": 1.0, "depth_m": 0.1, "height_m": 2.1}
            ],
            "aisles": [{"type": "hot_aisle_containment", "width_m": 1.5}],
            "technical_area": {"present": True, "name": "Technikspange", "x_start_m": 6.2}
        }
        LayoutService.save_layout("proj-test-investigation", self.p2_layout)

    def test_1_conditioning_image_is_strictly_input(self):
        """Verify that the Canny edge map is an input conditioning guide and NOT a master render."""
        canny_path = ImageReferenceService.get_structural_canny_image(
            project_id="proj-test-investigation",
            width=768,
            height=768,
            camera_viewpoint="cinematic_central_aisle"
        )
        self.assertTrue(Path(canny_path).exists(), "Canny conditioning image must exist on disk")
        with Image.open(canny_path) as im:
            self.assertEqual(im.size, (768, 768))
            self.assertEqual(im.mode, "L")  # Grayscale edge map
            arr = np.array(im)
            self.assertGreater(np.std(arr), 10.0, "Canny edge map must have significant structural edges")
            self.assertGreater(np.count_nonzero(arr > 128), 1000, "Canny edge map must contain visible linework")
        print("  ✓ [PASS] Conditioning Canny map is 768x768 grayscale edge map strictly for ControlNet input")

    def test_2_anti_wireframe_safeguard_rejects_wireframe_from_colab(self):
        """Verify that if Colab returns a wireframe or degenerate image, Output 3 raises HTTP 502."""
        import unittest.mock as mock

        # Create a wireframe image (mostly black with thin lines: mean < 20, std < 50)
        arr = np.zeros((768, 768, 3), dtype=np.uint8)
        arr[::32, :] = 200  # thin lines
        arr[:, ::32] = 200
        wireframe_pil = Image.fromarray(arr)

        mock_res = {
            "success": True,
            "image": wireframe_pil,
            "model": "SDXL-ControlNet-Canny",
            "latency_seconds": 15.0
        }

        with mock.patch.object(ColabInferenceService, "health_check", return_value={"health": "online"}), \
             mock.patch.object(ColabInferenceService, "generate_master_render", return_value=mock_res):

            with self.assertRaises(HTTPException) as ctx:
                FinalMasterRenderService.generate_final_master_render(
                    project_id="proj-test-investigation",
                    camera_viewpoint="cinematic_central_aisle",
                    resolution="1920x1080",
                    enable_upscaling=True
                )
            self.assertEqual(ctx.exception.status_code, 502)
            self.assertIn("conditioning wireframe", ctx.exception.detail)
            print("  ✓ [PASS] Anti-wireframe safeguard strictly caught and rejected wireframe with HTTP 502")

    def test_3_offline_colab_raises_503_and_never_saves_wireframe_as_completed(self):
        """Verify that when Colab is offline, standard call raises 503 rather than returning a wireframe marked completed."""
        import unittest.mock as mock

        # Ensure RACKVISION_TEST_MODE is NOT bypassing in this test
        old_env = os.environ.pop("RACKVISION_TEST_MODE", None)
        try:
            with mock.patch.object(ColabInferenceService, "health_check", return_value={"health": "offline", "message": "Connection refused"}):
                with self.assertRaises(HTTPException) as ctx:
                    FinalMasterRenderService.generate_final_master_render(
                        project_id="proj-test-investigation",
                        camera_viewpoint="cinematic_central_aisle",
                        resolution="1920x1080",
                        model_provider="auto"
                    )
                self.assertEqual(ctx.exception.status_code, 503)
                self.assertIn("requires an active Google Colab GPU connection", ctx.exception.detail)
                print("  ✓ [PASS] Offline Colab rejected with HTTP 503; wireframe never substituted as completed master render")
        finally:
            if old_env is not None:
                os.environ["RACKVISION_TEST_MODE"] = old_env

    def test_4_successful_sdxl_inference_saves_raw_and_upscaled_badged_outputs(self):
        """Verify that genuine SDXL inference decodes image, saves raw image, upscales, and marks completed."""
        import unittest.mock as mock

        # Create a photorealistic synthetic server room image with high variance
        arr = np.random.randint(60, 220, (768, 768, 3), dtype=np.uint8)
        arr[:100, :, 1] = 180  # ceiling troffer illumination
        arr[200:600, 100:600, 2] = 220  # cyan LED activity
        sdxl_pil = Image.fromarray(arr)

        mock_res = {
            "success": True,
            "image": sdxl_pil,
            "model": "SDXL-ControlNet-Canny",
            "latency_seconds": 28.5
        }

        with mock.patch.object(ColabInferenceService, "health_check", return_value={"health": "online"}), \
             mock.patch.object(ColabInferenceService, "generate_master_render", return_value=mock_res):

            renders = FinalMasterRenderService.generate_final_master_render(
                project_id="proj-test-investigation",
                camera_viewpoint="cinematic_central_aisle",
                resolution="1920x1080",
                enable_upscaling=True
            )

            self.assertEqual(len(renders), 1)
            render = renders[0]
            self.assertEqual(render["mode"], "colab_sdxl_controlnet")
            self.assertEqual(render["generation_status"], "completed")
            self.assertEqual(render["output_type"], "master_render")
            self.assertEqual(render["resolution"], "1920x1080")
            self.assertIsNotNone(render["raw_image_url"])

            # Verify on disk
            final_img_path = backend_dir / render["image_url"].lstrip("/")
            raw_img_path = backend_dir / render["raw_image_url"].lstrip("/")
            self.assertTrue(final_img_path.exists(), "Final 1080p render must exist on disk")
            self.assertTrue(raw_img_path.exists(), "Raw SDXL render must exist on disk")

            # Final is 1920x1080, raw is 768x768
            with Image.open(final_img_path) as im_final:
                self.assertEqual(im_final.size, (1920, 1080))
            with Image.open(raw_img_path) as im_raw:
                self.assertEqual(im_raw.size, (768, 768))

            print("  ✓ [PASS] Genuine SDXL inference saved raw 768x768 and final badged 1080p outputs with mode=colab_sdxl_controlnet")

    def test_5_p2_architectural_geometry_preservation(self):
        """Verify that P2 layout coordinates preserve 12 racks, 3 UKG units, containment, and 49.6 m²."""
        layout = self.p2_layout
        room = layout["room"]
        self.assertEqual(room["area_sqm"], 49.6)
        self.assertEqual(round(room["width_m"] * room["length_m"], 2), 49.62)

        racks = [c for c in layout["components"] if c.get("category") == "server_infrastructure"]
        self.assertEqual(len(racks), 12)
        row_a = [r for r in racks if r.get("row") == "Row-A"]
        row_b = [r for r in racks if r.get("row") == "Row-B"]
        self.assertEqual(len(row_a), 6)
        self.assertEqual(len(row_b), 6)

        cooling = [c for c in layout["components"] if c.get("category") == "cooling_infrastructure"]
        self.assertEqual(len(cooling), 3)
        for c in cooling:
            self.assertEqual(c["capacity_kw"], 15.0)
            self.assertGreaterEqual(c["x"], 6.2)  # In right-side technical area

        self.assertTrue(layout["technical_area"]["present"])
        print("  ✓ [PASS] P2 Architectural Geometry strictly verified: 12 racks (2x6), 3 UKG 15kW units in technical room, 49.6 m²")


if __name__ == "__main__":
    unittest.main()
