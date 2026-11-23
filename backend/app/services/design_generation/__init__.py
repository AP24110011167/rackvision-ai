"""
design_generation — Modular Three-Output Architecture Package for RackVision AI.

Exports:
- TechnicalLayoutService (Output 1: Technical Architectural Layout)
- InteriorPreviewService (Output 2: Geometry-Aware Photorealistic Interior Preview)
- FinalMasterRenderService (Output 3: Final Architectural Master Render)
- LayoutReferenceService (Authoritative layout synchronization & cache invalidation)
- LayoutConditioningService (Prompt synthesis & structural conditioning extraction)
- ImageReferenceService (Structural reference conditioning image extraction)
- ImageValidationService (PNG header & integrity verification)
- ImageUpscalingService (Lanczos 2X architectural upscaling)
- ImageGenerationProvider (Black Forest Labs FLUX.2 [pro] & multi-provider client)
- ModelProviderAdapter (Evaluates & dispatches to FLUX.2 Pro / Replicate / Colab)
"""

from app.services.design_generation.technical_layout_service import TechnicalLayoutService
from app.services.design_generation.interior_preview_service import InteriorPreviewService, CAMERA_VIEWPOINTS
from app.services.design_generation.final_master_render_service import FinalMasterRenderService, MASTER_CAMERA_VIEWPOINTS
from app.services.design_generation.layout_reference_service import LayoutReferenceService
from app.services.design_generation.layout_conditioning_service import LayoutConditioningService
from app.services.design_generation.image_reference_service import ImageReferenceService
from app.services.design_generation.image_validation_service import ImageValidationService
from app.services.design_generation.image_upscaling_service import ImageUpscalingService
from app.services.design_generation.image_generation_provider import ImageGenerationProvider
from app.services.design_generation.model_provider_adapter import ModelProviderAdapter

__all__ = [
    "TechnicalLayoutService",
    "InteriorPreviewService",
    "FinalMasterRenderService",
    "LayoutReferenceService",
    "LayoutConditioningService",
    "ImageReferenceService",
    "ImageValidationService",
    "ImageUpscalingService",
    "ImageGenerationProvider",
    "ModelProviderAdapter",
    "CAMERA_VIEWPOINTS",
    "MASTER_CAMERA_VIEWPOINTS",
]
