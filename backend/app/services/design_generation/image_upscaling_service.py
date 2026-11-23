"""
ImageUpscalingService — High-Definition Architectural Edge-Preserving Upscaler.

Features:
- Aspect-ratio-preserving scaling with intelligent architectural framing (cinematic crop or pillarbox padding)
- Zero geometric distortion of server racks, central aisles, and containment units
- High-order Lanczos resampling (anti-aliased)
- Architectural edge enhancement via unsharp masking
- Dynamic range and specular contrast normalization
"""

import logging
from typing import Tuple, Optional
from PIL import Image, ImageFilter, ImageEnhance

logger = logging.getLogger("rackvision.upscaling")


class ImageUpscalingService:
    @staticmethod
    def upscale_architectural_render(
        image: Image.Image,
        target_w: int = 1920,
        target_h: int = 1080,
        fit_mode: str = "crop",
        centering: Tuple[float, float] = (0.5, 0.48),
        sharpen_radius: float = 1.6,
        sharpen_percent: int = 125,
        contrast_boost: float = 1.05
    ) -> Image.Image:
        """
        Upscales an architectural render to high-definition presentation standards (1080p widescreen)
        while strictly preserving original aspect ratio and geometry without stretching or distortion.
        
        Args:
            image: Input PIL Image (e.g., 768x768 from SDXL).
            target_w: Desired widescreen width (1920).
            target_h: Desired widescreen height (1080).
            fit_mode: 'crop' (cinematic full-bleed center crop) or 'pad' (aspect-fit with dark matte).
            centering: (x_bias, y_bias) for crop positioning. Default (0.5, 0.48) preserves corridor perspective.
            sharpen_radius: Radius for architectural unsharp mask.
            sharpen_percent: Edge enhancement percentage.
            contrast_boost: Contrast curve adjustment.
        """
        src_w, src_h = image.size

        # 1. Aspect-Ratio-Preserving Resampling (Zero Geometric Distortion)
        if src_w == target_w and src_h == target_h:
            resampled = image.copy()
        elif fit_mode == "pad":
            # Scale to fit entirely inside target bounding box (pillarbox / letterbox with architectural dark matte)
            scale = min(target_w / src_w, target_h / src_h)
            new_w = max(1, round(src_w * scale))
            new_h = max(1, round(src_h * scale))
            scaled = image.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Center on sleek neutral architectural dark matte (#0a0b10)
            resampled = Image.new("RGB", (target_w, target_h), (10, 11, 16))
            paste_x = (target_w - new_w) // 2
            paste_y = (target_h - new_h) // 2
            resampled.paste(scaled, (paste_x, paste_y))
        else:
            # 'crop' (default cinematic architectural framing):
            # Uniform scale to cover target bounding box, preserving 1:1 pixel geometry
            # e.g., 768x768 -> 1920x1920 uniform 2.5x upscale -> center crop to 1920x1080
            scale = max(target_w / src_w, target_h / src_h)
            new_w = max(1, round(src_w * scale))
            new_h = max(1, round(src_h * scale))
            scaled = image.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Crop excess height using architectural perspective center bias (0.48 y-bias retains floor reflections)
            offset_x = max(0, min(new_w - target_w, round((new_w - target_w) * centering[0])))
            offset_y = max(0, min(new_h - target_h, round((new_h - target_h) * centering[1])))
            resampled = scaled.crop((offset_x, offset_y, offset_x + target_w, offset_y + target_h))

        # 2. Unsharp mask for high-frequency architectural edge recovery
        sharpened = resampled.filter(
            ImageFilter.UnsharpMask(radius=sharpen_radius, percent=sharpen_percent, threshold=3)
        )

        # 3. Dynamic range and contrast normalization
        enhancer = ImageEnhance.Contrast(sharpened)
        contrasted = enhancer.enhance(contrast_boost)

        color_enhancer = ImageEnhance.Color(contrasted)
        final_img = color_enhancer.enhance(1.02)

        return final_img

    @staticmethod
    def upscale_lanczos(
        image: Image.Image,
        target_w: int = 1920,
        target_h: int = 1080,
        unsharp_radius: float = 1.6,
        unsharp_percent: int = 125,
        fit_mode: str = "crop"
    ) -> Image.Image:
        """Alias for upscale_architectural_render preserving aspect ratio."""
        return ImageUpscalingService.upscale_architectural_render(
            image=image,
            target_w=target_w,
            target_h=target_h,
            fit_mode=fit_mode,
            sharpen_radius=unsharp_radius,
            sharpen_percent=unsharp_percent
        )
