"""
RackVision AI — Quantitative Model Evaluation Pipeline
Calculates SSIM, PSNR, and Canny Edge Alignment metrics
to assess structural preservation of hand-drawn sketches.
"""

import cv2
import numpy as np
from typing import Dict, Any

class ModelEvaluator:
    @staticmethod
    def calculate_psnr(image_true: np.ndarray, image_pred: np.ndarray) -> float:
        """
        Calculates Peak Signal-to-Noise Ratio (PSNR) in decibels (dB).
        
        Limitation: PSNR measures pixel-by-pixel Mean Squared Error (MSE).
        In generative AI, style variations or photorealistic textures cause low PSNR
        even when spatial rack alignment and aisle geometry are perfectly preserved.
        """
        mse = np.mean((image_true.astype(np.float64) - image_pred.astype(np.float64)) ** 2)
        if mse == 0:
            return float("inf")
        max_pixel = 255.0
        return 20.0 * np.log10(max_pixel / np.sqrt(mse))

    @staticmethod
    def calculate_ssim(image_a: np.ndarray, image_b: np.ndarray) -> float:
        """
        Computes Structural Similarity Index Measure (SSIM) between luminance components.
        Range: [-1, 1], where 1 represents identical structural features.
        
        Limitation: Sensitive to uniform illumination shifts or global brightness changes
        typical between white paper sketches and dark cyberpunk data center interiors.
        """
        if len(image_a.shape) == 3:
            gray_a = cv2.cvtColor(image_a, cv2.COLOR_BGR2GRAY)
        else:
            gray_a = image_a

        if len(image_b.shape) == 3:
            gray_b = cv2.cvtColor(image_b, cv2.COLOR_BGR2GRAY)
        else:
            gray_b = image_b

        if gray_a.shape != gray_b.shape:
            gray_b = cv2.resize(gray_b, (gray_a.shape[1], gray_a.shape[0]))

        # Constants for stability
        C1 = (0.01 * 255) ** 2
        C2 = (0.03 * 255) ** 2

        img1 = gray_a.astype(np.float64)
        img2 = gray_b.astype(np.float64)

        kernel = cv2.getGaussianKernel(11, 1.5)
        window = np.outer(kernel, kernel.transpose())

        mu1 = cv2.filter2D(img1, -1, window)[5:-5, 5:-5]
        mu2 = cv2.filter2D(img2, -1, window)[5:-5, 5:-5]
        mu1_sq = mu1 ** 2
        mu2_sq = mu2 ** 2
        mu1_mu2 = mu1 * mu2

        sigma1_sq = cv2.filter2D(img1 ** 2, -1, window)[5:-5, 5:-5] - mu1_sq
        sigma2_sq = cv2.filter2D(img2 ** 2, -1, window)[5:-5, 5:-5] - mu2_sq
        sigma12 = cv2.filter2D(img1 * img2, -1, window)[5:-5, 5:-5] - mu1_mu2

        ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))
        return float(np.mean(ssim_map))

    @staticmethod
    def calculate_edge_preservation_score(sketch_canny: np.ndarray, generated_image: np.ndarray) -> Dict[str, float]:
        """
        Calculates Edge Overlap Precision, Recall, and F1-Score between the original
        sketch Canny edge map and the Canny edges extracted from the generated photorealistic image.
        This directly measures ControlNet's geometric preservation fidelity.
        """
        if len(generated_image.shape) == 3:
            gen_gray = cv2.cvtColor(generated_image, cv2.COLOR_BGR2GRAY)
        else:
            gen_gray = generated_image

        if sketch_canny.shape != gen_gray.shape:
            gen_gray = cv2.resize(gen_gray, (sketch_canny.shape[1], sketch_canny.shape[0]))

        # Extract edges from generated image
        gen_edges = cv2.Canny(gen_gray, 50, 150)

        # Binary edge masks
        mask_sketch = (sketch_canny > 128).astype(np.uint8)
        mask_gen = (gen_edges > 128).astype(np.uint8)

        # Dilate sketch slightly (3px) to allow minor generative tolerance
        dilated_sketch = cv2.dilate(mask_sketch, np.ones((3, 3), np.uint8), iterations=1)

        overlap = np.sum((mask_gen == 1) & (dilated_sketch == 1))
        total_gen_edges = np.sum(mask_gen == 1)
        total_sketch_edges = np.sum(mask_sketch == 1)

        precision = float(overlap / (total_gen_edges + 1e-6))
        recall = float(overlap / (total_sketch_edges + 1e-6))
        f1 = float(2 * precision * recall / (precision + recall + 1e-6))

        return {
            "edge_precision": round(min(1.0, precision), 3),
            "edge_recall": round(min(1.0, recall), 3),
            "edge_f1_score": round(min(1.0, f1), 3),
            "edge_alignment_percentage": round(min(100.0, f1 * 100), 1)
        }
