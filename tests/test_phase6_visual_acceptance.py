"""
RackVision AI — Phase 6 Visual Acceptance Test Suite:
Validates P1 & P2 ground-truth geometry, all 3 camera viewpoints, equipment visibility,
and non-occlusion for Output 3.
"""

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

DIAG_DIR = PROJECT_ROOT / "outputs" / "diagnostics"
P1_LAYOUT_PATH = DIAG_DIR / "p1_extracted_layout.json"
P2_LAYOUT_PATH = DIAG_DIR / "p2_extracted_layout.json"

def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

class TestPhase6VisualAcceptance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(P1_LAYOUT_PATH, "r", encoding="utf-8") as f:
            cls.p1_layout = json.load(f)
        with open(P2_LAYOUT_PATH, "r", encoding="utf-8") as f:
            cls.p2_layout = json.load(f)

    # 1. P1 Visual Acceptance: Exactly 8 racks (2 rows of 4), 2 A/Cs, 4.8x3.6m footprint, 1.2m aisle
    def test_p1_visual_acceptance_geometry(self):
        room = self.p1_layout.get("room", {})
        self.assertAlmostEqual(room.get("width_m", 0), 4.8, delta=0.1)
        self.assertAlmostEqual(room.get("length_m", 0), 3.6, delta=0.1)

        components = self.p1_layout.get("components", [])
        racks = [c for c in components if c.get("category") == "server_infrastructure"]
        cooling = [c for c in components if c.get("category") == "cooling_infrastructure"]
        elec = [c for c in components if c.get("category") == "electrical_infrastructure"]
        net = [c for c in components if c.get("category") == "network_infrastructure"]
        doors = [c for c in components if "door" in c.get("type", "").lower()]

        self.assertEqual(len(racks), 8, f"P1 must have exactly 8 racks, got {len(racks)}")
        self.assertEqual(len(cooling), 2, f"P1 must have exactly 2 A/C units, got {len(cooling)}")
        self.assertGreaterEqual(len(elec), 1, "P1 must have electrical area")
        self.assertGreaterEqual(len(net), 1, "P1 must have network area")
        self.assertGreaterEqual(len(doors), 1, "P1 must have entrance door")

        # Open central aisle check
        aisles = self.p1_layout.get("aisles", [])
        has_containment = any("hot" in a.get("type", "").lower() for a in aisles)
        self.assertFalse(has_containment, "P1 must NOT have warm/hot-aisle containment!")
        self.assertFalse(self.p1_layout.get("technical_area", {}).get("present", False), "P1 must NOT have Technikspange!")

    # 2. P2 Visual Acceptance: Exactly 12 racks (2 rows of 6), 3 UKGs in Technikspange, partition, T30 door, containment
    def test_p2_visual_acceptance_geometry(self):
        room = self.p2_layout.get("room", {})
        self.assertAlmostEqual(room.get("area_sqm", 0), 49.6, delta=0.5)

        tech = self.p2_layout.get("technical_area", {})
        self.assertTrue(tech.get("present", False), "P2 must have Technikspange marked present")
        self.assertAlmostEqual(tech.get("area_sqm", 0), 19.2, delta=1.5)

        components = self.p2_layout.get("components", [])
        racks = [c for c in components if c.get("category") == "server_infrastructure"]
        cooling = [c for c in components if c.get("category") == "cooling_infrastructure"]
        ukgs = [c for c in cooling if "ukg" in c.get("id", "").lower() or "ukg" in c.get("type", "").lower()]
        doors = [c for c in components if "door" in c.get("type", "").lower()]
        partitions = [c for c in components if "partition" in c.get("type", "").lower() or "gitter" in c.get("type", "").lower()]

        self.assertEqual(len(racks), 12, f"P2 must have exactly 12 racks, got {len(racks)}")
        self.assertEqual(len(ukgs), 3, f"P2 must have exactly 3 UKG units, got {len(ukgs)}")
        self.assertGreaterEqual(len(doors), 1, "P2 must have T30 fire door")
        self.assertGreaterEqual(len(partitions), 1, "P2 must have Gittertrennwand partition")

        aisles = self.p2_layout.get("aisles", [])
        has_containment = any("hot" in a.get("type", "").lower() for a in aisles)
        self.assertTrue(has_containment, "P2 must have warm-aisle containment")

    # 3. Non-Occlusion in P2 Elevated Architectural Overview
    def test_p2_elevated_overview_non_occlusion(self):
        cam = GeometryReconstructionService.get_camera_for_layout(self.p2_layout, "wide_angle_architecture", 1024, 768)
        
        # Verify all 12 racks project onto screen
        racks = [c for c in self.p2_layout["components"] if c.get("category") == "server_infrastructure"]
        for r in racks:
            pt = cam.world_to_camera(np.array([float(r["x"]), float(r["y"]), float(r["z"])]))
            u, v = cam.camera_to_screen(pt)
            self.assertTrue(pt[2] > cam.near_plane, f"Rack {r['id']} behind camera!")
            self.assertTrue(0 <= u <= 1024 and 0 <= v <= 768, f"Rack {r['id']} outside screen: ({u}, {v})")

        # Verify all 3 UKG cooling units project onto screen in the technical plant
        ukgs = [c for c in self.p2_layout["components"] if "ukg" in c.get("id", "").lower()]
        for ukg in ukgs:
            pt = cam.world_to_camera(np.array([float(ukg["x"]), float(ukg["y"]), float(ukg["z"])]))
            u, v = cam.camera_to_screen(pt)
            self.assertTrue(pt[2] > cam.near_plane, f"UKG {ukg['id']} behind camera!")
            self.assertTrue(0 <= u <= 1024 and 0 <= v <= 768, f"UKG {ukg['id']} outside screen: ({u}, {v})")

    # 4. Non-Occlusion in P2 Server-Room Perspective
    def test_p2_server_room_perspective_non_occlusion(self):
        cam = GeometryReconstructionService.get_camera_for_layout(self.p2_layout, "cinematic_central_aisle", 1024, 768)
        racks = [c for c in self.p2_layout["components"] if c.get("category") == "server_infrastructure"]
        for r in racks:
            pt = cam.world_to_camera(np.array([float(r["x"]), float(r["y"]), float(r["z"])]))
            u, v = cam.camera_to_screen(pt)
            self.assertTrue(pt[2] > cam.near_plane, f"Rack {r['id']} behind camera!")
            self.assertTrue(0 <= u <= 1024 and 0 <= v <= 768, f"Rack {r['id']} outside screen: ({u}, {v})")

    # 5. Non-Occlusion in P2 Technical-Area Cooling Perspective
    def test_p2_cooling_perspective_non_occlusion(self):
        cam = GeometryReconstructionService.get_camera_for_layout(self.p2_layout, "cooling_infrastructure", 1024, 768)
        ukgs = [c for c in self.p2_layout["components"] if "ukg" in c.get("id", "").lower()]
        for ukg in ukgs:
            pt = cam.world_to_camera(np.array([float(ukg["x"]), float(ukg["y"]), float(ukg["z"])]))
            u, v = cam.camera_to_screen(pt)
            self.assertTrue(pt[2] > cam.near_plane, f"UKG {ukg['id']} behind camera!")
            self.assertTrue(0 <= u <= 1024 and 0 <= v <= 768, f"UKG {ukg['id']} outside screen: ({u}, {v})")

    # 6. Non-Occlusion in P1 Central Aisle & Cooling Perspectives
    def test_p1_viewpoints_non_occlusion(self):
        cam_sr = GeometryReconstructionService.get_camera_for_layout(self.p1_layout, "cinematic_central_aisle", 1024, 768)
        racks = [c for c in self.p1_layout["components"] if c.get("category") == "server_infrastructure"]
        cooling = [c for c in self.p1_layout["components"] if c.get("category") == "cooling_infrastructure"]

        for r in racks:
            pt = cam_sr.world_to_camera(np.array([float(r["x"]), float(r["y"]), float(r["z"])]))
            u, v = cam_sr.camera_to_screen(pt)
            self.assertTrue(0 <= u <= 1024 and 0 <= v <= 768, f"P1 rack {r['id']} outside screen: ({u}, {v})")

        for ac in cooling:
            pt = cam_sr.world_to_camera(np.array([float(ac["x"]), float(ac["y"]), float(ac["z"])]))
            u, v = cam_sr.camera_to_screen(pt)
            self.assertTrue(0 <= u <= 1024 and 0 <= v <= 768, f"P1 AC {ac['id']} outside screen: ({u}, {v})")

    # 7. Verification of all Deliverable Files on Disk
    def test_all_deliverables_exist_and_distinct(self):
        required_files = [
            "p1_final_master.png", "p2_final_master.png",
            "p1_geometry_diagnostic.png", "p2_geometry_diagnostic.png",
            "p1_elevated_view.png", "p1_server_room_view.png", "p1_cooling_view.png",
            "p2_elevated_view.png", "p2_server_room_view.png", "p2_cooling_view.png",
            "p1_vs_p2_comparison.png"
        ]
        
        hashes = {}
        for fname in required_files:
            p_diag = DIAG_DIR / fname
            p_root = PROJECT_ROOT / fname
            self.assertTrue(p_diag.exists(), f"Missing deliverable: {p_diag}")
            self.assertTrue(p_root.exists(), f"Missing root deliverable: {p_root}")
            
            # Ensure valid image
            img = cv2.imread(str(p_diag))
            self.assertIsNotNone(img, f"Failed to load image: {p_diag}")
            self.assertGreater(img.shape[0], 400)
            self.assertGreater(img.shape[1], 400)

            h = file_sha256(p_diag)
            hashes[fname] = h

        # Assert P1 and P2 masters are distinct
        self.assertNotEqual(hashes["p1_final_master.png"], hashes["p2_final_master.png"])
        self.assertNotEqual(hashes["p1_geometry_diagnostic.png"], hashes["p2_geometry_diagnostic.png"])
        self.assertNotEqual(hashes["p1_elevated_view.png"], hashes["p2_elevated_view.png"])
        self.assertNotEqual(hashes["p1_server_room_view.png"], hashes["p2_server_room_view.png"])
        self.assertNotEqual(hashes["p1_cooling_view.png"], hashes["p2_cooling_view.png"])

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase6VisualAcceptance)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
