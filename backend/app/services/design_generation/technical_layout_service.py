"""
TechnicalLayoutService — Output 1: Technical Architectural Layout Service.

Wraps Output 1 generation functionality cleanly within the modular design_generation package:
- Preserves existing technical layout generation
- Preserves structural visualization, object positions, rack counts, room dimensions
- Preserves cooling and electrical infrastructure overlays
- 3D simulator integration and technical blueprint exports
"""

import logging
from typing import Dict, Any, List, Optional
from app.services.ai_generation_service import AIGenerationService

logger = logging.getLogger("rackvision.technical_layout")


class TechnicalLayoutService:
    """
    Orchestrates Output 1: Technical Architectural Layout.
    Wraps AIGenerationService while preserving all existing functionality unchanged.
    """

    @staticmethod
    def generate_technical_layout(
        project_id: str,
        sketch_id: Optional[str] = None,
        style: str = "Modern Enterprise Data Center",
        lighting: str = "Bright White Daylight (5000K Diffuse)",
        interior: str = "Pristine Raised Access Floor with Drop Ceiling",
        cooling: str = "Perimeter Downflow CRAC Precision (95kW)",
        resolution: str = "1024x768",
        num_variations: int = 1,
        seed: int = 42,
        user_prompt: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes Output 1: Technical Architectural Layout generation.
        Maintains full backward compatibility.
        """
        return AIGenerationService.generate_design(
            project_id=project_id,
            sketch_id=sketch_id,
            style=style,
            lighting=lighting,
            interior=interior,
            cooling=cooling,
            resolution=resolution,
            num_variations=num_variations,
            seed=seed,
            user_prompt=user_prompt
        )

    @staticmethod
    def check_gpu_status() -> Dict[str, Any]:
        """Returns GPU and model status for Output 1."""
        return AIGenerationService.check_gpu_and_model_status()
