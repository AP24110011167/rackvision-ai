import os
import uuid
import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from app.core.config import settings
from app.database.db import get_connection

logger = logging.getLogger("rackvision.sketch_service")

class SketchService:
    @staticmethod
    def create_sample_sketch_if_needed() -> str:
        """Generates a realistic architectural sketch of a data center floor plan with aisles and CRAC units."""
        sample_path = settings.SKETCHES_DIR / "sample_datacenter_sketch.png"
        if not sample_path.exists():
            width, height = 1024, 768
            # Create a blueprint sketch with off-white/pencil aesthetic
            img = np.ones((height, width, 3), dtype=np.uint8) * 248

            # Draw outer perimeter walls (pencil dark charcoal style)
            cv2.rectangle(img, (60, 60), (width - 60, height - 60), (45, 45, 50), 4)
            cv2.rectangle(img, (68, 68), (width - 68, height - 68), (70, 70, 75), 2)

            # Draw electrical UPS room on left
            cv2.rectangle(img, (70, 70), (220, 360), (50, 50, 55), 3)
            cv2.putText(img, "UPS & BATTERY PLANT", (85, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (80, 80, 85), 1, cv2.LINE_AA)
            cv2.rectangle(img, (90, 100), (130, 160), (70, 70, 75), 2)
            cv2.rectangle(img, (150, 100), (190, 160), (70, 70, 75), 2)

            # Draw PDU units
            cv2.rectangle(img, (70, 420), (220, 700), (50, 50, 55), 3)
            cv2.putText(img, "PRIMARY POWER ROOM / PDU", (80, 560), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (80, 80, 85), 1, cv2.LINE_AA)

            # Draw Server Rack Rows (Row A and Row B) with Cold Aisle in middle
            # Row A
            for i in range(8):
                rx = 290 + i * 80
                cv2.rectangle(img, (rx, 160), (rx + 60, 260), (35, 40, 45), 3)
                cv2.putText(img, f"R-A{i+1}", (rx + 8, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (40, 40, 50), 1)

            # Cold aisle notation
            cv2.line(img, (290, 310), (910, 310), (100, 100, 110), 1, cv2.LINE_4)
            cv2.putText(img, "<-- COLD AISLE CONTAINMENT (AIR INLET) -->", (360, 315), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (60, 60, 70), 1, cv2.LINE_AA)

            # Row B
            for i in range(8):
                rx = 290 + i * 80
                cv2.rectangle(img, (rx, 360), (rx + 60, 460), (35, 40, 45), 3)
                cv2.putText(img, f"R-B{i+1}", (rx + 8, 415), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (40, 40, 50), 1)

            # Hot aisle indications
            cv2.putText(img, "[ HOT EXHAUST PLENUM ]", (420, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (120, 60, 60), 1)
            cv2.putText(img, "[ HOT EXHAUST PLENUM ]", (420, 500), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (120, 60, 60), 1)

            # Perimeter CRAC Cooling Units
            # North CRAC units
            cv2.rectangle(img, (340, 70), (460, 110), (40, 40, 45), 2)
            cv2.putText(img, "CRAC-01 (95kW)", (350, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (50, 50, 60), 1)

            cv2.rectangle(img, (740, 70), (860, 110), (40, 40, 45), 2)
            cv2.putText(img, "CRAC-02 (95kW)", (750, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (50, 50, 60), 1)

            # South CRAC units
            cv2.rectangle(img, (340, 598), (460, 638), (40, 40, 45), 2)
            cv2.putText(img, "CRAC-03 (95kW)", (350, 622), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (50, 50, 60), 1)

            cv2.rectangle(img, (740, 598), (860, 638), (40, 40, 45), 2)
            cv2.putText(img, "CRAC-04 (95kW)", (750, 622), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (50, 50, 60), 1)

            # Floor Raised Tiles grid lines
            for gx in range(260, 960, 40):
                cv2.line(img, (gx, 120), (gx, 550), (210, 215, 220), 1)
            for gy in range(120, 560, 40):
                cv2.line(img, (260, gy), (940, gy), (210, 215, 220), 1)

            # Architectural title block
            cv2.rectangle(img, (width - 320, height - 120), (width - 70, height - 70), (50, 50, 60), 2)
            cv2.putText(img, "RACKVISION AI - ARCHITECTURAL SKETCH", (width - 310, height - 98), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (50, 50, 60), 1)
            cv2.putText(img, "SCALE: 1:50 | POD-A REVISION 2.1", (width - 310, height - 80), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (80, 80, 90), 1)

            # Add subtle hand-drawn paper grain noise
            noise = np.random.normal(0, 4, img.shape).astype(np.int16)
            noisy_img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
            cv2.imwrite(str(sample_path), noisy_img)
            logger.info("Generated sample datacenter architectural sketch at %s", sample_path)

        return str(sample_path)

    @staticmethod
    def process_image(
        input_image_path: str,
        output_prefix: str,
        grayscale: bool = True,
        blur_radius: int = 3,
        contrast_alpha: float = 1.3,
        brightness_beta: int = 10,
        canny_low: int = 50,
        canny_high: int = 150,
        invert: bool = False,
        rotation: int = 0,
        crop_box: Tuple[int, int, int, int] = None
    ) -> Tuple[str, str]:
        """
        Runs real OpenCV preprocessing:
        1. Rotation & cropping
        2. Grayscale conversion
        3. Gaussian blur denoising
        4. CLAHE / alpha-beta contrast normalization
        5. Canny edge detection
        Returns (preprocessed_path, canny_edge_path).
        """
        img = cv2.imread(input_image_path)
        if img is None:
            raise ValueError(f"Could not read image from {input_image_path}")

        # Rotation
        if rotation == 90:
            img = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
        elif rotation == 180:
            img = cv2.rotate(img, cv2.ROTATE_180)
        elif rotation == 270:
            img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)

        # Cropping
        if crop_box and len(crop_box) == 4:
            x, y, w, h = crop_box
            h_img, w_img = img.shape[:2]
            if w > 10 and h > 10 and x >= 0 and y >= 0 and x + w <= w_img and y + h <= h_img:
                img = img[y:y+h, x:x+w]

        # Convert to Grayscale if requested
        if grayscale:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Denoising via Gaussian Blur
        if blur_radius > 0:
            k = blur_radius if blur_radius % 2 != 0 else blur_radius + 1
            gray_denoised = cv2.GaussianBlur(gray, (k, k), 0)
        else:
            gray_denoised = gray

        # Contrast and Brightness Adjustment
        # g(x) = alpha * f(x) + beta
        adjusted = cv2.convertScaleAbs(gray_denoised, alpha=contrast_alpha, beta=brightness_beta)

        # Invert if requested
        if invert:
            adjusted = cv2.bitwise_not(adjusted)

        # Canny edge detection
        edges = cv2.Canny(adjusted, canny_low, canny_high)

        # File saving
        preprocessed_filename = f"{output_prefix}_preprocessed.png"
        canny_filename = f"{output_prefix}_canny.png"

        preprocessed_path = settings.SKETCHES_DIR / preprocessed_filename
        canny_path = settings.SKETCHES_DIR / canny_filename

        cv2.imwrite(str(preprocessed_path), adjusted)
        cv2.imwrite(str(canny_path), edges)

        return str(preprocessed_path), str(canny_path)

    @staticmethod
    def get_or_create_sketch(project_id: str, uploaded_file_path: Optional[str] = None) -> Dict[str, Any]:
        """Ensures a project has an active sketch record."""
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM sketches WHERE project_id = ? ORDER BY created_at DESC LIMIT 1", (project_id,))
        row = cursor.fetchone()

        if row:
            conn.close()
            return dict(row)

        # If no sketch, use sample sketch
        sample_path = SketchService.create_sample_sketch_if_needed()
        sketch_id = f"sketch-{uuid.uuid4().hex[:8]}"
        now = datetime.now().isoformat()
        
        pre_path, canny_path = SketchService.process_image(
            sample_path,
            output_prefix=sketch_id,
            grayscale=True,
            blur_radius=3,
            contrast_alpha=1.3,
            brightness_beta=10,
            canny_low=50,
            canny_high=150
        )

        orig_url = f"/outputs/sketches/{os.path.basename(sample_path)}"
        pre_url = f"/outputs/sketches/{os.path.basename(pre_path)}"
        canny_url = f"/outputs/sketches/{os.path.basename(canny_path)}"

        params = {
            "grayscale": True,
            "blur_radius": 3,
            "contrast_alpha": 1.3,
            "brightness_beta": 10,
            "canny_low_thresh": 50,
            "canny_high_thresh": 150,
            "invert": False,
            "rotation": 0
        }

        cursor.execute("""
        INSERT INTO sketches (id, project_id, filename, original_url, preprocessed_url, canny_url, params_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sketch_id,
            project_id,
            "sample_datacenter_sketch.png",
            orig_url,
            pre_url,
            canny_url,
            json.dumps(params),
            now
        ))
        conn.commit()
        conn.close()

        return {
            "id": sketch_id,
            "project_id": project_id,
            "filename": "sample_datacenter_sketch.png",
            "original_url": orig_url,
            "preprocessed_url": pre_url,
            "canny_url": canny_url,
            "params_json": json.dumps(params),
            "created_at": now
        }
from datetime import datetime
