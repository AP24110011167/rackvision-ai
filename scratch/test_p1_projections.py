import sys
sys.path.insert(0, 'backend')
sys.path.insert(0, '.')
import json
from pathlib import Path
from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera

p1_layout = json.loads(Path('outputs/diagnostics/p1_extracted_layout.json').read_text())

# P1 Overview camera
cam_p1 = PinholeCamera(
    position=(0.0, 3.2, 3.4),
    target=(0.0, 1.0, -0.6),
    fov_degrees=80.0,
    width=1024,
    height=768
)

print("Testing P1 object projections (Overview):")
all_on_screen = True
for c in p1_layout['components']:
    x, y, z = c['x'], c['y'], c['z']
    p_cam = cam_p1.world_to_camera([x, y, z])
    if p_cam[2] > cam_p1.near_plane:
        u, v = cam_p1.camera_to_screen(p_cam)
        in_screen = (0 <= u <= 1024) and (0 <= v <= 768)
        if not in_screen:
            all_on_screen = False
        print(f"{c['id']:15} at ({x:5.2f}, {y:5.2f}, {z:5.2f}) -> screen ({u:4d}, {v:4d}) on_screen={in_screen}")
    else:
        all_on_screen = False
        print(f"{c['id']:15} BEHIND CAMERA!")

print(f"All components on screen: {all_on_screen}")
