import json
import numpy as np
from pathlib import Path
import sys
sys.path.insert(0, str(Path("backend").resolve()))
sys.path.insert(0, str(Path(".").resolve()))

from app.services.design_generation.geometry_reconstruction_service import (
    PinholeCamera, GeometryReconstructionService
)

with open("outputs/verified_p2_layout.json", "r") as f:
    layout = json.load(f)

# Candidate 2: (-4.5, 3.0, 4.0) -> target (1.5, 1.0, -0.3), fov=80.0
cam = PinholeCamera(
    position=(-4.5, 3.0, 4.0),
    target=(1.5, 1.0, -0.3),
    fov_degrees=80.0,
    width=768,
    height=768
)

print("=== SCREEN BOUNDING BOXES FOR CANDIDATE 2 ===")
for comp in layout["components"]:
    cid = comp["id"]
    cx, cy, cz = comp["x"], comp["y"], comp["z"]
    cw, cd, ch = comp["width_m"], comp["depth_m"], comp["height_m"]
    
    pts_3d = [
        (cx - cw/2, cy - ch/2, cz - cd/2),
        (cx + cw/2, cy - ch/2, cz - cd/2),
        (cx + cw/2, cy - ch/2, cz + cd/2),
        (cx - cw/2, cy - ch/2, cz + cd/2),
        (cx - cw/2, cy + ch/2, cz - cd/2),
        (cx + cw/2, cy + ch/2, cz - cd/2),
        (cx + cw/2, cy + ch/2, cz + cd/2),
        (cx - cw/2, cy + ch/2, cz + cd/2),
    ]
    
    proj_pts = []
    for p in pts_3d:
        p_cam = cam.world_to_camera(np.array(p))
        if p_cam[2] > 0.15:
            proj_pts.append(cam.camera_to_screen(p_cam))
            
    if proj_pts:
        xs = [pt[0] for pt in proj_pts]
        ys = [pt[1] for pt in proj_pts]
        min_x, max_x = min(xs), max(xs)
        min_y, max_y = min(ys), max(ys)
        area = (max_x - min_x) * (max_y - min_y)
        print(f"{cid:>18}: X=[{min_x:3d}, {max_x:3d}], Y=[{min_y:3d}, {max_y:3d}], BoxArea={area:5d} px^2")
    else:
        print(f"{cid:>18}: NOT VISIBLE")
