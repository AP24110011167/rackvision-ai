"""
RackVision AI — ControlNet + Stable Diffusion Pipeline Wrapper
Manages model loading, GPU memory allocation, mixed precision (FP16),
and conditional latent generation for architectural synthesis.
"""

import os
import logging
from typing import Optional, List, Dict, Any
from PIL import Image

logger = logging.getLogger("rackvision.controlnet")

class ControlNetPipelineWrapper:
    def __init__(
        self,
        base_model_id: str = "runwayml/stable-diffusion-v1-5",
        controlnet_model_id: str = "lllyasviel/control_v11p_sd15_canny",
        custom_checkpoint_path: Optional[str] = None,
        use_gpu: bool = True
    ):
        self.base_model_id = base_model_id
        self.controlnet_model_id = controlnet_model_id
        self.custom_checkpoint_path = custom_checkpoint_path
        self.use_gpu = use_gpu
        self.pipe = None
        self.device = "cpu"
        self._initialize_device()

    def _initialize_device(self):
        try:
            import torch
            if self.use_gpu and torch.cuda.is_available():
                self.device = "cuda"
            elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                self.device = "mps"
            else:
                self.device = "cpu"
        except ImportError:
            self.device = "cpu"
        logger.info("ControlNetPipelineWrapper targeting compute device: %s", self.device)

    def load_pipeline(self) -> bool:
        """
        Loads the ControlNet and StableDiffusion pipeline weights.
        Returns True if successfully loaded, False otherwise.
        """
        try:
            import torch
            from diffusers import (
                ControlNetModel,
                StableDiffusionControlNetPipeline,
                UniPCMultistepScheduler
            )

            dtype = torch.float16 if self.device == "cuda" else torch.float32

            # Load ControlNet conditioned on Canny edges
            controlnet = ControlNetModel.from_pretrained(
                self.controlnet_model_id,
                torch_dtype=dtype
            )

            # Load Base Stable Diffusion pipeline
            self.pipe = StableDiffusionControlNetPipeline.from_pretrained(
                self.base_model_id,
                controlnet=controlnet,
                torch_dtype=dtype,
                safety_checker=None
            )

            # Fast multi-step scheduler for architectural sharpness
            self.pipe.scheduler = UniPCMultistepScheduler.from_config(self.pipe.scheduler.config)

            if self.custom_checkpoint_path and os.path.exists(self.custom_checkpoint_path):
                logger.info("Applying custom LoRA checkpoint from %s", self.custom_checkpoint_path)
                self.pipe.load_lora_weights(self.custom_checkpoint_path)

            self.pipe.to(self.device)
            if self.device == "cuda":
                self.pipe.enable_xformers_memory_efficient_attention()
                self.pipe.enable_model_cpu_offload()

            logger.info("Neural pipeline successfully loaded on %s", self.device)
            return True
        except Exception as e:
            logger.warning("Could not load neural pipeline (%s). Falling back to procedural engine.", str(e))
            self.pipe = None
            return False

    def generate(
        self,
        canny_image: Image.Image,
        prompt: str,
        negative_prompt: str,
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        controlnet_conditioning_scale: float = 0.9,
        seed: Optional[int] = None
    ) -> List[Image.Image]:
        """Runs conditional diffusion inference on edge map."""
        if self.pipe is None:
            raise RuntimeError("Pipeline is not loaded. Ensure GPU and model weights are accessible.")

        import torch
        generator = None
        if seed is not None:
            generator = torch.Generator(device=self.device).manual_seed(seed)

        output = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=canny_image,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            controlnet_conditioning_scale=controlnet_conditioning_scale,
            generator=generator
        )

        return output.images
