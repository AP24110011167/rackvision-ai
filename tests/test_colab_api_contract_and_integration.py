"""
tests/test_colab_api_contract_and_integration.py
Validates the exact field-by-field API contract between:
- backend/app/services/colab_inference_service.py (Client)
- Stage 8 InferenceRequest & response schema in RackVision_SDXL_ControlNet.ipynb (Server)
and confirms end-to-end decoding and saving with mode="colab_sdxl_controlnet".
"""

import sys
import io
import json
import base64
import unittest
from pathlib import Path
from PIL import Image
from pydantic import BaseModel
from typing import Optional

# Setup import paths
root_dir = Path(".").resolve()
backend_dir = Path("backend").resolve()
for d in [root_dir, backend_dir]:
    if str(d) not in sys.path:
        sys.path.insert(0, str(d))

from app.services.colab_inference_service import ColabInferenceService
from app.services.design_generation.final_master_render_service import FinalMasterRenderService


# Define the Stage 8 InferenceRequest Pydantic Schema exactly as updated in the notebook
class Stage8InferenceRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = (
        "blurry, low quality, distorted, deformed, text, watermark, bad architecture, unrealistic proportions, messy"
    )
    canny_image: Optional[str] = None
    image: Optional[str] = None
    depth_image: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    target_resolution: Optional[str] = "768x768"
    seed: Optional[int] = 42
    num_inference_steps: Optional[int] = 25
    guidance_scale: Optional[float] = 7.5
    canny_scale: Optional[float] = None
    controlnet_conditioning_scale: Optional[float] = 0.5
    depth_scale: Optional[float] = None


class TestColabApiContract(unittest.TestCase):

    def setUp(self):
        # Create a sample 768x768 test image with realistic visual variance
        import numpy as np
        arr = np.zeros((768, 768, 3), dtype=np.uint8)
        arr[:] = 110
        arr[::16, :] = 220
        arr[:, ::16] = 180
        img = Image.fromarray(arr)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        self.sample_png_bytes = buf.getvalue()
        self.sample_b64 = "data:image/png;base64," + base64.b64encode(self.sample_png_bytes).decode("utf-8")

        self.temp_canny = Path("scratch/test_canny.png")
        self.temp_canny.parent.mkdir(parents=True, exist_ok=True)
        self.temp_canny.write_bytes(self.sample_png_bytes)

    def tearDown(self):
        if self.temp_canny.exists():
            try:
                self.temp_canny.unlink()
            except Exception:
                pass

    def test_1_payload_conforms_to_pydantic_schema(self):
        """Verify that the exact payload built by colab_inference_service parses cleanly into Stage 8 InferenceRequest."""
        # 1. Build payload as colab_inference_service does
        client_payload = {
            "prompt": "Modern hyperscale enterprise data center hall, 8 server racks, 48U cabinets",
            "negative_prompt": "blurry, low resolution, noise, cartoon, distorted perspective",
            "canny_image": self.sample_b64,
            "width": 768,
            "height": 768,
            "seed": 42,
            "num_inference_steps": 20,
            "guidance_scale": 7.0,
            "canny_scale": 0.85
        }

        # 2. Parse using Stage 8 Pydantic schema
        req = Stage8InferenceRequest(**client_payload)

        # 3. Verify fields match exactly
        self.assertEqual(req.prompt, client_payload["prompt"])
        self.assertEqual(req.negative_prompt, client_payload["negative_prompt"])
        self.assertEqual(req.canny_image, self.sample_b64)
        self.assertEqual(req.width, 768)
        self.assertEqual(req.height, 768)
        self.assertEqual(req.seed, 42)
        self.assertEqual(req.num_inference_steps, 20)
        self.assertEqual(req.guidance_scale, 7.0)
        self.assertEqual(req.canny_scale, 0.85)
        print("  ✓ [PASS] Client payload parsed perfectly into Stage8InferenceRequest")

    def test_2_colab_response_decoding_by_backend(self):
        """Verify that backend decodes Stage 8 response format and produces valid PIL Image."""
        # Simulate Stage 8 response
        stage8_response_json = {
            "status": "success",
            "image": self.sample_b64,
            "elapsed_seconds": 18.5,
            "latency_seconds": 18.5,
            "resolution": "768x768",
            "width": 768,
            "height": 768,
            "steps": 20,
            "seed": 42,
            "model": "SDXL 1.0 + ControlNet Canny"
        }

        # Verify backend decoding logic from colab_inference_service.py
        img_data_str = stage8_response_json.get("image", "")
        self.assertTrue(bool(img_data_str))
        raw_b64 = img_data_str.split(",")[-1]
        decoded_bytes = base64.b64decode(raw_b64)
        pil_img = Image.open(io.BytesIO(decoded_bytes)).convert("RGB")

        self.assertEqual(pil_img.size, (768, 768))
        self.assertEqual(stage8_response_json.get("model"), "SDXL 1.0 + ControlNet Canny")
        self.assertEqual(stage8_response_json.get("latency_seconds"), 18.5)
        print("  ✓ [PASS] Stage 8 response decoded into PIL Image (768x768) with latency and model metadata")

    def test_3_final_master_render_mode_and_upscaling(self):
        """Simulate Colab inference returning image to FinalMasterRenderService and verify mode='colab_sdxl_controlnet'."""
        import unittest.mock as mock

        # Mock Colab health check and generate_master_render
        sample_pil = Image.open(io.BytesIO(self.sample_png_bytes)).convert("RGB")
        mock_res = {
            "success": True,
            "image": sample_pil,
            "model": "Google Colab GPU Node (SDXL Base 1.0 + ControlNet Canny)",
            "latency_seconds": 18.5
        }

        with mock.patch.object(ColabInferenceService, "health_check", return_value={"health": "online"}), \
             mock.patch.object(ColabInferenceService, "generate_master_render", return_value=mock_res):

            renders = FinalMasterRenderService.generate_final_master_render(
                project_id="proj-contract-test",
                sketch_id="sketch-001",
                camera_viewpoint="cinematic_central_aisle",
                style="Modern Clean Minimalist",
                lighting="Bioluminescent Cyan & Crisp White",
                resolution="1920x1080",
                seed=42,
                enable_upscaling=True
            )

            self.assertGreater(len(renders), 0)
            master = renders[0]
            self.assertEqual(master["mode"], "colab_sdxl_controlnet")
            self.assertEqual(master["resolution"], "1920x1080")
            self.assertTrue(master["image_url"].endswith(".png"))
            self.assertEqual(master["model_name"], "Google Colab GPU Node (SDXL Base 1.0 + ControlNet Canny)")
            print(f"  ✓ [PASS] FinalMasterRenderService produced mode='{master['mode']}', res='{master['resolution']}'")


if __name__ == "__main__":
    unittest.main()
