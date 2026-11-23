import json
import numpy as np
from pathlib import Path

# Load verified P2 layout
p2_path = Path("outputs/verified_p2_layout.json")
with open(p2_path, "r", encoding="utf-8") as f:
    layout = json.load(f)

from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera

components = layout["components"]
racks = [c for c in components if c.get("category") == "server_infrastructure"]
cooling_units = [c for c in components if c.get("category") == "cooling_infrastructure"]

# View A: Elevated Three-Quarter Overview (captures whole room, 12 racks, containment, partition, 3 UKGs)
cam_a = PinholeCamera(
    position=(-4.5, 3.2, 4.2),
    target=(1.5, 1.0, -0.3),
    fov_degrees=82.0,
    width=768,
    height=768
)

# View B: Server-Room Architectural Perspective (Angled view of dual rows & containment without generic corridor symmetry)
cam_b = PinholeCamera(
    position=(-3.8, 1.8, 2.4),
    target=(2.2, 1.2, -0.5),
    fov_degrees=76.0,
    width=768,
    height=768
)

# View C: Technical-Area Perspective (Focused on the 3 UKG units along X=4.8m + partition + T30 door)
cam_c = PinholeCamera(
    position=(2.2, 1.8, 3.4),
    target=(4.8, 1.3, -0.4),
    fov_degrees=74.0,
    width=768,
    height=768
)

def evaluate_view(name, cam):
    print(f"\n--- Evaluating {name} ---")
    visible_racks = 0
    visible_cooling = 0
    
    for r in racks:
        rx, ry, rz = r["x"], r.get("y", 1.1), r["z"]
        rw, rd, rh = r["width_m"], r["depth_m"], r["height_m"]
        edges = GeometryReconstructionService._get_box_edges(rx, ry, rz, rw, rd, rh)
        proj_count = 0
        for p1, p2 in edges:
            seg = cam.project_segment(p1, p2)
            if seg is not None:
                (u1, v1), (u2, v2) = seg
                if (0 <= u1 <= 768 and 0 <= v1 <= 768) or (0 <= u2 <= 768 and 0 <= v2 <= 768):
                    proj_count += 1
        if proj_count >= 4:
            visible_racks += 1
            
    for u in cooling_units:
        ux, uy, uz = u["x"], u.get("y", 1.1), u["z"]
        uw, ud, uh = u["width_m"], u["depth_m"], u["height_m"]
        edges = GeometryReconstructionService._get_box_edges(ux, uy, uz, uw, ud, uh)
        proj_count = 0
        for p1, p2 in edges:
            seg = cam.project_segment(p1, p2)
            if seg is not None:
                (u1, v1), (u2, v2) = seg
                if (0 <= u1 <= 768 and 0 <= v1 <= 768) or (0 <= u2 <= 768 and 0 <= v2 <= 768):
                    proj_count += 1
        if proj_count >= 4:
            visible_cooling += 1

    # Check partition & door at X=3.6
    door_seg = cam.project_segment((3.6, 0.0, 0.0), (3.6, 2.1, 0.0))
    door_visible = door_seg is not None
    
    print(f"  Visible Racks: {visible_racks} / 12")
    print(f"  Visible Cooling Units: {visible_cooling} / 3")
    print(f"  T30 Door Line Visible: {door_visible} (coords: {door_seg})")

evaluate_view("View A: Elevated 3/4 Overview", cam_a)
evaluate_view("View B: Server-Room Perspective", cam_b)
evaluate_view("View C: Technical-Area Perspective", cam_c)
