import json
import numpy as np
import cv2
from PIL import Image

import sys
from pathlib import Path
sys.path.insert(0, str(Path("backend").resolve()))
sys.path.insert(0, str(Path(".").resolve()))

from app.services.design_generation.geometry_reconstruction_service import (
    PinholeCamera, GeometryReconstructionService
)

with open("outputs/verified_p2_layout.json", "r") as f:
    layout = json.load(f)

# Let's test camera candidates
candidates = {
    "current_cinematic": {
        "pos": (-4.0, 1.55, 0.0),
        "target": (3.6, 1.35, 0.0),
        "fov": 78.0
    },
    "elevated_three_quarter_1": {
        # Elevated from front-left corner
        "pos": (-4.8, 3.2, 4.2),
        "target": (1.2, 1.1, -0.4),
        "fov": 78.0
    },
    "elevated_three_quarter_2": {
        # Slightly wider angle, optimized to see all 3 UKG units & 12 racks
        "pos": (-4.5, 3.0, 4.0),
        "target": (1.5, 1.0, -0.3),
        "fov": 80.0
    },
    "elevated_three_quarter_3": {
        # Balanced high-angle architectural establishing view
        "pos": (-5.0, 3.4, 3.8),
        "target": (1.2, 1.0, -0.2),
        "fov": 76.0
    }
}

for name, cfg in candidates.items():
    cam = PinholeCamera(
        position=cfg["pos"],
        target=cfg["target"],
        fov_degrees=cfg["fov"],
        width=768,
        height=768
    )
    
    # Check screen projection of all 12 racks and 3 UKGs
    projections = {}
    for comp in layout["components"]:
        cid = comp["id"]
        cx, cy, cz = comp["x"], comp["y"], comp["z"]
        p_cam = cam.world_to_camera(np.array([cx, cy, cz]))
        if p_cam[2] > 0.15: # in front of camera
            screen_pt = cam.camera_to_screen(p_cam)
            in_screen = (0 <= screen_pt[0] < 768) and (0 <= screen_pt[1] < 768)
            projections[cid] = (screen_pt, in_screen, p_cam[2])
        else:
            projections[cid] = (None, False, p_cam[2])
            
    racks_on_screen = sum(1 for cid, (pt, on, z) in projections.items() if "rack" in cid and on)
    ukgs_on_screen = sum(1 for cid, (pt, on, z) in projections.items() if "ukg" in cid and on)
    door_on_screen = any(on for cid, (pt, on, z) in projections.items() if "door" in cid)
    
    print(f"=== Candidate: {name} ===")
    print(f"  Racks on screen: {racks_on_screen} / 12")
    print(f"  UKGs on screen:  {ukgs_on_screen} / 3")
    print(f"  Door on screen:  {door_on_screen}")
    for ukg_id in ["ukg_01", "ukg_02", "ukg_03"]:
        pt, on, z = projections.get(ukg_id, (None, False, 0))
        print(f"    {ukg_id}: screen={pt}, visible={on}, dist_z={z:.2f}m")
