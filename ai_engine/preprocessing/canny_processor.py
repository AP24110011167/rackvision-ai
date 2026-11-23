"""
RackVision AI — Computer Vision & Preprocessing Pipeline
Provides OpenCV Canny edge extraction, adaptive thresholding,
bilateral noise filtering, and perspective normalization.
"""

import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Optional

class CannyEdgeProcessor:
    def __init__(self, low_threshold: int = 50, high_threshold: int = 150):
        self.low_threshold = low_threshold
        self.high_threshold = high_threshold

    def process_sketch(
        self,
        image_input: np.ndarray,
        apply_blur: bool = True,
        blur_ksize: int = 3,
        clahe_clip_limit: float = 2.0,
        invert_result: bool = False
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Processes a raw hand-drawn sketch and extracts clean edge maps for ControlNet.
        
        Args:
            image_input: BGR or Grayscale numpy array.
            apply_blur: Whether to apply Gaussian noise smoothing.
            blur_ksize: Kernel size for smoothing (must be odd).
            clahe_clip_limit: CLAHE threshold for local contrast enhancement.
            invert_result: Invert white/black pixels if needed.
            
        Returns:
            (preprocessed_normalized_image, canny_edge_map)
        """
        # Ensure grayscale
        if len(image_input.shape) == 3:
            gray = cv2.cvtColor(image_input, cv2.COLOR_BGR2GRAY)
        else:
            gray = image_input.copy()

        # CLAHE (Contrast Limited Adaptive Histogram Equalization)
        # Normalizes uneven sketch illumination and hand-drawn shading
        clahe = cv2.createCLAHE(clipLimit=clahe_clip_limit, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # Bilateral / Gaussian Filtering to preserve sharp lines while eliminating paper grain noise
        if apply_blur and blur_ksize > 1:
            k = blur_ksize if blur_ksize % 2 != 0 else blur_ksize + 1
            denoised = cv2.GaussianBlur(enhanced, (k, k), 0)
        else:
            denoised = enhanced

        # Canny edge operator
        edges = cv2.Canny(denoised, self.low_threshold, self.high_threshold)

        if invert_result:
            edges = cv2.bitwise_not(edges)

        return denoised, edges

    @staticmethod
    def resize_for_diffusion(image: Image.Image, max_dim: int = 768) -> Image.Image:
        """Resizes image to multiples of 64 required by Latent Diffusion VAE."""
        w, h = image.size
        scale = max_dim / max(w, h)
        new_w = int(round(w * scale / 64.0)) * 64
        new_h = int(round(h * scale / 64.0)) * 64
        return image.resize((new_w, new_h), Image.Resampling.LANCZOS)
