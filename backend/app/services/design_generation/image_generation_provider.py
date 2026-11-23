"""
ImageGenerationProvider — Official Black Forest Labs FLUX.2 [pro] & Multi-Provider Adapter.

Primary Model:
- Black Forest Labs FLUX.2 [pro] (model identifier: flux-2-pro)
  API Base: https://api.bfl.ai/v1
  Endpoints:
    - POST /v1/flux-2-pro (text-to-image & image reference conditioning)
    - POST /v1/flux-pro-1.1 (fallback high-speed enterprise pro)
    - GET /v1/get_result?id={id} (async result polling)
  Authentication: Header 'x-key: <BFL_API_KEY>'

Secondary Verified Providers:
- Replicate API (black-forest-labs/flux-1.1-pro)
- Fal.ai (fal-ai/flux-pro/v1.1)
- Hugging Face Serverless (black-forest-labs/FLUX.1-schnell)
- Google Colab GPU Node (Remote ControlNet SDXL)

Integrity Rules:
- Never fakes an inference result.
- Never labels procedural output as AI-generated photography.
- Reports clear 'requires_credentials' status if API keys are missing.
"""

import os
import io
import time
import base64
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image

import requests
from app.services.colab_inference_service import ColabInferenceService

logger = logging.getLogger("rackvision.image_provider")

BFL_API_BASE = "https://api.bfl.ai/v1"


