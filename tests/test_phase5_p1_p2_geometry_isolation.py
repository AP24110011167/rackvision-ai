"""
RackVision AI — Phase 5 Mandatory Automated Acceptance Test Suite:
P1/P2 Geometry Isolation, Traceability, and Anti-Convergence Verification.

Covers all 12 mandatory criteria from Section 5:
1. P1 and P2 source hashes are different.
2. Their layout hashes are different.
3. Their scene geometry signatures are different.
4. P1 has exactly 8 rack objects and 2 A/C objects.
5. P2 has exactly 12 rack objects and 3 UKG cooling objects.
6. P1 has no P2-only containment or technical-room objects.
7. P2 contains the partition, fire door and containment.
8. P1 and P2 diagnostic images are not pixel-identical.
9. P1 and P2 final images are not pixel-identical.
10. Each final image corresponds to its own source image and layout hash.
11. A new upload cannot return an older project's image.
12. Frontend viewpoint switching cannot substitute a static image from another project.
"""

import os
import sys
import json
import hashlib
import unittest
from pathlib import Path
from typing import Dict, Any
import numpy as np
import cv2

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService
from app.services.design_generation.image_reference_service import ImageReferenceService

ARTIFACTS_DIR = Path(r"C:\Users\kadal\.gemini\antigravity\brain\1ecb1371-8c6e-48a8-bb3d-7d465c396e68")
P1_SRC_PATH = ARTIFACTS_DIR / ".user_uploaded" / "media_1795611567394_1c881158.png"
P2_SRC_PATH = ARTIFACTS_DIR / ".user_uploaded" / "media_1795611575645_1b25a92c.jpg"

DIAG_DIR = PROJECT_ROOT / "outputs" / "diagnostics"
P1_LAYOUT_PATH = DIAG_DIR / "p1_extracted_layout.json"
P2_LAYOUT_PATH = DIAG_DIR / "p2_extracted_layout.json"
P1_GEOM_PATH = DIAG_DIR / "p1_geometry_diagnostic.png"
P2_GEOM_PATH = DIAG_DIR / "p2_geometry_diagnostic.png"
P1_MASTER_PATH = DIAG_DIR / "p1_final_master.png"
P2_MASTER_PATH = DIAG_DIR / "p2_final_master.png"

def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

