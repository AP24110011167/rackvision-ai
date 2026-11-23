import sys
import numpy as np
import cv2
from PIL import Image, ImageFilter
from pathlib import Path
import json

sys.path.insert(0, ".")
sys.path.insert(0, "backend")

from app.services.design_generation.geometry_reconstruction_service import PinholeCamera
from scratch.photoreal_scene_engine import PhotorealisticSceneEngine

with open("outputs/verified_p2_layout.json", "r", encoding="utf-8") as f:
    layout = json.load(f)

cams = {
    "view_a": {
        "cam": PinholeCamera(position=(-4.5, 3.2, 4.2), target=(1.5, 1.0, -0.3), fov_degrees=82.0, width=768, height=768),
        "raw": "outputs/p2_view_a_elevated_overview_raw.png"
    },
    "view_b": {
        "cam": PinholeCamera(position=(-3.8, 1.8, 2.4), target=(2.2, 1.2, -0.5), fov_degrees=76.0, width=768, height=768),
        "raw": "outputs/p2_view_b_server_room_raw.png"
    },
    "view_c": {
        "cam": PinholeCamera(position=(2.2, 1.8, 3.4), target=(4.8, 1.3, -0.4), fov_degrees=74.0, width=768, height=768),
        "raw": "outputs/p2_view_c_technical_area_raw.png"
    }
}

for v_id, v_data in cams.items():
    geom_img = PhotorealisticSceneEngine.render_photoreal(layout, v_data["cam"], v_id)
    geom_arr = np.array(geom_img, dtype=np.float32)

    raw_path = v_data["raw"]
    raw_img = Image.open(raw_path).resize((768, 768), Image.Resampling.LANCZOS)
    raw_arr = np.array(raw_img, dtype=np.float32)

    # Geometry edge mask
    geom_gray = cv2.cvtColor(np.uint8(geom_arr), cv2.COLOR_RGB2GRAY)
    geom_edges = cv2.Canny(geom_gray, 50, 150)
    edge_mask = cv2.dilate(geom_edges, np.ones((3, 3), np.uint8), iterations=1) / 255.0
    edge_mask = edge_mask[:, :, np.newaxis]

    # SDXL multi-scale
    sdxl_lighting = cv2.GaussianBlur(raw_arr, (25, 25), 0)
    sdxl_micro = raw_arr - cv2.GaussianBlur(raw_arr, (5, 5), 0)

    # Fusion
    surface_fused = geom_arr * 0.72 + sdxl_lighting * 0.28 + sdxl_micro * 0.35
    enhanced = surface_fused * (1.0 - edge_mask * 0.88) + geom_arr * (edge_mask * 0.88)

    # Filmic S-curve tone mapping
    arr_norm = np.clip(enhanced, 0, 255) / 255.0
    gamma = 1.08
    filmic = (arr_norm ** gamma) / ((arr_norm ** gamma) + ((1.0 - arr_norm) ** gamma) + 1e-6)
    enhanced_final = np.uint8(np.clip(filmic * 255.0, 0, 255))

    diff = np.abs(geom_arr - enhanced_final.astype(np.float32))
    print(f"{v_id}: MAE={diff.mean():.2f}, max_diff={diff.max():.2f}, std_diff={diff.std():.2f}, mean_val={enhanced_final.mean():.1f}")
