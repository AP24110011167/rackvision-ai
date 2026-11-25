"""
ImageReferenceService — Structural and Style Reference Conditioning Service.

Provides:
- Extraction of structural reference images from Output 2 geometry reconstruction
- Canny edge map extraction from preprocessed sketch
- Base64 encoding and URL resolution for image-to-image and image-reference diffusion
- Storage and alignment of visual quality reference targets
"""

import os
import base64
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from PIL import Image

from app.core.config import settings

logger = logging.getLogger("rackvision.image_reference")


class ImageReferenceService:
    """
    Manages structural reference conditioning images to ensure the AI image generator
    is strictly constrained to the user's sketch and confirmed layout geometry.
    """

    @staticmethod
    def get_structural_canny_image(
        project_id: str,
        sketch_id: Optional[str] = None,
        width: int = 768,
        height: int = 768,
        camera_viewpoint: str = "cinematic_central_aisle"
    ) -> Path:
        """
        Synthesizes a genuine 3D architectural perspective ControlNet Canny edge map
        strictly conditioned on the project's verified layout geometry.

        ARCHITECTURAL FIDELITY UPGRADE:
        - Output 2 raster dependency has been completely removed.
        - Generic symmetrical corridor calculations have been eliminated.
        - Uses GeometryReconstructionService to project exact 3D metric coordinates
          (racks, hot-aisle containment, UKG cooling units in technical spange,
          doors, and room boundary grid).
        """
        from app.services.layout_service import LayoutService
        from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService
        import hashlib
        import json

        sketches_dir = settings.SKETCHES_DIR
        sketches_dir.mkdir(parents=True, exist_ok=True)
        layout = LayoutService.get_layout(project_id)
        layout_hash = hashlib.sha256(json.dumps(layout, sort_keys=True).encode()).hexdigest()[:10] if layout else "nolayout"
        target_canny_path = sketches_dir / f"{project_id}_{layout_hash}_{camera_viewpoint}_canny.png"

        canny_img = GeometryReconstructionService.generate_canny_conditioning_image(
            layout=layout,
            width=width,
            height=height,
            camera_viewpoint=camera_viewpoint
        )
        canny_img.save(str(target_canny_path), "PNG")
        logger.info("Generated layout-driven 3D architectural Canny conditioning map: %s", target_canny_path)
        return target_canny_path

    @staticmethod
    def get_structural_reference_image(
        project_id: str,
        sketch_id: Optional[str] = None
    ) -> Optional[Path]:
        """
        Locates the best available structural conditioning reference:
        1. Output 2 Geometry Reconstruction image (highest geometric fidelity)
        2. Preprocessed sketch Canny edge map
        3. Uploaded raw sketch
        """
        designs_dir = settings.DESIGNS_DIR
        sketches_dir = settings.SKETCHES_DIR

        # 1. Search for existing Output 2 Photorealistic Preview strictly for this project
        if designs_dir.exists():
            for f in sorted(designs_dir.glob(f"*{project_id}*photo*.png"), reverse=True):
                return f

        # 2. Search for sketch Canny edge map strictly for this sketch or project
        if sketches_dir.exists():
            if sketch_id:
                canny = sketches_dir / f"{sketch_id}_canny.png"
                if canny.exists():
                    return canny
                raw_canny = sketches_dir / f"{sketch_id}_raw_canny.png"
                if raw_canny.exists():
                    return raw_canny

            for f in sorted(sketches_dir.glob(f"*{project_id}*_canny.png"), reverse=True):
                return f

        return None

    @staticmethod
    def encode_image_base64(image_path: Path) -> Optional[str]:
        """Encodes an image file into base64 data URI."""
        if not image_path.exists():
            return None
        try:
            with open(image_path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode("utf-8")
                ext = image_path.suffix.lstrip(".").lower()
                mime = "image/png" if ext == "png" else "image/jpeg"
                return f"data:{mime};base64,{encoded}"
        except Exception as e:
            logger.warning("Failed to encode image %s: %s", image_path, e)
            return None