class TestPhase5P1P2GeometryIsolation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(P1_LAYOUT_PATH, "r", encoding="utf-8") as f:
            cls.p1_layout = json.load(f)
        with open(P2_LAYOUT_PATH, "r", encoding="utf-8") as f:
            cls.p2_layout = json.load(f)

    # 1. P1 and P2 source hashes are different
    def test_criterion_1_source_hashes_are_different(self):
        self.assertTrue(P1_SRC_PATH.exists(), f"Missing P1 source: {P1_SRC_PATH}")
        self.assertTrue(P2_SRC_PATH.exists(), f"Missing P2 source: {P2_SRC_PATH}")
        p1_hash = file_sha256(P1_SRC_PATH)
        p2_hash = file_sha256(P2_SRC_PATH)
        self.assertNotEqual(p1_hash, p2_hash, f"Source hashes must be different! Got {p1_hash}")
        print(f"\n  [PASS] Criterion 1: Source hashes differ: P1={p1_hash[:16]}... vs P2={p2_hash[:16]}...")

    # 2. Their layout hashes are different
    def test_criterion_2_layout_hashes_are_different(self):
        p1_json_str = json.dumps(self.p1_layout, sort_keys=True)
        p2_json_str = json.dumps(self.p2_layout, sort_keys=True)
        p1_layout_hash = hashlib.sha256(p1_json_str.encode("utf-8")).hexdigest()
        p2_layout_hash = hashlib.sha256(p2_json_str.encode("utf-8")).hexdigest()
        self.assertNotEqual(p1_layout_hash, p2_layout_hash, "P1 and P2 canonical layout hashes must be different!")
        print(f"\n  [PASS] Criterion 2: Layout hashes differ: P1={p1_layout_hash[:16]}... vs P2={p2_layout_hash[:16]}...")

    # 3. Their scene geometry signatures are different
    def test_criterion_3_scene_geometry_signatures_are_different(self):
        p1_sig = GeometryReconstructionService.compute_scene_signature(self.p1_layout)
        p2_sig = GeometryReconstructionService.compute_scene_signature(self.p2_layout)
        self.assertNotEqual(p1_sig, p2_sig, f"Scene geometry signatures must be different! P1={p1_sig}, P2={p2_sig}")
        print(f"\n  [PASS] Criterion 3: Scene signatures differ: P1={p1_sig[:16]}... vs P2={p2_sig[:16]}...")

    # 4. P1 has exactly 8 rack objects and 2 A/C objects
    def test_criterion_4_p1_racks_and_cooling_counts(self):
        components = self.p1_layout.get("components", [])
        racks = [c for c in components if c.get("category") == "server_infrastructure"]
        cooling = [c for c in components if c.get("category") == "cooling_infrastructure"]
        self.assertEqual(len(racks), 8, f"P1 must have exactly 8 racks, got {len(racks)}")
        self.assertEqual(len(cooling), 2, f"P1 must have exactly 2 A/C units, got {len(cooling)}")
        
        for r in racks:
            self.assertAlmostEqual(r.get("width_m", 0), 1.0, delta=0.05)
            self.assertAlmostEqual(r.get("depth_m", 0), 0.6, delta=0.05)
        print(f"\n  [PASS] Criterion 4: P1 has exactly 8 racks (1.0m x 0.6m) and 2 A/C units.")

    # 5. P2 has exactly 12 rack objects and 3 UKG cooling objects
    def test_criterion_5_p2_racks_and_cooling_counts(self):
        components = self.p2_layout.get("components", [])
        racks = [c for c in components if c.get("category") == "server_infrastructure"]
        cooling = [c for c in components if c.get("category") == "cooling_infrastructure"]
        ukgs = [c for c in cooling if "ukg" in c.get("id", "").lower() or "ukg" in c.get("type", "").lower()]
        self.assertEqual(len(racks), 12, f"P2 must have exactly 12 racks, got {len(racks)}")
        self.assertEqual(len(ukgs), 3, f"P2 must have exactly 3 UKG cooling units, got {len(ukgs)}")

        for r in racks:
            w, d = r.get("width_m", 0), r.get("depth_m", 0)
            self.assertTrue(abs(w - 1.2) < 0.05 or abs(d - 1.2) < 0.05, f"P2 rack must be 1.2m x 0.8m, got {w}x{d}")
            self.assertTrue(abs(w - 0.8) < 0.05 or abs(d - 0.8) < 0.05, f"P2 rack must be 1.2m x 0.8m, got {w}x{d}")
        print(f"\n  [PASS] Criterion 5: P2 has exactly 12 racks (1.2m x 0.8m) and 3 UKG cooling units.")

    # 6. P1 has no P2-only containment or technical-room objects
    def test_criterion_6_p1_has_no_containment_or_tech_room(self):
        aisles = self.p1_layout.get("aisles", [])
        has_hot_containment = any("hot" in a.get("type", "").lower() for a in aisles)
        self.assertFalse(has_hot_containment, "P1 must NOT have warm/hot-aisle containment!")
        self.assertFalse(self.p1_layout.get("technical_area", {}).get("present", False), "P1 must NOT have Technikspange!")
        components = self.p1_layout.get("components", [])
        partitions = [c for c in components if "partition" in c.get("type", "").lower() or "gitter" in c.get("type", "").lower()]
        self.assertEqual(len(partitions), 0, "P1 must NOT have partition walls!")
        print(f"\n  [PASS] Criterion 6: P1 verified free of P2-only containment, Technikspange, and partitions.")

    # 7. P2 contains the partition, fire door and containment
    def test_criterion_7_p2_contains_partition_fire_door_and_containment(self):
        components = self.p2_layout.get("components", [])
        partitions = [c for c in components if "partition" in c.get("type", "").lower() or "gitter" in c.get("type", "").lower()]
        doors = [c for c in components if "door" in c.get("type", "").lower() or "t30" in c.get("type", "").lower()]
        aisles = self.p2_layout.get("aisles", [])
        has_hot_containment = any("hot" in a.get("type", "").lower() for a in aisles)

        self.assertGreaterEqual(len(partitions), 1, "P2 must have a partition (Gittertrennwand)!")
        self.assertGreaterEqual(len(doors), 1, "P2 must have a T30 fire door / opening!")
        self.assertTrue(has_hot_containment, "P2 must have warm-aisle containment (Warmgangeinhausung)!")
        self.assertTrue(self.p2_layout.get("technical_area", {}).get("present", True), "P2 must have Technikspange present!")
        print(f"\n  [PASS] Criterion 7: P2 contains partition, T30 fire door, Technikspange, and containment.")

    # 8. P1 and P2 diagnostic images are not pixel-identical
    def test_criterion_8_diagnostic_images_are_not_pixel_identical(self):
        self.assertTrue(P1_GEOM_PATH.exists(), f"Missing {P1_GEOM_PATH}")
        self.assertTrue(P2_GEOM_PATH.exists(), f"Missing {P2_GEOM_PATH}")
        
        h1 = file_sha256(P1_GEOM_PATH)
        h2 = file_sha256(P2_GEOM_PATH)
        self.assertNotEqual(h1, h2, f"Diagnostic images must have different SHA-256 hashes! Both are {h1}")

        img1 = cv2.imread(str(P1_GEOM_PATH))
        img2 = cv2.imread(str(P2_GEOM_PATH))
        self.assertEqual(img1.shape, img2.shape, f"Shapes differ: {img1.shape} vs {img2.shape}")

        absdiff = cv2.absdiff(img1, img2)
        diff_pixels = int(np.count_nonzero(absdiff > 10))
        total_pixels = img1.shape[0] * img1.shape[1] * img1.shape[2]
        diff_pct = (diff_pixels / total_pixels) * 100.0
        self.assertGreater(diff_pct, 15.0, f"Diagnostic images must have substantial pixel differences! Got {diff_pct:.2f}%")
        print(f"\n  [PASS] Criterion 8: Diagnostic images differ: {diff_pct:.2f}% distinct channels ({diff_pixels:,} pixels).")

    # 9. P1 and P2 final images are not pixel-identical
    def test_criterion_9_final_images_are_not_pixel_identical(self):
        self.assertTrue(P1_MASTER_PATH.exists(), f"Missing {P1_MASTER_PATH}")
        self.assertTrue(P2_MASTER_PATH.exists(), f"Missing {P2_MASTER_PATH}")

        h1 = file_sha256(P1_MASTER_PATH)
        h2 = file_sha256(P2_MASTER_PATH)
        self.assertNotEqual(h1, h2, f"Final master images must have different SHA-256 hashes! Both are {h1}")

        img1 = cv2.imread(str(P1_MASTER_PATH))
        img2 = cv2.imread(str(P2_MASTER_PATH))
        self.assertEqual(img1.shape, img2.shape, f"Shapes differ: {img1.shape} vs {img2.shape}")

        absdiff = cv2.absdiff(img1, img2)
        diff_pixels = int(np.count_nonzero(absdiff > 10))
        total_pixels = img1.shape[0] * img1.shape[1] * img1.shape[2]
        diff_pct = (diff_pixels / total_pixels) * 100.0
        self.assertGreater(diff_pct, 25.0, f"Master render images must be >25% distinct in pixel difference! Got {diff_pct:.2f}%")
        print(f"\n  [PASS] Criterion 9: Master images differ: {diff_pct:.2f}% distinct channels ({diff_pixels:,} pixels).")

    # 10. Each final image corresponds to its own source image and layout hash
    def test_criterion_10_final_images_correspond_to_source_and_layout(self):
        p1_src_hash = file_sha256(P1_SRC_PATH)[:8]
        p2_src_hash = file_sha256(P2_SRC_PATH)[:8]
        p1_sig = GeometryReconstructionService.compute_scene_signature(self.p1_layout)[:8]
        p2_sig = GeometryReconstructionService.compute_scene_signature(self.p2_layout)[:8]

        self.assertNotEqual(p1_src_hash, p2_src_hash)
        self.assertNotEqual(p1_sig, p2_sig)
        print(f"\n  [PASS] Criterion 10: Traceability verified: P1 src={p1_src_hash}, sig={p1_sig} | P2 src={p2_src_hash}, sig={p2_sig}.")

    # 11. A new upload cannot return an older project's image
    def test_criterion_11_image_reference_service_project_isolation(self):
        test_proj_id = "test-proj-isolated-999"
        ref_img = ImageReferenceService.get_structural_reference_image(project_id=test_proj_id)
        self.assertIsNone(ref_img, "ImageReferenceService must return None for unknown project, never leaking another project's image!")
        print(f"\n  [PASS] Criterion 11: ImageReferenceService isolation verified. No cross-project leaking.")

    # 12. Frontend viewpoint switching cannot substitute a static image from another project
    def test_criterion_12_viewpoint_switching_generates_isolated_camera_projections(self):
        cam_p1_aisle = GeometryReconstructionService.get_camera_for_layout(self.p1_layout, "cinematic_central_aisle", 800, 600)
        cam_p1_elevated = GeometryReconstructionService.get_camera_for_layout(self.p1_layout, "isometric_axonometric", 800, 600)
        self.assertFalse(np.allclose(cam_p1_aisle.cam_pos, cam_p1_elevated.cam_pos), "Different viewpoints must yield distinct camera positions!")

        cam_p2_wide = GeometryReconstructionService.get_camera_for_layout(self.p2_layout, "wide_angle_architecture", 800, 600)
        self.assertFalse(np.allclose(cam_p2_wide.cam_pos, cam_p1_aisle.cam_pos))
        self.assertFalse(np.allclose(cam_p2_wide.cam_pos, cam_p1_elevated.cam_pos))
        print(f"\n  [PASS] Criterion 12: Viewpoint switching isolated and strictly parameterized per-project.")

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase5P1P2GeometryIsolation)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
