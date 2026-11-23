"""
ModelProviderAdapter — Evaluates and dispatches to available image-generation providers.

Primary Provider:
- Black Forest Labs FLUX.2 [pro] (official API: https://api.bfl.ai/v1/flux-2-pro)

Secondary Verified Providers:
- Replicate FLUX.1.1 Pro (black-forest-labs/flux-1.1-pro)
- Hugging Face FLUX.1-schnell (black-forest-labs/FLUX.1-schnell)
- Google Colab GPU Node (COLAB_INFERENCE_URL)
"""

import os
import io
import time
import base64
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image

import requests
from app.services.colab_inference_service import ColabInferenceService
from app.services.design_generation.image_generation_provider import ImageGenerationProvider

logger = logging.getLogger("rackvision.model_adapter")


class ModelProviderAdapter:
    """
    Evaluates available AI inference backends and dispatches generation requests.
    Enforces honest status reporting without faking inference results.
    """

    @staticmethod
    def evaluate_available_models() -> Dict[str, Any]:
        """
        Evaluates availability, credentials, and health across all model providers.
        """
        return ImageGenerationProvider.evaluate_providers()

    @staticmethod
    def call_bfl_flux(
        prompt: str,
        width: int = 1024,
        height: int = 576,
        seed: int = 42,
        reference_image_path: Optional[str] = None
    ) -> Tuple[Optional[Image.Image], Dict[str, Any]]:
        """Calls official Black Forest Labs FLUX.2 Pro endpoint."""
        return ImageGenerationProvider.call_bfl_flux_2_pro(
            prompt=prompt,
            width=width,
            height=height,
            seed=seed,
            image_reference_path=reference_image_path
        )

    @staticmethod
    def call_replicate_flux(
        prompt: str,
        width: int = 1024,
        height: int = 576,
        seed: int = 42
    ) -> Optional[Image.Image]:
        """Dispatches prompt to Replicate FLUX.1.1 Pro API."""
        token = os.environ.get("REPLICATE_API_TOKEN")
        if not token:
            return None

        try:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            payload = {
                "version": "black-forest-labs/flux-1.1-pro",
                "input": {
                    "prompt": prompt,
                    "aspect_ratio": "16:9",
                    "output_format": "png",
                    "output_quality": 95,
                    "safety_tolerance": 5,
                    "seed": seed
                }
            }
            resp = requests.post(
                "https://api.replicate.com/v1/predictions",
                json=payload,
                headers=headers,
                timeout=12
            )
            if resp.status_code in [200, 201]:
                data = resp.json()
                get_url = data.get("urls", {}).get("get")
                if get_url:
                    for _ in range(12):
                        time.sleep(2.5)
                        poll_resp = requests.get(get_url, headers=headers, timeout=10)
                        if poll_resp.status_code == 200:
                            poll_data = poll_resp.json()
                            status = poll_data.get("status")
                            if status == "succeeded":
                                img_url = poll_data.get("output")
                                if img_url:
                                    img_data = requests.get(img_url, timeout=15).content
                                    return Image.open(io.BytesIO(img_data)).convert("RGB")
                            elif status in ["failed", "canceled"]:
                                break
        except Exception as exc:
            logger.warning("Replicate FLUX API call failed: %s", exc)
        return None

    @staticmethod
    def call_hf_flux(
        prompt: str,
        width: int = 1024,
        height: int = 576,
        seed: int = 42
    ) -> Optional[Image.Image]:
        """Dispatches prompt to Hugging Face Serverless FLUX.1-schnell endpoint."""
        token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_API_KEY")
        if not token:
            return None

        try:
            api_url = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
            headers = {"Authorization": f"Bearer {token}"}
            payload = {
                "inputs": prompt,
                "parameters": {
                    "width": width,
                    "height": height,
                    "num_inference_steps": 4,
                    "seed": seed
                }
            }
            resp = requests.post(api_url, headers=headers, json=payload, timeout=20)
            if resp.status_code == 200:
                return Image.open(io.BytesIO(resp.content)).convert("RGB")
            logger.warning("HF Inference returned status %d: %s", resp.status_code, resp.text[:200])
        except Exception as exc:
            logger.warning("HF FLUX API call failed: %s", exc)
        return None
