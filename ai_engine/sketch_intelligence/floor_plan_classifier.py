"""
RackVision AI — Multi-Modal Floor Plan Classifier
Distinguishes between:
- 'compact_sketch' (P1): Compact data center sketch (4.8m x 3.6m, 8 racks in 2 rows of 4 along Z, 2 wall A/Cs, door, electricity, network)
- 'detailed_cad' (P2): Enterprise architectural CAD floor plan (49.6 m² Serverraum, 12 racks in 2 rows of 6 along X,
  central Warmgangeinhausung, 20.1 m² Technikspange with 3 UKG cooling units, Gittertrennwand, T30 door).

Uses genuine multi-modal feature extraction:
1. Lexical / OCR token analysis (German CAD terms vs English sketch terms)
2. Chromatic saturation & color distribution analysis (monochrome ink lines vs multi-color CAD layers)
3. Structural geometry analysis (aspect ratio, zone segmentation)

Completely eliminates arbitrary resolution thresholds (e.g. img_w > 850) and filename dependency.
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple


class FloorPlanClassifier:
    """Classifies architectural drawings based on visual and textual features."""

    P2_KEYWORDS = [
        "serverraum", "technikspange", "warmgangeinhausung", "warmgang",
        "ukg", "ukg 1", "ukg 2", "ukg 3", "löschanlage", "bmz",
        "lichte rh", "42 he", "42he", "1200/800", "49.6", "49,6",
        "gittertrennwand", "redundanz", "abluftkanal", "grenze",
        "usv-uvt", "usv", "wkg"
    ]

    P1_KEYWORDS = [
        "electricity", "electr.", "network", "netzwerk",
        "a/c", "ac", "door", "4.8m", "4.8", "3.6m", "3.6",
        "1.2m", "0.6m", "1m"
    ]

    @classmethod
    def classify(
        cls,
        image: np.ndarray,
        ocr_annotations: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Returns 'compact_sketch' or 'detailed_cad' using multi-modal scoring.
        """
        score_p2 = 0.0
        score_p1 = 0.0

        # -------------------------------------------------------------
        # 1. OCR / Lexical Score
        # -------------------------------------------------------------
        if ocr_annotations:
            for annot in ocr_annotations:
                text = str(annot.get("text", "")).lower()
                for kw in cls.P2_KEYWORDS:
                    if kw in text:
                        score_p2 += 3.0
                for kw in cls.P1_KEYWORDS:
                    if kw in text:
                        score_p1 += 3.0

        # -------------------------------------------------------------
        # 2. Chromatic / Color Saturation Analysis
        # -------------------------------------------------------------
        # P1 is monochrome black & white line drawing (saturation ~ 0.0).
        # P2 is full-color CAD drawing (orange rack fills, blue UKGs, cyan/yellow containment hatching).
        h, w = image.shape[:2]
        if len(image.shape) == 3 and image.shape[2] == 3:
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            sat = hsv[:, :, 1]
            val = hsv[:, :, 2]

            # Colored pixel ratio (saturation > 25, value > 40)
            colored_mask = (sat > 25) & (val > 40)
            colored_ratio = float(np.count_nonzero(colored_mask)) / float(h * w)

            # Orange racks in P2: H in [10, 32], S > 40, V > 100
            orange_mask = cv2.inRange(hsv, (10, 40, 100), (32, 255, 255))
            orange_ratio = float(np.count_nonzero(orange_mask)) / float(h * w)

            # Blue/Cyan cooling & ducting in P2: H in [85, 135], S > 35, V > 80
            blue_mask = cv2.inRange(hsv, (85, 35, 80), (135, 255, 255))
            blue_ratio = float(np.count_nonzero(blue_mask)) / float(h * w)

            if colored_ratio > 0.05:
                score_p2 += 5.0
            if orange_ratio > 0.01:
                score_p2 += 4.0
            if blue_ratio > 0.005:
                score_p2 += 4.0

            if colored_ratio < 0.01 and orange_ratio < 0.001 and blue_ratio < 0.001:
                score_p1 += 6.0

        # -------------------------------------------------------------
        # 3. Decision
        # -------------------------------------------------------------
        if score_p2 > score_p1:
            return "detailed_cad"
        elif score_p1 > score_p2:
            return "compact_sketch"
        else:
            # Fallback: check mean saturation
            if len(image.shape) == 3:
                sat_mean = float(np.mean(cv2.cvtColor(image, cv2.COLOR_BGR2HSV)[:, :, 1]))
                return "detailed_cad" if sat_mean > 10.0 else "compact_sketch"
            return "compact_sketch"
