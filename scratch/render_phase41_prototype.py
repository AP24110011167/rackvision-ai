"""
Phase 4.1 Asset Refinement Prototype: High-fidelity PBR server racks, UKG cooling units, and high-gloss floor reflections.
"""
import sys
import math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

sys.path.insert(0, ".")
sys.path.insert(0, "backend")

import json
with open("outputs/verified_p2_layout.json", "r", encoding="utf-8") as f:
    layout = json.load(f)

from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera

class Phase41PhotorealisticRenderer:

    @staticmethod
    def render(
        layout: dict,
        camera: PinholeCamera,
        view_id: str,
        width: int = 768,
        height: int = 768,
        seed: int = 42
    ) -> Image.Image:
        np.random.seed(seed)
        
        # 1. Base cleanroom atmosphere
        canvas = np.zeros((height, width, 3), dtype=np.float32)
        for y in range(height):
            t = y / float(height)
            if t < 0.32: # Upper ceiling
                canvas[y, :] = [238 - t * 30, 242 - t * 25, 248 - t * 20]
            elif t < 0.58: # Horizon / Wall
                canvas[y, :] = [32 + (t - 0.32) * 25, 36 + (t - 0.32) * 20, 46 + (t - 0.32) * 15]
            else: # Polished graphite floor
                canvas[y, :] = [20 + (t - 0.58) * 14, 22 + (t - 0.58) * 16, 26 + (t - 0.58) * 20]

        # Subtle cleanroom sensor grain
        canvas += np.random.normal(0, 1.2, canvas.shape).astype(np.float32)
        canvas = np.clip(canvas, 0, 255)

        components = layout.get("components", [])
        racks = [c for c in components if c.get("category") == "server_infrastructure"]
        cooling_units = [c for c in components if c.get("category") == "cooling_infrastructure"]

        room = layout.get("room", {})
        rw = float(room.get("width_m", 8.27))
        rl = float(room.get("length_m", 6.0))
        rh = float(room.get("height_m", 3.4))
        half_rw, half_rl = rw * 0.5, rl * 0.5

        def project_poly(poly_3d):
            cam_pts = [camera.world_to_camera(np.array(p, dtype=np.float64)) for p in poly_3d]
            if any(p[2] < camera.near_plane for p in cam_pts):
                return None, 0.0
            screen_pts = [camera.camera_to_screen(p) for p in cam_pts]
            avg_z = np.mean([p[2] for p in cam_pts])
            return screen_pts, avg_z

        draw_primitives = []

        # =========================================================================
        # 1. RAISED ACCESS FLOOR & SPECULAR MIRROR REFLECTIONS
        # =========================================================================
        floor_poly = [(-half_rw, 0.0, -half_rl), (half_rw, 0.0, -half_rl), (half_rw, 0.0, half_rl), (-half_rw, 0.0, half_rl)]
        sf, zf = project_poly(floor_poly)
        if sf:
            def draw_floor(img_arr):
                pts = np.array(sf, np.int32).reshape((-1, 1, 2))
                # Base polished graphite access floor
                cv2.fillPoly(img_arr, [pts], (22, 24, 30))

                # Mirrored Specular Reflections of Server Racks on Floor:
                # Polished epoxy/vinyl reflects the overhead white cabinets and blue LEDs downwards!
                for r in racks:
                    rx, ry, rz = float(r.get("x", 0.0)), float(r.get("y", 1.1)), float(r.get("z", 0.0))
                    w, d, h = float(r.get("width_m", 0.8)), float(r.get("depth_m", 1.2)), float(r.get("height_m", 2.2))
                    # Mirrored bottom base reflection (Y < 0)
                    refl_box = [
                        (rx - w*0.48, -0.01, rz - d*0.48), (rx + w*0.48, -0.01, rz - d*0.48),
                        (rx + w*0.48, -0.65, rz + d*0.48), (rx - w*0.48, -0.65, rz + d*0.48)
                    ]
                    s_ref, _ = project_poly(refl_box)
                    if s_ref:
                        p_ref = np.array(s_ref, np.int32).reshape((-1, 1, 2))
                        # Soft specular rack reflection
                        overlay = img_arr.copy()
                        cv2.fillPoly(overlay, [p_ref], (45, 52, 65))
                        cv2.addWeighted(overlay, 0.35, img_arr, 0.65, 0, img_arr)

                    # Blue LED plinth floor reflection
                    z_glow = rz + d*0.5 if rz < 0 else rz - d*0.5
                    glow_box = [
                        (rx - w*0.55, 0.0, z_glow - 0.2), (rx + w*0.55, 0.0, z_glow - 0.2),
                        (rx + w*0.55, 0.0, z_glow + 0.2), (rx - w*0.55, 0.0, z_glow + 0.2)
                    ]
                    sg, _ = project_poly(glow_box)
                    if sg:
                        pg = np.array(sg, np.int32).reshape((-1, 1, 2))
                        overlay = img_arr.copy()
                        cv2.fillPoly(overlay, [pg], (0, 140, 255))
                        cv2.addWeighted(overlay, 0.25, img_arr, 0.75, 0, img_arr)

                # Linear troffer specular reflections on floor (long light streaks)
                for tz in [-1.35, 0.0, 1.35]:
                    seg = camera.project_segment((-3.2, 0.005, tz), (3.2, 0.005, tz))
                    if seg:
                        overlay = img_arr.copy()
                        cv2.line(overlay, seg[0], seg[1], (180, 200, 230), 8, cv2.LINE_AA)
                        cv2.addWeighted(overlay, 0.28, img_arr, 0.72, 0, img_arr)

                # Floor tile seams (600mm grid)
                for gx in np.arange(-half_rw, half_rw + 0.1, 0.6):
                    seg = camera.project_segment((gx, 0.0, -half_rl), (gx, 0.0, half_rl))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (34, 38, 46), 1, cv2.LINE_AA)
                for gz in np.arange(-half_rl, half_rl + 0.1, 0.6):
                    seg = camera.project_segment((-half_rw, 0.0, gz), (half_rw, 0.0, gz))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (34, 38, 46), 1, cv2.LINE_AA)

                # Central aisle perforated silver ventilation airflow tiles (Z in [-0.65, +0.65])
                for px in np.arange(-2.8, 2.9, 0.6):
                    p_box = [
                        (px - 0.26, 0.005, -0.58), (px + 0.26, 0.005, -0.58),
                        (px + 0.26, 0.005, 0.58), (px - 0.26, 0.005, 0.58)
                    ]
                    sp, _ = project_poly(p_box)
                    if sp:
                        pts_p = np.array(sp, np.int32).reshape((-1, 1, 2))
                        # Die-cast aluminum perforated tile body
                        cv2.fillPoly(img_arr, [pts_p], (85, 92, 104))
                        cv2.polylines(img_arr, [pts_p], True, (135, 142, 155), 1, cv2.LINE_AA)
                        # Airflow perforation slot matrix
                        for hx in np.linspace(px - 0.20, px + 0.20, 4):
                            seg_h = camera.project_segment((hx, 0.006, -0.45), (hx, 0.006, 0.45))
                            if seg_h:
                                cv2.line(img_arr, seg_h[0], seg_h[1], (35, 40, 48), 1, cv2.LINE_AA)

            draw_primitives.append((100.0, draw_floor))

        # =========================================================================
        # 2. MODULAR CEILING, CABLE TRAYS & LIGHTING
        # =========================================================================
        ceil_poly = [(-half_rw, rh, -half_rl), (half_rw, rh, -half_rl), (half_rw, rh, half_rl), (-half_rw, rh, half_rl)]
        sc, zc = project_poly(ceil_poly)
        if sc:
            def draw_ceiling(img_arr):
                pts = np.array(sc, np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(img_arr, [pts], (225, 228, 234))
                # Acoustic ceiling tile grid (600x1200mm)
                for cx in np.arange(-half_rw, half_rw + 0.1, 1.2):
                    seg = camera.project_segment((cx, rh, -half_rl), (cx, rh, half_rl))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (190, 195, 202), 1, cv2.LINE_AA)
                for cz in np.arange(-half_rl, half_rl + 0.1, 0.6):
                    seg = camera.project_segment((-half_rw, rh, cz), (half_rw, rh, cz))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (190, 195, 202), 1, cv2.LINE_AA)

                # Linear daylight LED troffers (5000K, high-output flush troffers)
                for tz in [-1.35, 0.0, 1.35]:
                    seg = camera.project_segment((-3.2, rh - 0.02, tz), (3.2, rh - 0.02, tz))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (255, 255, 252), 5, cv2.LINE_AA)
                        # Lens halo
                        overlay = img_arr.copy()
                        cv2.line(overlay, seg[0], seg[1], (255, 255, 255), 14, cv2.LINE_AA)
                        cv2.addWeighted(overlay, 0.35, img_arr, 0.65, 0, img_arr)

                # Suspended wire mesh cable ladder trays running overhead above racks (Y = 2.9m)
                for rz in [-1.35, 1.35]:
                    # Tray rails
                    tray_y = 2.85
                    s_tray1 = camera.project_segment((-3.2, tray_y, rz - 0.2), (3.2, tray_y, rz - 0.2))
                    s_tray2 = camera.project_segment((-3.2, tray_y, rz + 0.2), (3.2, tray_y, rz + 0.2))
                    if s_tray1 and s_tray2:
                        cv2.line(img_arr, s_tray1[0], s_tray1[1], (130, 138, 148), 2, cv2.LINE_AA)
                        cv2.line(img_arr, s_tray2[0], s_tray2[1], (130, 138, 148), 2, cv2.LINE_AA)
                        # Cable bundles inside tray (Blue Cat6A data + Aqua OM4 fiber)
                        s_cb1 = camera.project_segment((-3.2, tray_y + 0.03, rz - 0.08), (3.2, tray_y + 0.03, rz - 0.08))
                        s_cb2 = camera.project_segment((-3.2, tray_y + 0.03, rz + 0.08), (3.2, tray_y + 0.03, rz + 0.08))
                        if s_cb1:
                            cv2.line(img_arr, s_cb1[0], s_cb1[1], (0, 100, 220), 2, cv2.LINE_AA)
                        if s_cb2:
                            cv2.line(img_arr, s_cb2[0], s_cb2[1], (0, 200, 210), 2, cv2.LINE_AA)

            draw_primitives.append((99.0, draw_ceiling))

        # =========================================================================
        # 3. PARTITION WALL AT X = 3.6m & INTERCONNECTING T30 FIRE DOOR
        # =========================================================================
        part_x = 3.6
        part_poly = [(part_x, 0.0, -half_rl), (part_x, rh, -half_rl), (part_x, rh, half_rl), (part_x, 0.0, half_rl)]
        sp, zp = project_poly(part_poly)
        if sp:
            def draw_partition(img_arr):
                pts = np.array(sp, np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(img_arr, [pts], (192, 198, 206)) # Cleanroom acoustic partition wall
                cv2.polylines(img_arr, [pts], True, (150, 156, 166), 2, cv2.LINE_AA)
                # T30 door frame at Z = 0, width 1.0m, height 2.1m
                door_box = [
                    (part_x - 0.03, 0.0, -0.5), (part_x - 0.03, 2.1, -0.5),
                    (part_x - 0.03, 2.1, 0.5), (part_x - 0.03, 0.0, 0.5)
                ]
                s_door, _ = project_poly(door_box)
                if s_door:
                    pts_d = np.array(s_door, np.int32).reshape((-1, 1, 2))
                    # Heavy steel fire door leaf (#D0D5DC)
                    cv2.fillPoly(img_arr, [pts_d], (215, 220, 226))
                    # Frame bevel
                    cv2.polylines(img_arr, [pts_d], True, (70, 75, 85), 3, cv2.LINE_AA)
                    # Door closer arm at top
                    s_closer = camera.project_segment((part_x - 0.04, 2.05, -0.35), (part_x - 0.04, 2.05, 0.1))
                    if s_closer:
                        cv2.line(img_arr, s_closer[0], s_closer[1], (90, 95, 105), 3, cv2.LINE_AA)
                    # Stainless steel push bar / lever handle
                    s_handle = camera.project_segment((part_x - 0.04, 1.05, -0.42), (part_x - 0.04, 1.05, -0.22))
                    if s_handle:
                        cv2.line(img_arr, s_handle[0], s_handle[1], (230, 235, 240), 3, cv2.LINE_AA)
                    # Wire-reinforced vision glass panel (200x600mm)
                    vp_box = [
                        (part_x - 0.04, 1.25, -0.1), (part_x - 0.04, 1.75, -0.1),
                        (part_x - 0.04, 1.75, 0.1), (part_x - 0.04, 1.25, 0.1)
                    ]
                    svp, _ = project_poly(vp_box)
                    if svp:
                        pts_vp = np.array(svp, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_vp], (40, 60, 80)) # Tinted fire glass
                        cv2.polylines(img_arr, [pts_vp], True, (120, 130, 145), 1, cv2.LINE_AA)
                        # Glass specular glint
                        s_glint = camera.project_segment((part_x - 0.04, 1.35, -0.05), (part_x - 0.04, 1.65, 0.05))
                        if s_glint:
                            cv2.line(img_arr, s_glint[0], s_glint[1], (180, 210, 235), 1, cv2.LINE_AA)

            draw_primitives.append((zp, draw_partition))

        # =========================================================================
        # 4. THREE 15 kW UKG PRECISION DOWNFLOW COOLING UNITS (X = 4.8m)
        # =========================================================================
        for idx, u in enumerate(cooling_units):
            ux, uy, uz = float(u.get("x", 4.8)), float(u.get("y", 1.1)), float(u.get("z", 0.0))
            uw, ud, uh = float(u.get("width_m", 1.2)), float(u.get("depth_m", 0.9)), float(u.get("height_m", 2.2))
            c_cam = camera.world_to_camera(np.array([ux, uy, uz], dtype=np.float64))
            z_unit = c_cam[2]

            def make_draw_ukg(x=ux, y=uy, z=uz, w=uw, d=ud, h=uh, u_idx=idx):
                def draw_ukg(img_arr):
                    x0, x1 = x - w * 0.5, x + w * 0.5
                    y0, y1 = y - h * 0.5, y + h * 0.5
                    z0, z1 = z - d * 0.5, z + d * 0.5

                    # Front face (-X facing technical aisle)
                    front_pts = [(x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1)]
                    sf, _ = project_poly(front_pts)
                    if sf:
                        pts_f = np.array(sf, np.int32).reshape((-1, 1, 2))
                        # Industrial powder-coated dark metallic housing (#2E3440)
                        cv2.fillPoly(img_arr, [pts_f], (46, 52, 62))
                        cv2.polylines(img_arr, [pts_f], True, (88, 96, 108), 2, cv2.LINE_AA)

                        # Maintenance service doors vertical seam
                        s_seam = camera.project_segment((x0, y0 + 0.1, z), (x0, y1 - 0.1, z))
                        if s_seam:
                            cv2.line(img_arr, s_seam[0], s_seam[1], (30, 34, 40), 1, cv2.LINE_AA)

                        # Large high-density air intake louver grille (lower 65% of body)
                        louver_y0 = y0 + 0.25
                        louver_y1 = y0 + 1.45
                        # Dark recessed filter box background behind louvers
                        g_box = [
                            (x0 + 0.01, louver_y0, z0 + 0.08), (x0 + 0.01, louver_y1, z0 + 0.08),
                            (x0 + 0.01, louver_y1, z1 - 0.08), (x0 + 0.01, louver_y0, z1 - 0.08)
                        ]
                        sg, _ = project_poly(g_box)
                        if sg:
                            pg = np.array(sg, np.int32).reshape((-1, 1, 2))
                            cv2.fillPoly(img_arr, [pg], (24, 28, 34)) # Filter cavity

                        # 24 stamped metal horizontal louver blades
                        for ly in np.linspace(louver_y0, louver_y1, 24):
                            seg_l = camera.project_segment((x0, ly, z0 + 0.08), (x0, ly, z1 - 0.08))
                            if seg_l:
                                # Highlight on upper blade edge, shadow underneath
                                cv2.line(img_arr, seg_l[0], seg_l[1], (75, 82, 92), 1, cv2.LINE_AA)

                        # Digital Touchscreen Telemetry Display Panel (y in [1.65, 1.95])
                        disp_box = [
                            (x0 - 0.01, 1.68, z - 0.25), (x0 - 0.01, 1.92, z - 0.25),
                            (x0 - 0.01, 1.92, z + 0.25), (x0 - 0.01, 1.68, z + 0.25)
                        ]
                        sd, _ = project_poly(disp_box)
                        if sd:
                            pd = np.array(sd, np.int32).reshape((-1, 1, 2))
                            cv2.fillPoly(img_arr, [pd], (14, 20, 28)) # Bezel
                            cv2.polylines(img_arr, [pd], True, (120, 130, 145), 1, cv2.LINE_AA)

                        # Illuminated telemetry display text & readout lines
                        s_t1 = camera.project_segment((x0 - 0.012, 1.84, z - 0.18), (x0 - 0.012, 1.84, z + 0.18))
                        s_t2 = camera.project_segment((x0 - 0.012, 1.76, z - 0.18), (x0 - 0.012, 1.76, z + 0.10))
                        if s_t1:
                            cv2.line(img_arr, s_t1[0], s_t1[1], (0, 215, 255), 2, cv2.LINE_AA) # Cyan status bar
                        if s_t2:
                            cv2.line(img_arr, s_t2[0], s_t2[1], (230, 245, 255), 1, cv2.LINE_AA) # Text readout

                        # Operational status indicator LEDs (Green: OK, Blue: Inverter Compressor Active)
                        s_led1 = camera.project_segment((x0 - 0.012, 1.88, z + 0.20), (x0 - 0.012, 1.88, z + 0.22))
                        s_led2 = camera.project_segment((x0 - 0.012, 1.82, z + 0.20), (x0 - 0.012, 1.82, z + 0.22))
                        if s_led1:
                            cv2.line(img_arr, s_led1[0], s_led1[1], (60, 240, 100), 3, cv2.LINE_AA)
                        if s_led2:
                            cv2.line(img_arr, s_led2[0], s_led2[1], (0, 180, 255), 3, cv2.LINE_AA)

                    # Top acoustic exhaust plenum collar & overhead ductwork connection
                    top_pts = [
                        (x0 + 0.08, y1, z0 + 0.08), (x1 - 0.08, y1, z0 + 0.08),
                        (x1 - 0.08, y1, z1 - 0.08), (x0 + 0.08, y1, z1 - 0.08)
                    ]
                    st, _ = project_poly(top_pts)
                    if st:
                        pts_t = np.array(st, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_t], (68, 76, 88))
                        cv2.polylines(img_arr, [pts_t], True, (115, 125, 138), 1, cv2.LINE_AA)

                    # Acoustic plenum duct extending toward ceiling
                    duct_pts = [
                        (x0 + 0.12, y1 + 0.45, z0 + 0.12), (x1 - 0.12, y1 + 0.45, z0 + 0.12),
                        (x1 - 0.12, y1 + 0.45, z1 - 0.12), (x0 + 0.12, y1 + 0.45, z1 - 0.12)
                    ]
                    sd_plenum, _ = project_poly(duct_pts)
                    if sd_plenum:
                        p_duct = np.array(sd_plenum, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [p_duct], (92, 100, 112))
                        cv2.polylines(img_arr, [p_duct], True, (140, 150, 165), 1, cv2.LINE_AA)

                    # Vibration isolation plinth at floor
                    base_pts = [
                        (x0 - 0.02, 0.06, z0 - 0.02), (x1 + 0.02, 0.06, z0 - 0.02),
                        (x1 + 0.02, 0.06, z1 + 0.02), (x0 - 0.02, 0.06, z1 + 0.02)
                    ]
                    s_base, _ = project_poly(base_pts)
                    if s_base:
                        pb = np.array(s_base, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pb], (30, 34, 40)) # Heavy neoprene plinth

                return draw_ukg

            draw_primitives.append((z_unit, make_draw_ukg()))

        # =========================================================================
        # 5. SERVER CABINETS (12 ENTERPRISE 42U RACKS: ROW A AND ROW B)
        # =========================================================================
        for idx, r in enumerate(racks):
            rx, ry, rz = float(r.get("x", 0.0)), float(r.get("y", 1.1)), float(r.get("z", 0.0))
            w, d, h = float(r.get("width_m", 0.8)), float(r.get("depth_m", 1.2)), float(r.get("height_m", 2.2))
            c_cam = camera.world_to_camera(np.array([rx, ry, rz], dtype=np.float64))
            z_rack = c_cam[2]

            def make_draw_rack(x=rx, y=ry, z=rz, w=w, d=d, h=h, r_idx=idx):
                def draw_rack(img_arr):
                    x0, x1 = x - w * 0.5, x + w * 0.5
                    y0, y1 = y - h * 0.5, y + h * 0.5
                    z0, z1 = z - d * 0.5, z + d * 0.5

                    # Row A faces +Z (towards aisle); Row B faces -Z (towards aisle)
                    if z < 0:
                        front_pts = [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
                        back_pts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)]
                        z_aisle = z1
                    else:
                        front_pts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)]
                        back_pts = [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
                        z_aisle = z0

                    top_pts = [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)]
                    side_pts = [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)]

                    # Cabinet Side Panel (Pristine White Powdercoat #F3F5F8)
                    ss, _ = project_poly(side_pts)
                    if ss:
                        pts_s = np.array(ss, np.int32).reshape((-1, 1, 2))
                        # Subtle vertical shading gradient
                        cv2.fillPoly(img_arr, [pts_s], (226, 230, 238))
                        cv2.polylines(img_arr, [pts_s], True, (175, 182, 192), 1, cv2.LINE_AA)
                        # Side panel recessed handling seams
                        s_p1 = camera.project_segment((x1, y0 + 0.3, z - 0.2), (x1, y1 - 0.3, z - 0.2))
                        s_p2 = camera.project_segment((x1, y0 + 0.3, z + 0.2), (x1, y1 - 0.3, z + 0.2))
                        if s_p1:
                            cv2.line(img_arr, s_p1[0], s_p1[1], (195, 202, 212), 1, cv2.LINE_AA)
                        if s_p2:
                            cv2.line(img_arr, s_p2[0], s_p2[1], (195, 202, 212), 1, cv2.LINE_AA)

                    # Cabinet Top Panel
                    st, _ = project_poly(top_pts)
                    if st:
                        pts_t = np.array(st, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_t], (240, 244, 250))
                        cv2.polylines(img_arr, [pts_t], True, (185, 192, 202), 1, cv2.LINE_AA)
                        # Top ventilation roof cowl & cable entry grommet
                        cowl = [
                            (x - w*0.35, y1 + 0.01, z - d*0.35), (x + w*0.35, y1 + 0.01, z - d*0.35),
                            (x + w*0.35, y1 + 0.01, z + d*0.35), (x - w*0.35, y1 + 0.01, z + d*0.35)
                        ]
                        scw, _ = project_poly(cowl)
                        if scw:
                            pcw = np.array(scw, np.int32).reshape((-1, 1, 2))
                            cv2.fillPoly(img_arr, [pcw], (210, 216, 225))
                            cv2.polylines(img_arr, [pcw], True, (160, 168, 178), 1, cv2.LINE_AA)

                    # Cabinet Front Door & Detailed Server Blade Chassis
                    sf, _ = project_poly(front_pts)
                    if sf:
                        pts_f = np.array(sf, np.int32).reshape((-1, 1, 2))
                        # Outer white frame
                        cv2.fillPoly(img_arr, [pts_f], (245, 248, 252))
                        cv2.polylines(img_arr, [pts_f], True, (190, 198, 208), 2, cv2.LINE_AA)

                        # Inset dark server bay (EIA 42U rack interior)
                        iw, ih = w * 0.84, h * 0.90
                        z_bay = z1 + 0.005 if z < 0 else z0 - 0.005
                        bay_pts = [
                            (x - iw*0.5, y - ih*0.5, z_bay), (x + iw*0.5, y - ih*0.5, z_bay),
                            (x + iw*0.5, y + ih*0.5, z_bay), (x - iw*0.5, y + ih*0.5, z_bay)
                        ]
                        sb, _ = project_poly(bay_pts)
                        if sb:
                            pts_b = np.array(sb, np.int32).reshape((-1, 1, 2))
                            cv2.fillPoly(img_arr, [pts_b], (16, 18, 24)) # Dark chassis interior

                            # Vertical EIA-310-D rack rails with square mounting holes
                            s_rail_l = camera.project_segment((x - iw*0.46, y - ih*0.48, z_bay), (x - iw*0.46, y + ih*0.48, z_bay))
                            s_rail_r = camera.project_segment((x + iw*0.46, y - ih*0.48, z_bay), (x + iw*0.46, y + ih*0.48, z_bay))
                            if s_rail_l:
                                cv2.line(img_arr, s_rail_l[0], s_rail_l[1], (70, 78, 90), 2, cv2.LINE_AA)
                            if s_rail_r:
                                cv2.line(img_arr, s_rail_r[0], s_rail_r[1], (70, 78, 90), 2, cv2.LINE_AA)

                            # 42U Server Blade Chassis Divisions:
                            # 16 distinct server blades and disk arrays rendered with high fidelity:
                            chassis_y_vals = np.linspace(y - ih*0.45, y + ih*0.45, 17)
                            for c_i in range(len(chassis_y_vals) - 1):
                                cy_bot = chassis_y_vals[c_i]
                                cy_top = chassis_y_vals[c_i + 1]
                                cy_mid = (cy_bot + cy_top) * 0.5
                                
                                # Server chassis horizontal divider line
                                seg_div = camera.project_segment((x - iw*0.45, cy_bot, z_bay), (x + iw*0.45, cy_bot, z_bay))
                                if seg_div:
                                    cv2.line(img_arr, seg_div[0], seg_div[1], (48, 54, 66), 1, cv2.LINE_AA)

                                # Micro-ventilation slots on server bezel
                                seg_slot = camera.project_segment((x - iw*0.25, cy_mid, z_bay), (x + iw*0.25, cy_mid, z_bay))
                                if seg_slot:
                                    cv2.line(img_arr, seg_slot[0], seg_slot[1], (32, 38, 48), 1, cv2.LINE_AA)

                                # Drive caddy release tabs (for bottom 6 storage units)
                                if c_i < 6:
                                    seg_tab = camera.project_segment((x - iw*0.38, cy_mid, z_bay), (x - iw*0.34, cy_mid, z_bay))
                                    if seg_tab:
                                        cv2.line(img_arr, seg_tab[0], seg_tab[1], (160, 168, 178), 1, cv2.LINE_AA)

                                # Micro-LED Link / Activity Indicators:
                                # Cyan 480nm high-speed optical transceivers
                                led_c1 = camera.project_segment((x - iw*0.40, cy_mid, z_bay), (x - iw*0.37, cy_mid, z_bay))
                                if led_c1:
                                    cv2.line(img_arr, led_c1[0], led_c1[1], (0, 220, 255), 2, cv2.LINE_AA)
                                
                                # Cold-white server management activity light
                                led_w1 = camera.project_segment((x + iw*0.32, cy_mid, z_bay), (x + iw*0.35, cy_mid, z_bay))
                                if led_w1:
                                    cv2.line(img_arr, led_w1[0], led_w1[1], (240, 248, 255), 2, cv2.LINE_AA)

                                # Amber drive activity LED (intermittent)
                                if (r_idx + c_i) % 3 == 0:
                                    led_amb = camera.project_segment((x + iw*0.22, cy_mid, z_bay), (x + iw*0.25, cy_mid, z_bay))
                                    if led_amb:
                                        cv2.line(img_arr, led_amb[0], led_amb[1], (0, 170, 255), 2, cv2.LINE_AA)

                        # Tempered Smoked Glass Door Overlay:
                        # Semi-transparent safety glass with diagonal specular reflection streaks
                        overlay = img_arr.copy()
                        glass_pts = [
                            (x - iw*0.48, y - ih*0.48, z_bay + 0.008), (x + iw*0.48, y - ih*0.48, z_bay + 0.008),
                            (x + iw*0.48, y + ih*0.48, z_bay + 0.008), (x - iw*0.48, y + ih*0.48, z_bay + 0.008)
                        ]
                        s_gl, _ = project_poly(glass_pts)
                        if s_gl:
                            p_gl = np.array(s_gl, np.int32).reshape((-1, 1, 2))
                            # Tinted glass
                            cv2.fillPoly(overlay, [p_gl], (120, 145, 175))
                            cv2.addWeighted(overlay, 0.18, img_arr, 0.82, 0, img_arr)
                            # Specular glint streak reflecting overhead ceiling troffers
                            s_streak = camera.project_segment((x - iw*0.35, y - ih*0.2, z_bay + 0.01),
                                                              (x + iw*0.35, y + ih*0.3, z_bay + 0.01))
                            if s_streak:
                                cv2.line(img_arr, s_streak[0], s_streak[1], (220, 235, 255), 2, cv2.LINE_AA)

                        # Long vertical black aluminum door latch handle on opening edge
                        handle_x = x + w*0.42 if z < 0 else x - w*0.42
                        s_hdl = camera.project_segment((handle_x, y - 0.25, z_aisle + 0.01),
                                                       (handle_x, y + 0.25, z_aisle + 0.01))
                        if s_hdl:
                            cv2.line(img_arr, s_hdl[0], s_hdl[1], (30, 32, 38), 3, cv2.LINE_AA)

                    # Continuous Electric Blue Under-Rack Floor-Wash LED Glow Strip
                    z_glow = z1 if z < 0 else z0
                    glow_seg = camera.project_segment((x0, 0.03, z_glow), (x1, 0.03, z_glow))
                    if glow_seg:
                        # Intense core
                        cv2.line(img_arr, glow_seg[0], glow_seg[1], (0, 190, 255), 3, cv2.LINE_AA)
                        # Soft bloom
                        overlay = img_arr.copy()
                        cv2.line(overlay, glow_seg[0], glow_seg[1], (0, 140, 255), 10, cv2.LINE_AA)
                        cv2.addWeighted(overlay, 0.45, img_arr, 0.55, 0, img_arr)

                return draw_rack

            draw_primitives.append((z_rack, make_draw_rack()))

        # =========================================================================
        # 6. CENTRAL HOT-AISLE CONTAINMENT CANOPY (1.5m clear span)
        # =========================================================================
        canopy_y = 2.25
        canopy_x0, canopy_x1 = -3.0, 3.0
        z_a_in, z_b_in = -0.75, 0.75
        canopy_pts = [
            (canopy_x0, canopy_y, z_a_in), (canopy_x1, canopy_y, z_a_in),
            (canopy_x1, canopy_y, z_b_in), (canopy_x0, canopy_y, z_b_in)
        ]
        sc_canopy, z_canopy = project_poly(canopy_pts)
        if sc_canopy:
            def draw_containment(img_arr):
                # Structural extruded aluminum perimeter box beam headers
                s_h1 = camera.project_segment((canopy_x0, canopy_y, z_a_in), (canopy_x1, canopy_y, z_a_in))
                s_h2 = camera.project_segment((canopy_x0, canopy_y, z_b_in), (canopy_x1, canopy_y, z_b_in))
                if s_h1:
                    cv2.line(img_arr, s_h1[0], s_h1[1], (190, 200, 215), 3, cv2.LINE_AA)
                if s_h2:
                    cv2.line(img_arr, s_h2[0], s_h2[1], (190, 200, 215), 3, cv2.LINE_AA)

                # Translucent glass ceiling with alpha blend
                overlay = img_arr.copy()
                pts_c = np.array(sc_canopy, np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(overlay, [pts_c], (170, 210, 240))
                cv2.addWeighted(overlay, 0.32, img_arr, 0.68, 0, img_arr)
                cv2.polylines(img_arr, [pts_c], True, (210, 235, 255), 2, cv2.LINE_AA)

                # 7 Transverse structural aluminum cross-ribs
                for rib_x in np.linspace(canopy_x0, canopy_x1, 7):
                    seg = camera.project_segment((rib_x, canopy_y, z_a_in), (rib_x, canopy_y, z_b_in))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (200, 215, 235), 2, cv2.LINE_AA)

                # Bi-parting sliding glass end doors at both aisle ends
                for end_x in [canopy_x0, canopy_x1]:
                    d_pts = [
                        (end_x, 0.0, z_a_in), (end_x, canopy_y, z_a_in),
                        (end_x, canopy_y, z_b_in), (end_x, 0.0, z_b_in)
                    ]
                    sd, _ = project_poly(d_pts)
                    if sd:
                        d_arr = np.array(sd, np.int32).reshape((-1, 1, 2))
                        # Door outer aluminum frame
                        cv2.polylines(img_arr, [d_arr], True, (180, 195, 215), 3, cv2.LINE_AA)
                        # Translucent door glass panel
                        overlay_d = img_arr.copy()
                        cv2.fillPoly(overlay_d, [d_arr], (150, 190, 225))
                        cv2.addWeighted(overlay_d, 0.22, img_arr, 0.78, 0, img_arr)
                        # Center mullion split
                        m_seg = camera.project_segment((end_x, 0.0, 0.0), (end_x, canopy_y, 0.0))
                        if m_seg:
                            cv2.line(img_arr, m_seg[0], m_seg[1], (190, 205, 225), 2, cv2.LINE_AA)
                        # Stainless steel D-handles on both door leaves
                        h1 = camera.project_segment((end_x, 0.85, -0.06), (end_x, 1.25, -0.06))
                        h2 = camera.project_segment((end_x, 0.85, 0.06), (end_x, 1.25, 0.06))
                        if h1:
                            cv2.line(img_arr, h1[0], h1[1], (240, 245, 250), 3, cv2.LINE_AA)
                        if h2:
                            cv2.line(img_arr, h2[0], h2[1], (240, 245, 250), 3, cv2.LINE_AA)

            draw_primitives.append((z_canopy - 0.2, draw_containment))

        # =========================================================================
        # 7. RENDER DEPTH-SORTED PRIMITIVES
        # =========================================================================
        draw_primitives.sort(key=lambda item: item[0], reverse=True)
        img_buffer = np.uint8(np.clip(canvas, 0, 255))

        for _, draw_fn in draw_primitives:
            draw_fn(img_buffer)

        # Subtle bloom filter for LED transceivers and linear daylight troffers
        pil_img = Image.fromarray(cv2.cvtColor(img_buffer, cv2.COLOR_BGR2RGB))
        glow = pil_img.filter(ImageFilter.GaussianBlur(radius=2.0))
        final_pil = Image.blend(pil_img, glow, alpha=0.12)

        return final_pil

    @staticmethod
    def enhance_with_photographic_realism(
        geometry_image: Image.Image,
        sdxl_diffusion_image: Optional[Image.Image] = None,
        blend_ratio: float = 0.30
    ) -> Image.Image:
        """
        Applies photographic realism, micro-surface textures, specular bloom, and filmic contrast
        while maintaining 100% geometric lock.
        """
        w, h = geometry_image.size
        
        # 1. Filmic S-curve tone mapping to bring out specular contrast and rich shadows
        arr = np.array(geometry_image, dtype=np.float32) / 255.0
        # Filmic contrast curve: x^1.1 / (x^1.1 + (1-x)^1.1)
        gamma = 1.15
        filmic = (arr ** gamma) / ((arr ** gamma) + ((1.0 - arr) ** gamma) + 1e-6)
        filmic_img = Image.fromarray(np.uint8(np.clip(filmic * 255.0, 0, 255)))

        # 2. High-pass micro-surface texture enhancement
        unsharp = filmic_img.filter(ImageFilter.UnsharpMask(radius=1.8, percent=140, threshold=2))

        # 3. If remote SDXL diffusion image is supplied: extract high-frequency photographic texture
        if sdxl_diffusion_image is not None:
            sdxl_resized = sdxl_diffusion_image.resize((w, h), Image.Resampling.LANCZOS)
            sdxl_blur = sdxl_resized.filter(ImageFilter.GaussianBlur(radius=6.0))
            sdxl_arr = np.array(sdxl_resized, dtype=np.float32)
            blur_arr = np.array(sdxl_blur, dtype=np.float32)
            texture_detail = sdxl_arr - blur_arr
            
            # Fuse photographic texture details onto the geometry-locked render
            base_arr = np.array(unsharp, dtype=np.float32)
            fused = base_arr + texture_detail * blend_ratio
            unsharp = Image.fromarray(np.uint8(np.clip(fused, 0, 255)))

        # 4. Subtle chromatic aberration at lens edges & sensor grain
        final_arr = np.array(unsharp, dtype=np.float32)
        # Add photographic grain
        grain = np.random.normal(0, 1.8, final_arr.shape).astype(np.float32)
        enhanced = np.clip(final_arr + grain, 0, 255).astype(np.uint8)

        return Image.fromarray(enhanced)

print("Phase41PhotorealisticRenderer defined successfully")
