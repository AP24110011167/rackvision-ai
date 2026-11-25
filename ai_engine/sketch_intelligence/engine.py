"""
RackVision AI — Sketch Intelligence Engine Coordinator
Coordinates the 4-step Sketch Intelligence Pipeline:
1. Image Preprocessing (Adaptive thresholding, Canny, Binary)
2. Object Detection & Classification (Bounding boxes, classes, confidence)
3. OCR & Dimension Extraction (Metric text, area, equipment tags)
4. Geometric Layout Reconstruction (Single source of truth JSON)
"""

import os
import cv2
import json
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple

from ai_engine.sketch_intelligence.preprocessor import SketchPreprocessor
from ai_engine.sketch_intelligence.object_detector import ArchitecturalObjectDetector
from ai_engine.sketch_intelligence.ocr_engine import ArchitecturalOCREngine
from ai_engine.sketch_intelligence.layout_reconstructor import GeometricLayoutReconstructor

class SketchIntelligenceEngine:
    def __init__(self):
        self.preprocessor = SketchPreprocessor()
        self.detector = ArchitecturalObjectDetector()
        self.ocr = ArchitecturalOCREngine()
        self.reconstructor = GeometricLayoutReconstructor()

    def analyze_sketch(
        self,
        image_path: str,
        project_id: str,
        output_dir: str
    ) -> Dict[str, Any]:
        """
        Executes complete intelligent extraction on the uploaded drawing.
        Saves:
        - preprocessed.png
        - binary.png
        - canny.png
        - detections_annotated.png (colored overlay)
        - layout.json
        """
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        filename_base = Path(image_path).stem

        # STEP 1: Preprocessing
        prep_results = self.preprocessor.process(image_path)
        original = prep_results["original"]
        processed = prep_results["processed"]
        binary = prep_results["binary"]
        canny = prep_results["canny"]

        pre_path = out_dir / f"{filename_base}_preprocessed.png"
        bin_path = out_dir / f"{filename_base}_binary.png"
        canny_path = out_dir / f"{filename_base}_canny.png"

        cv2.imwrite(str(pre_path), processed)
        cv2.imwrite(str(bin_path), binary)
        cv2.imwrite(str(canny_path), canny)

        # STEP 3: OCR & Dimensions (run OCR first to assist object classification)
        ocr_annotations = self.ocr.extract_text_and_dimensions(original, binary)

        # STEP 2: Object Detection & Classification
        detected_objects = self.detector.detect_objects(original, binary, ocr_annotations)

        # Draw interactive detection visualization overlay
        annotated_img = self._render_detection_overlay(original, detected_objects)
        annotated_path = out_dir / f"{filename_base}_annotated.png"
        cv2.imwrite(str(annotated_path), annotated_img)

        # STEP 4: Geometric Layout Reconstruction
        layout_json = self.reconstructor.reconstruct(
            project_id=project_id,
            source_image_name=Path(image_path).name,
            detected_objects=detected_objects,
            ocr_annotations=ocr_annotations,
            image_shape=original.shape,
            image=original
        )

        def clean_json_types(obj):
            if isinstance(obj, dict):
                return {k: clean_json_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [clean_json_types(v) for v in obj]
            elif isinstance(obj, (np.integer, np.intc, np.int32, np.int64)):
                return int(obj)
            elif isinstance(obj, (np.floating, np.float32, np.float64)):
                return float(obj)
            return obj

        layout_json = clean_json_types(layout_json)
        detected_objects = clean_json_types(detected_objects)
        ocr_annotations = clean_json_types(ocr_annotations)

        layout_path = out_dir / f"{filename_base}_layout.json"
        with open(layout_path, "w", encoding="utf-8") as f:
            json.dump(layout_json, f, indent=2)

        return {
            "project_id": project_id,
            "source_image": Path(image_path).name,
            "original_url": f"/outputs/sketches/{Path(image_path).name}",
            "preprocessed_url": f"/outputs/sketches/{pre_path.name}",
            "binary_url": f"/outputs/sketches/{bin_path.name}",
            "canny_url": f"/outputs/sketches/{canny_path.name}",
            "annotated_url": f"/outputs/sketches/{annotated_path.name}",
            "detected_objects": detected_objects,
            "ocr_annotations": ocr_annotations,
            "layout": layout_json
        }

    def _render_detection_overlay(
        self,
        base_img: np.ndarray,
        detected_objects: list
    ) -> np.ndarray:
        """Draws bounding boxes and labels with category-coded colors."""
        overlay = base_img.copy()

        # Category colors in BGR format
        color_map = {
            "server_rack": (22, 115, 249),       # Orange BGR
            "cooling_unit": (248, 189, 56),      # Blue BGR
            "electrical_unit": (94, 197, 34),    # Green BGR
            "network_unit": (247, 85, 168),      # Purple BGR
            "door": (68, 68, 239),               # Red BGR
            "room_boundary": (68, 68, 239),      # Red BGR
            "aisle": (255, 240, 0)               # Cyan BGR
        }

        for obj in detected_objects:
            bx, by, bw, bh = obj["bbox"]
            cat = obj.get("type", "server_rack")
            color = color_map.get(cat, (0, 240, 255))

            # Draw outer rectangle
            cv2.rectangle(overlay, (bx, by), (bx + bw, by + bh), color, 2)

            # Draw label banner
            label_text = f"{obj.get('label', cat)} ({int(obj.get('confidence', 0.95)*100)}%)"
            (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.38, 1)
            cv2.rectangle(overlay, (bx, max(0, by - th - 6)), (bx + tw + 6, max(0, by)), color, -1)
            cv2.putText(
                overlay,
                label_text,
                (bx + 3, max(th + 2, by - 3)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.38,
                (0, 0, 0),
                1,
                cv2.LINE_AA
            )

        return overlay
