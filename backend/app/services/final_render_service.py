"""
FinalArchitecturalRenderService — Facade for Output 3: Final Architectural Master Render Engine.

Refactored to cleanly delegate to app.services.design_generation.FinalMasterRenderService.
Visual conditioning matches the reference photograph target:
- White powder-coated cabinet frames (#F3F5F8)
- Transparent tempered glass doors
- Visible dark server blades with blue/cyan micro-LED activity lights
- Distinctive blue under-rack floor-wash LED glow strip
- Dark polished high-gloss floor with specular reflections
- Central aisle perforated ventilation floor tiles
- Modular ceiling with linear daylight LEDs and louvers
- Symmetrical white double exit doors at rear wall
- Conditioned strictly on confirmed layout JSON (8 racks for P1, 12 racks with UKG units for P2)
- Multi-provider model selection and Lanczos 2X upscaling
"""

from typing import Dict, Any, List, Optional, Tuple
from app.services.design_generation.final_master_render_service import (
    FinalMasterRenderService,
    MASTER_CAMERA_VIEWPOINTS
)


class FinalArchitecturalRenderService:
    """
    Facade class maintaining full backward compatibility for existing callers and tests.
    Delegates all calls to the modular FinalMasterRenderService.
    """

    MASTER_CAMERA_VIEWPOINTS = MASTER_CAMERA_VIEWPOINTS

    @staticmethod
    def evaluate_available_models() -> Dict[str, Any]:
        """Evaluates model availability across all providers."""
        return FinalMasterRenderService.evaluate_available_models()

    @staticmethod
    def construct_master_architectural_prompt(
        layout: Optional[Dict[str, Any]],
        style: str = "Modern Enterprise Data Center",
        camera_viewpoint: str = "cinematic_central_aisle",
        lighting: str = "Professional White Lighting",
        user_prompt: Optional[str] = None
    ) -> Tuple[str, str]:
        return FinalMasterRenderService.construct_master_architectural_prompt(
            layout=layout,
            style=style,
            camera_viewpoint=camera_viewpoint,
            lighting=lighting,
            user_prompt=user_prompt
        )

    @staticmethod
    def generate_final_master_render(
        project_id: str,
        sketch_id: Optional[str] = None,
        style: str = "Modern Enterprise Data Center",
        camera_viewpoint: str = "cinematic_central_aisle",
        lighting: str = "Professional White Lighting",
        resolution: str = "1920x1080",
        model_provider: str = "auto",
        enable_upscaling: bool = True,
        seed: int = 42,
        user_prompt: Optional[str] = None,
        use_style_reference: bool = True
    ) -> List[Dict[str, Any]]:
        return FinalMasterRenderService.generate_final_master_render(
            project_id=project_id,
            sketch_id=sketch_id,
            style=style,
            camera_viewpoint=camera_viewpoint,
            lighting=lighting,
            resolution=resolution,
            model_provider=model_provider,
            enable_upscaling=enable_upscaling,
            seed=seed,
            user_prompt=user_prompt,
            use_style_reference=use_style_reference
        )
