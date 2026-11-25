import sys
sys.path.insert(0, 'backend')
sys.path.insert(0, '.')
import json
from pathlib import Path
from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera

p2_layout = json.loads(Path('outputs/diagnostics/p2_extracted_layout.json').read_text())
cam = PinholeCamera(
    position=(-0.8, 4.4, 5.2),
    target=(1.8, 1.0, -0.4),
    fov_degrees=82.0,
    width=1024,
    height=768
)

print("Testing P2 object projections:")
all_on_screen = True
for c in p2_layout['components']:
    x, y, z = c['x'], c['y'], c['z']
    p_cam = cam.world_to_camera([x, y, z])
    if p_cam[2] > cam.near_plane:
        u, v = cam.camera_to_screen(p_cam)
        in_screen = (0 <= u <= 1024) and (0 <= v <= 768)
        if not in_screen:
            all_on_screen = False
        print(f"{c['id']:15} at ({x:5.2f}, {y:5.2f}, {z:5.2f}) -> screen ({u:4d}, {v:4d}) on_screen={in_screen}")
    else:
        all_on_screen = False
        print(f"{c['id']:15} BEHIND CAMERA!")

print(f"All components on screen: {all_on_screen}")
