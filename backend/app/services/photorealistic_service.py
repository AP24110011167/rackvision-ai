"""
PhotorealisticService — Facade for Output 2: Photorealistic Interior Preview.

Refactored to cleanly delegate to app.services.design_generation.InteriorPreviewService.
The obsolete procedural generation engine has been completely replaced with
the geometry-aware 3D PBR rendering pipeline.
"""

from typing import Dict, Any, List, Optional, Tuple
from app.services.design_generation.interior_preview_service import (
    InteriorPreviewService,
    CAMERA_VIEWPOINTS
)


class PhotorealisticService:
    """
    Facade class maintaining full backward compatibility for existing callers and tests.
    Delegates all calls to the modular InteriorPreviewService.
    """

    CAMERA_VIEWPOINTS = CAMERA_VIEWPOINTS

    @staticmethod
    def construct_photorealistic_prompt(
        layout: Optional[Dict[str, Any]],
        style: str = "Modern Enterprise Data Center",
        camera_viewpoint: str = "front_symmetrical",
        lighting: str = "Bright White Daylight (5000K)",
        user_prompt: Optional[str] = None
    ) -> Tuple[str, str]:
        return InteriorPreviewService.construct_photorealistic_prompt(
            layout=layout,
            style=style,
            camera_viewpoint=camera_viewpoint,
            lighting=lighting,
            user_prompt=user_prompt
        )

    @staticmethod
    def generate_photorealistic_design(
        project_id: str,
        sketch_id: Optional[str] = None,
        style: str = "Modern Enterprise Data Center",
        camera_viewpoint: str = "front_symmetrical",
        lighting: str = "Bright White Daylight (5000K)",
        resolution: str = "1024x768",
        num_variations: int = 1,
        seed: int = 42,
        user_prompt: Optional[str] = None,
        guidance_scale: float = 7.5,
        inference_steps: int = 30,
        **kwargs
    ) -> List[Dict[str, Any]]:
        return InteriorPreviewService.generate_photorealistic_design(
            project_id=project_id,
            sketch_id=sketch_id,
            style=style,
            camera_viewpoint=camera_viewpoint,
            lighting=lighting,
            resolution=resolution,
            num_variations=num_variations,
            seed=seed,
            user_prompt=user_prompt,
            guidance_scale=guidance_scale,
            inference_steps=inference_steps,
            **kwargs
        )

    @staticmethod
    def generate_photorealistic_visualization(
        project_id: str,
        sketch_id: Optional[str] = None,
        style: str = "Modern Enterprise Data Center",
        camera_viewpoint: str = "front_symmetrical",
        lighting: str = "Bright White Daylight (5000K)",
        resolution: str = "1024x768",
        num_variations: int = 1,
        seed: int = 42,
        user_prompt: Optional[str] = None,
        guidance_scale: float = 7.5,
        inference_steps: int = 30,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Alias for generate_photorealistic_design to maintain test suite compatibility."""
        return InteriorPreviewService.generate_photorealistic_design(
            project_id=project_id,
            sketch_id=sketch_id,
            style=style,
            camera_viewpoint=camera_viewpoint,
            lighting=lighting,
            resolution=resolution,
            num_variations=num_variations,
            seed=seed,
            user_prompt=user_prompt,
            guidance_scale=guidance_scale,
            inference_steps=inference_steps,
            **kwargs
        )
