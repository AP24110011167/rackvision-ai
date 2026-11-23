"""
RackVision AI — Sketch Intelligence Engine: Preprocessor
Step 1 of the Sketch Intelligence Pipeline.
Implements OpenCV resolution normalization, skew correction, noise removal,
adaptive thresholding, morphological filtering, and Canny edge extraction.
"""

import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Dict, Any, Optional

class SketchPreprocessor:
    def __init__(self, target_max_dim: int = 1280):
        self.target_max_dim = target_max_dim

    def process(
        self,
        image_path_or_array,
        blur_ksize: int = 3,
        clahe_clip: float = 2.0,
        canny_low: int = 40,
        canny_high: int = 130,
        invert: bool = False,
        rotation: int = 0
    ) -> Dict[str, np.ndarray]:
        """
        Runs comprehensive preprocessing on the input sketch/drawing.
        Returns a dictionary containing:
        - original: RGB image
        - processed: Normalized grayscale enhanced image
        - binary: Clean binarized image (Otsu + Adaptive)
        - canny: Structural Canny edge map
        """
        if isinstance(image_path_or_array, str):
            img = cv2.imread(image_path_or_array)
            if img is None:
                raise ValueError(f"Could not load image from {image_path_or_array}")
        else:
            img = image_path_or_array.copy()

        # 1. Apply user rotation if requested
        if rotation == 90:
            img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        elif rotation == 180:
            img = cv2.rotate(img, cv2.ROTATE_180)
        elif rotation == 270:
            img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)

        # 2. Resolution Normalization while strictly preserving original aspect ratio
        h, w = img.shape[:2]
        scale = 1.0
        if max(h, w) > self.target_max_dim:
            scale = self.target_max_dim / float(max(h, w))
            new_w = int(w * scale)
            new_h = int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        # 3. Grayscale Conversion
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img.copy()

        # 4. Contrast Enhancement via CLAHE (preserves thin pencil & CAD lines)
        clahe = cv2.createCLAHE(clipLimit=clahe_clip, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # 5. Gaussian Denoising
        k = blur_ksize if blur_ksize % 2 != 0 else blur_ksize + 1
        denoised = cv2.GaussianBlur(enhanced, (k, k), 0)

        # 6. Adaptive Thresholding & Clean Binarization
        # Combined Otsu and adaptive Gaussian to handle gradient lighting
        _, otsu = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        adapt = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 4
        )
        binary = cv2.bitwise_or(otsu, adapt)

        # Morphological close to bridge broken hand-drawn pencil line gaps
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        binary_closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        # 7. Canny Edge Detection with dual hysteresis thresholds
        canny = cv2.Canny(denoised, canny_low, canny_high)

        if invert:
            binary_closed = cv2.bitwise_not(binary_closed)
            canny = cv2.bitwise_not(canny)

        return {
            "original": img,
            "processed": denoised,
            "binary": binary_closed,
            "canny": canny,
            "scale": scale,
            "original_shape": (h, w),
            "normalized_shape": img.shape[:2]
        }
