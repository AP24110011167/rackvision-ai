import sys
import json
from pathlib import Path
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera

DIAG_DIR = PROJECT_ROOT / "outputs" / "diagnostics"
with open(DIAG_DIR / "p1_extracted_layout.json", "r") as f:
    p1_layout = json.load(f)
with open(DIAG_DIR / "p2_extracted_layout.json", "r") as f:
    p2_layout = json.load(f)

# P2 Server Room camera test
cam_p2_sr = PinholeCamera(
    position=(-4.0, 2.3, 2.5),
    target=(1.5, 1.1, -0.3),
    up=(0.0, 1.0, 0.0),
    fov_degrees=82.0,
    width=1024,
    height=768
)
print("P2 Server Room camera:")
for c in p2_layout["components"]:
    if c.get("category") == "server_infrastructure":
        cx, cy, cz = float(c["x"]), float(c["y"]), float(c["z"])
        pt = cam_p2_sr.world_to_camera(np.array([cx, cy, cz]))
        u, v = cam_p2_sr.camera_to_screen(pt)
        print(f"  {c['id']}: screen=({u}, {v}) [on_screen={0<=u<=1024 and 0<=v<=768}]")

# P1 Cooling camera test
cam_p1_cool = PinholeCamera(
    position=(0.0, 1.8, 2.2),
    target=(0.0, 1.6, -1.7),
    up=(0.0, 1.0, 0.0),
    fov_degrees=76.0,
    width=1024,
    height=768
)
print("\nP1 Cooling camera:")
for c in p1_layout["components"]:
    if c.get("category") in ["server_infrastructure", "cooling_infrastructure"]:
        cx, cy, cz = float(c["x"]), float(c["y"]), float(c["z"])
        pt = cam_p1_cool.world_to_camera(np.array([cx, cy, cz]))
        u, v = cam_p1_cool.camera_to_screen(pt)
        print(f"  {c['id']}: screen=({u}, {v}) [on_screen={0<=u<=1024 and 0<=v<=768}]")