class ImageGenerationProvider:
    """
    Modular AI Image Generation Provider for Output 3: Final Architectural Master Render.
    Strictly integrates Black Forest Labs FLUX.2 [pro] and verified providers.
    """

    @staticmethod
    def get_configured_credentials() -> Dict[str, Any]:
        """Inspects all supported provider credentials from environment variables."""
        bfl_key = os.environ.get("BFL_API_KEY") or os.environ.get("FLUX_API_KEY", "")
        replicate_token = os.environ.get("REPLICATE_API_TOKEN", "")
        fal_key = os.environ.get("FAL_KEY", "")
        hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_API_KEY", "")
        colab_url = os.environ.get("COLAB_INFERENCE_URL", "").strip()

        return {
            "bfl_configured": bool(bfl_key),
            "replicate_configured": bool(replicate_token),
            "fal_configured": bool(fal_key),
            "hf_configured": bool(hf_token),
            "colab_configured": bool(colab_url),
            "primary_model_ready": bool(bfl_key),
        }

    @staticmethod
    def evaluate_providers() -> Dict[str, Any]:
        """
        Evaluates availability, credentials, endpoints, and health across all model providers.
        """
        creds = ImageGenerationProvider.get_configured_credentials()
        bfl_key = os.environ.get("BFL_API_KEY") or os.environ.get("FLUX_API_KEY", "")
        replicate_token = os.environ.get("REPLICATE_API_TOKEN", "")
        hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_API_KEY", "")
        colab_status = ColabInferenceService.health_check()

        providers = [
            {
                "name": "Black Forest Labs FLUX.2 [pro] (PRIMARY)",
                "model_identifier": "flux-2-pro",
                "provider": "Black Forest Labs Official API",
                "api_endpoint": f"{BFL_API_BASE}/flux-2-pro",
                "auth_header": "x-key",
                "configured": bool(bfl_key),
                "tier": "Tier 1: SOTA Photorealistic Architecture",
                "supports_image_prompt": True,
                "supports_inpainting": True,
                "resolutions": ["1024x576", "1024x768", "1280x720", "1920x1080"],
                "status": "ready" if bfl_key else "requires_credentials",
                "notes": "Official Black Forest Labs API for FLUX.2 Pro."
            },
            {
                "name": "Black Forest Labs FLUX.1.1 Pro (BFL Direct)",
                "model_identifier": "flux-pro-1.1",
                "provider": "Black Forest Labs Official API",
                "api_endpoint": f"{BFL_API_BASE}/flux-pro-1.1",
                "auth_header": "x-key",
                "configured": bool(bfl_key),
                "tier": "Tier 1: High-Speed Enterprise Pro",
                "supports_image_prompt": True,
                "supports_inpainting": True,
                "resolutions": ["1024x576", "1024x768", "1280x720", "1920x1080"],
                "status": "ready" if bfl_key else "requires_credentials",
                "notes": "Official BFL 1.1 Pro enterprise endpoint with sub-10s latency."
            },
            {
                "name": "Replicate FLUX.1.1 Pro",
                "model_identifier": "black-forest-labs/flux-1.1-pro",
                "provider": "Replicate Cloud",
                "api_endpoint": "https://api.replicate.com/v1/predictions",
                "auth_header": "Authorization: Bearer",
                "configured": bool(replicate_token),
                "tier": "Tier 1: Hosted Commercial API",
                "supports_image_prompt": True,
                "supports_inpainting": False,
                "resolutions": ["1024x576", "1024x768", "1920x1080"],
                "status": "ready" if replicate_token else "requires_credentials",
                "notes": "Replicate managed FLUX.1.1 Pro inference."
            },
            {
                "name": "Hugging Face FLUX.1-schnell",
                "model_identifier": "black-forest-labs/FLUX.1-schnell",
                "provider": "Hugging Face Serverless",
                "api_endpoint": "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
                "auth_header": "Authorization: Bearer",
                "configured": bool(hf_token),
                "tier": "Tier 2: Distilled 12B FLUX",
                "supports_image_prompt": False,
                "supports_inpainting": False,
                "resolutions": ["1024x576", "1024x768"],
                "status": "ready" if hf_token else "requires_credentials",
                "notes": "4-step distilled FLUX open weights."
            },
            {
                "name": "Google Colab GPU Node",
                "model_identifier": "controlnet-canny-sdxl",
                "provider": "Self-Hosted Remote Colab T4/A100",
                "api_endpoint": os.environ.get("COLAB_INFERENCE_URL", ""),
                "auth_header": "None",
                "configured": bool(os.environ.get("COLAB_INFERENCE_URL")),
                "tier": "Tier 2: Dedicated GPU Tunnel",
                "supports_image_prompt": True,
                "supports_inpainting": False,
                "resolutions": ["1024x768"],
                "status": colab_status.get("health", "not_configured"),
                "notes": "Remote Colab GPU tunnel for edge-conditioned diffusion."
            }
        ]

        # Determine active provider
        if bfl_key:
            active_model = "flux-2-pro"
            active_provider = "Black Forest Labs Official API"
            selection_reason = "BFL_API_KEY configured. Active FLUX.2 [pro] cloud inference pipeline engaged."
            ready = True
        elif replicate_token:
            active_model = "black-forest-labs/flux-1.1-pro"
            active_provider = "Replicate Cloud"
            selection_reason = "REPLICATE_API_TOKEN configured. Active FLUX.1.1 Pro cloud inference engaged."
            ready = True
        elif hf_token:
            active_model = "black-forest-labs/FLUX.1-schnell"
            active_provider = "Hugging Face Serverless"
            selection_reason = "HF_TOKEN configured. Active FLUX.1-schnell cloud inference engaged."
            ready = True
        elif colab_status.get("health") == "online":
            active_model = "colab-controlnet-sdxl"
            active_provider = "Google Colab GPU Node"
            selection_reason = "COLAB_INFERENCE_URL online. Active ControlNet SDXL diffusion engaged."
            ready = True
        else:
            active_model = "flux-2-pro"
            active_provider = "Black Forest Labs Official API"
            selection_reason = (
                "BFL_API_KEY is not yet configured in backend/.env. "
                "Output 3 requires a genuine Black Forest Labs API key to perform FLUX.2 [pro] inference."
            )
            ready = False

        return {
            "primary_model": "flux-2-pro",
            "selected_model": active_model,
            "selected_model_name": f"{active_provider} ({active_model})",
            "active_model": active_model,
            "active_provider": active_provider,
            "ready_for_inference": ready,
            "selection_reason": selection_reason,
            "configuration_instructions": {
                "variable": "BFL_API_KEY",
                "target_file": "backend/.env",
                "documentation": "https://api.bfl.ai",
                "example": "BFL_API_KEY=bfl_live_..."
            },
            "providers": providers,
            "providers_evaluated": providers,
            "timestamp": datetime.now().isoformat()
        }

    @staticmethod
    def call_bfl_flux_2_pro(
        prompt: str,
        width: int = 1024,
        height: int = 576,
        seed: int = 42,
        image_reference_path: Optional[Path] = None,
        model_id: str = "flux-2-pro"
    ) -> Tuple[Optional[Image.Image], Dict[str, Any]]:
        """
        Executes genuine inference against the official Black Forest Labs API:
        1. POST https://api.bfl.ai/v1/{model_id} with prompt and optional reference image
        2. Polls polling_url until status == 'Ready'
        3. Retrieves and downloads the sample image
        """
        bfl_key = os.environ.get("BFL_API_KEY") or os.environ.get("FLUX_API_KEY")
        if not bfl_key:
            return None, {
                "success": False,
                "error": "BFL_API_KEY is not configured. Please add BFL_API_KEY to backend/.env",
                "status": "requires_credentials"
            }

        headers = {
            "Content-Type": "application/json",
            "x-key": bfl_key
        }

        # Clean dimensions to standard multiples of 32
        w_clean = (width // 32) * 32
        h_clean = (height // 32) * 32

        payload: Dict[str, Any] = {
            "prompt": prompt,
            "width": max(512, min(w_clean, 1920)),
            "height": max(512, min(h_clean, 1080)),
            "prompt_upsampling": False,
            "seed": seed,
            "safety_tolerance": 5,
            "output_format": "png"
        }

        # Include structural reference conditioning if reference image is supplied
        if image_reference_path and image_reference_path.exists():
            try:
                with open(image_reference_path, "rb") as img_f:
                    encoded_img = base64.b64encode(img_f.read()).decode("utf-8")
                    payload["image_prompt"] = f"data:image/png;base64,{encoded_img}"
            except Exception as e:
                logger.warning("Could not encode reference image for BFL conditioning: %s", e)

        endpoint_url = f"{BFL_API_BASE}/{model_id}"

        try:
            logger.info("Submitting FLUX.2 Pro task to %s...", endpoint_url)
            sub_resp = requests.post(endpoint_url, json=payload, headers=headers, timeout=15)

            if sub_resp.status_code not in [200, 201]:
                err_msg = f"BFL API Error {sub_resp.status_code}: {sub_resp.text}"
                logger.error(err_msg)
                return None, {"success": False, "error": err_msg, "status": "failed"}

            sub_data = sub_resp.json()
            task_id = sub_data.get("id")
            polling_url = sub_data.get("polling_url") or f"{BFL_API_BASE}/get_result?id={task_id}"

            # Poll for completion (up to 40 seconds)
            start_poll = time.time()
            while time.time() - start_poll < 40:
                time.sleep(2.0)
                poll_resp = requests.get(polling_url, headers={"x-key": bfl_key}, timeout=10)
                if poll_resp.status_code == 200:
                    poll_data = poll_resp.json()
                    status = poll_data.get("status")

                    if status == "Ready":
                        img_url = poll_data.get("result", {}).get("sample")
                        if img_url:
                            img_bytes = requests.get(img_url, timeout=20).content
                            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                            return img, {
                                "success": True,
                                "task_id": task_id,
                                "model": model_id,
                                "provider": "Black Forest Labs Official API",
                                "status": "completed",
                                "sample_url": img_url
                            }
                    elif status in ["Failed", "Error"]:
                        return None, {
                            "success": False,
                            "error": f"BFL Task {task_id} failed: {poll_data}",
                            "status": "failed"
                        }

            return None, {"success": False, "error": "BFL inference timed out after 40 seconds", "status": "timeout"}

        except Exception as exc:
            logger.error("Exception during BFL API call: %s", exc)
            return None, {"success": False, "error": str(exc), "status": "error"}
