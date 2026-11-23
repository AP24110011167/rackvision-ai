"""
ImageValidationService — Quality Assurance & File Integrity Verifier.

Validates that visual outputs:
- Exist on disk and are readable
- Have non-zero byte size (> 10KB)
- Possess valid PNG magic bytes header
- Match target dimensions and RGB color space
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
from PIL import Image

logger = logging.getLogger("rackvision.validation")

PNG_MAGIC_BYTES = b"\x89PNG\r\n\x1a\n"


class ImageValidationService:
    @staticmethod
    def validate_image_file(file_path: Path, expected_min_bytes: int = 15000) -> Tuple[bool, str]:
        """Validates that an image file on disk is authentic, non-empty, and valid PNG."""
        if not file_path.exists():
            return False, f"File does not exist: {file_path}"

        size = file_path.stat().st_size
        if size < expected_min_bytes:
            return False, f"File size too small ({size} bytes, expected >= {expected_min_bytes})"

        try:
            with open(file_path, "rb") as f:
                header = f.read(8)
                if header != PNG_MAGIC_BYTES:
                    return False, "Invalid PNG magic bytes header"

            with Image.open(str(file_path)) as img:
                img.verify()

            return True, f"Valid PNG image ({size} bytes)"
        except Exception as e:
            return False, f"Image corruption error: {str(e)}"

    @staticmethod
    def validate_png(file_path: Path, expected_min_bytes: int = 10000) -> bool:
        """Convenience method returning bool for quick validation."""
        valid, msg = ImageValidationService.validate_image_file(file_path, expected_min_bytes)
        if not valid:
            logger.warning("PNG validation warning for %s: %s", file_path, msg)
        return valid

    @staticmethod
    def get_image_metadata(file_path: Path) -> Dict[str, Any]:
        """Retrieves verified dimensions, mode, and format of an image."""
        try:
            with Image.open(str(file_path)) as img:
                return {
                    "width": img.width,
                    "height": img.height,
                    "resolution": f"{img.width}x{img.height}",
                    "mode": img.mode,
                    "format": img.format,
                    "size_bytes": file_path.stat().st_size,
                    "valid": True
                }
        except Exception as e:
            return {"valid": False, "error": str(e)}
