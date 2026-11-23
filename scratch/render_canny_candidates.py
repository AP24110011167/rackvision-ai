import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path("backend").resolve()))
sys.path.insert(0, str(Path(".").resolve()))

from app.services.design_generation.geometry_reconstruction_service import (
    PinholeCamera, GeometryReconstructionService
)
from PIL import Image
import numpy as np

with open("outputs/verified_p2_layout.json", "r") as f:
    layout = json.load(f)

# Test rendering Canny map with custom cameras
candidates = {
    "elevated_three_quarter_1": {
        "pos": (-4.8, 3.2, 4.2),
        "target": (1.2, 1.1, -0.4),
        "fov": 78.0
    },
    "elevated_three_quarter_2": {
        "pos": (-4.5, 3.0, 4.0),
        "target": (1.5, 1.0, -0.3),
        "fov": 80.0
    },
    "elevated_three_quarter_3": {
        "pos": (-5.0, 3.4, 3.8),
        "target": (1.2, 1.0, -0.2),
        "fov": 76.0
    }
}

for name, cfg in candidates.items():
    # Temporarily monkeypatch camera
    cam = PinholeCamera(
        position=cfg["pos"],
        target=cfg["target"],
        fov_degrees=cfg["fov"],
        width=768,
        height=768
    )
    
    # Render canny with this camera
    orig_get_cam = GeometryReconstructionService.get_camera_for_layout
    GeometryReconstructionService.get_camera_for_layout = staticmethod(lambda layout=None, camera_viewpoint="cinematic_central_aisle", width=768, height=768: cam)
    
    canny_img = GeometryReconstructionService.generate_canny_conditioning_image(
        layout=layout,
        width=768,
        height=768,
        camera_viewpoint="elevated_three_quarter"
    )
    
    out_path = f"scratch/test_canny_{name}.png"
    canny_img.save(out_path)
    
    arr = np.array(canny_img)
    print(f"{name}: saved to {out_path}, non-zero pixels={np.count_nonzero(arr)}, std={np.std(arr):.2f}")
    
    GeometryReconstructionService.get_camera_for_layout = orig_get_cam
