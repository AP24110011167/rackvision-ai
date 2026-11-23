import sys
from pathlib import Path
from PIL import Image
import numpy as np
import json

sys.path.insert(0, ".")
sys.path.insert(0, "backend")

from app.services.design_generation.geometry_reconstruction_service import PinholeCamera
from scratch.photoreal_scene_engine import PhotorealisticSceneEngine

with open("outputs/verified_p2_layout.json", "r", encoding="utf-8") as f:
    layout = json.load(f)

cam_a = PinholeCamera(position=(-4.5, 3.2, 4.2), target=(1.5, 1.0, -0.3), fov_degrees=82.0, width=768, height=768)
cam_b = PinholeCamera(position=(-3.8, 1.8, 2.4), target=(2.2, 1.2, -0.5), fov_degrees=76.0, width=768, height=768)
cam_c = PinholeCamera(position=(2.2, 1.8, 3.4), target=(4.8, 1.3, -0.4), fov_degrees=74.0, width=768, height=768)

img_a = PhotorealisticSceneEngine.render_photoreal(layout, cam_a, "view_a")
img_a.save("scratch/test_phase42_view_a.png")

img_b = PhotorealisticSceneEngine.render_photoreal(layout, cam_b, "view_b")
img_b.save("scratch/test_phase42_view_b.png")

img_c = PhotorealisticSceneEngine.render_photoreal(layout, cam_c, "view_c")
img_c.save("scratch/test_phase42_view_c.png")

for name, img in [("view_a", img_a), ("view_b", img_b), ("view_c", img_c)]:
    arr = np.array(img)
    print(f"{name}: shape={arr.shape}, mean={arr.mean():.2f}, std={arr.std():.2f}")
