"""
Test and verify all three viewpoints for P1 and P2:
- elevated_overview (wide_angle_architecture)
- server_room_view (cinematic_central_aisle)
- cooling_view (cooling_infrastructure)
"""

import sys
import json
from pathlib import Path
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService
from app.services.design_generation.hybrid_geometry_renderer import HybridGeometryRenderer

DIAG_DIR = PROJECT_ROOT / "outputs" / "diagnostics"
with open(DIAG_DIR / "p1_extracted_layout.json", "r") as f:
    p1_layout = json.load(f)
with open(DIAG_DIR / "p2_extracted_layout.json", "r") as f:
    p2_layout = json.load(f)

viewpoints = [
    ("elevated_overview", "wide_angle_architecture"),
    ("server_room_view", "cinematic_central_aisle"),
    ("cooling_view", "cooling_infrastructure")
]

print("=== CHECKING P1 VIEWPOINTS ===")
for v_name, v_code in viewpoints:
    cam = GeometryReconstructionService.get_camera_for_layout(p1_layout, v_code, 1024, 768)
    print(f"\nP1 - {v_name} ({v_code}):")
    print(f"  Cam Pos: {cam.cam_pos}, Target: {cam.target}, FOV: {cam.fov_degrees}")
    
    # Check projection of all 8 racks and 2 A/Cs
    for c in p1_layout["components"]:
        cx, cy, cz = float(c["x"]), float(c["y"]), float(c["z"])
        pt_cam = cam.world_to_camera(np.array([cx, cy, cz]))
        u, v = cam.camera_to_screen(pt_cam)
        in_front = pt_cam[2] > cam.near_plane
        on_screen = (0 <= u <= 1024) and (0 <= v <= 768)
        c_id = c["id"]
        c_type = c.get("category", "")
        if c_type in ["server_infrastructure", "cooling_infrastructure"]:
            print(f"    {c_id:<18} (z_cam={pt_cam[2]:.2f}) -> screen=({u}, {v}) [in_front={in_front}, on_screen={on_screen}]")

print("\n=== CHECKING P2 VIEWPOINTS ===")
for v_name, v_code in viewpoints:
    cam = GeometryReconstructionService.get_camera_for_layout(p2_layout, v_code, 1024, 768)
    print(f"\nP2 - {v_name} ({v_code}):")
    print(f"  Cam Pos: {cam.cam_pos}, Target: {cam.target}, FOV: {cam.fov_degrees}")
    
    # Check projection of all 12 racks and 3 UKGs
    for c in p2_layout["components"]:
        cx, cy, cz = float(c["x"]), float(c["y"]), float(c["z"])
        pt_cam = cam.world_to_camera(np.array([cx, cy, cz]))
        u, v = cam.camera_to_screen(pt_cam)
        in_front = pt_cam[2] > cam.near_plane
        on_screen = (0 <= u <= 1024) and (0 <= v <= 768)
        c_id = c["id"]
        c_type = c.get("category", "")
        if c_type in ["server_infrastructure", "cooling_infrastructure"]:
            print(f"    {c_id:<18} (z_cam={pt_cam[2]:.2f}) -> screen=({u}, {v}) [in_front={in_front}, on_screen={on_screen}]")
