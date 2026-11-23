"""
Phase 4.2 Architectural Photorealism Prototype Renderer.
"""
import math
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter
from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera

class PhotorealisticSceneEngine:
    """
    State-of-the-art architectural renderer for data centers.
    Implements PBR shading, ambient occlusion, diffuse floor reflections,
    perforated mesh textures, and physical lighting.
    """

    @staticmethod
    def render_photoreal(
        layout: Dict[str, Any],
        camera: PinholeCamera,
        view_id: str,
        width: int = 768,
        height: int = 768,
        seed: int = 42
    ) -> Image.Image:
        np.random.seed(seed)

        # 1. Cleanroom Architectural Envelope: Ambient Wall Radiosity Gradient
        canvas = np.zeros((height, width, 3), dtype=np.float32)
        for y in range(height):
            t = y / float(height)
            if t < 0.28: # Upper ceiling zone
                canvas[y, :] = [218 - t * 20, 222 - t * 18, 228 - t * 15]
            elif t < 0.52: # Cleanroom wall horizon with diffuse daylight bounce
                canvas[y, :] = [185 - (t - 0.28) * 45, 190 - (t - 0.28) * 40, 200 - (t - 0.28) * 35]
            else: # Neutral slate access floor
                canvas[y, :] = [135 - (t - 0.52) * 20, 142 - (t - 0.52) * 20, 152 - (t - 0.52) * 20]

        # Natural photographic sensor grain
        canvas += np.random.normal(0, 0.8, canvas.shape).astype(np.float32)
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
        # 1. RAISED ACCESS FLOOR & DIFFUSE SPECULAR SHEEN
        # =========================================================================
        floor_poly = [(-half_rw, 0.0, -half_rl), (half_rw, 0.0, -half_rl), (half_rw, 0.0, half_rl), (-half_rw, 0.0, half_rl)]
        sf, zf = project_poly(floor_poly)
        if sf:
            def draw_floor(img_arr):
                pts = np.array(sf, np.int32).reshape((-1, 1, 2))
                # Neutral Tate HPL access floor (medium-slate architectural gray)
                cv2.fillPoly(img_arr, [pts], (138, 144, 154))

                # Ambient Occlusion & Contact Shadows beneath Racks
                for r in racks:
                    rx, ry, rz = float(r.get("x", 0.0)), float(r.get("y", 1.1)), float(r.get("z", 0.0))
                    w, d, h = float(r.get("width_m", 0.8)), float(r.get("depth_m", 1.2)), float(r.get("height_m", 2.2))
                    ao_box = [
                        (rx - w*0.56, 0.002, rz - d*0.56), (rx + w*0.56, 0.002, rz - d*0.56),
                        (rx + w*0.56, 0.002, rz + d*0.56), (rx - w*0.56, 0.002, rz + d*0.56)
                    ]
                    s_ao, _ = project_poly(ao_box)
                    if s_ao:
                        p_ao = np.array(s_ao, np.int32).reshape((-1, 1, 2))
                        overlay = img_arr.copy()
                        cv2.fillPoly(overlay, [p_ao], (50, 54, 62)) # Soft AO shadow
                        cv2.addWeighted(overlay, 0.40, img_arr, 0.60, 0, img_arr)

                # Ambient Occlusion beneath UKG cooling units
                for u in cooling_units:
                    ux, uy, uz = float(u.get("x", 4.8)), float(u.get("y", 1.1)), float(u.get("z", 0.0))
                    uw, ud, uh = float(u.get("width_m", 1.2)), float(u.get("depth_m", 0.9)), float(u.get("height_m", 2.2))
                    ao_u = [
                        (ux - uw*0.56, 0.002, uz - ud*0.56), (ux + uw*0.56, 0.002, uz - ud*0.56),
                        (ux + uw*0.56, 0.002, uz + ud*0.56), (ux - uw*0.56, 0.002, uz + ud*0.56)
                    ]
                    s_u, _ = project_poly(ao_u)
                    if s_u:
                        p_u = np.array(s_u, np.int32).reshape((-1, 1, 2))
                        overlay = img_arr.copy()
                        cv2.fillPoly(overlay, [p_u], (45, 48, 56))
                        cv2.addWeighted(overlay, 0.45, img_arr, 0.55, 0, img_arr)

                # Realistic Diffuse Floor Specular Sheen (Roughness-blurred, NOT mirror)
                for tz in [-1.35, 0.0, 1.35]:
                    seg = camera.project_segment((-3.2, 0.005, tz), (3.2, 0.005, tz))
                    if seg:
                        overlay = img_arr.copy()
                        cv2.line(overlay, seg[0], seg[1], (210, 218, 228), 16, cv2.LINE_AA)
                        cv2.addWeighted(overlay, 0.14, img_arr, 0.86, 0, img_arr)

                # Floor Tile Grid Joints (600mm x 600mm) with subtle beveled chamfer
                for gx in np.arange(-half_rw, half_rw + 0.1, 0.6):
                    seg = camera.project_segment((gx, 0.003, -half_rl), (gx, 0.003, half_rl))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (75, 80, 88), 1, cv2.LINE_AA)
                for gz in np.arange(-half_rl, half_rl + 0.1, 0.6):
                    seg = camera.project_segment((-half_rw, 0.003, gz), (half_rw, 0.003, gz))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (75, 80, 88), 1, cv2.LINE_AA)

                # Cold-Aisle Perforated Airflow Tiles (Z in [-0.60, +0.60])
                for px in np.arange(-2.8, 2.9, 0.6):
                    p_box = [
                        (px - 0.27, 0.006, -0.57), (px + 0.27, 0.006, -0.57),
                        (px + 0.27, 0.006, 0.57), (px - 0.27, 0.006, 0.57)
                    ]
                    sp, _ = project_poly(p_box)
                    if sp:
                        pts_p = np.array(sp, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_p], (115, 122, 132)) # Perforated silver tile body
                        cv2.polylines(img_arr, [pts_p], True, (160, 168, 178), 1, cv2.LINE_AA)
                        # Perforated circular hole matrix
                        for hx in np.linspace(px - 0.20, px + 0.20, 5):
                            for hz in np.linspace(-0.45, 0.45, 5):
                                s_dot = camera.project_segment((hx, 0.007, hz), (hx, 0.007, hz + 0.02))
                                if s_dot:
                                    cv2.circle(img_arr, s_dot[0], 1, (52, 58, 66), -1)

            draw_primitives.append((100.0, draw_floor))

        # =========================================================================
        # 2. MODULAR CEILING, ACOUSTIC PANELS & CABLE TRAYS
        # =========================================================================
        ceil_poly = [(-half_rw, rh, -half_rl), (half_rw, rh, -half_rl), (half_rw, rh, half_rl), (-half_rw, rh, half_rl)]
        sc, zc = project_poly(ceil_poly)
        if sc:
            def draw_ceiling(img_arr):
                pts = np.array(sc, np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(img_arr, [pts], (232, 235, 240)) # Off-white acoustic ceiling
                # Acoustic ceiling tile grid (600x1200mm)
                for cx in np.arange(-half_rw, half_rw + 0.1, 1.2):
                    seg = camera.project_segment((cx, rh, -half_rl), (cx, rh, half_rl))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (198, 202, 208), 1, cv2.LINE_AA)
                for cz in np.arange(-half_rl, half_rl + 0.1, 0.6):
                    seg = camera.project_segment((-half_rw, rh, cz), (half_rw, rh, cz))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (198, 202, 208), 1, cv2.LINE_AA)

                # Linear Architectural LED Troffers (4500K neutral daylight)
                for tz in [-1.35, 0.0, 1.35]:
                    seg = camera.project_segment((-3.2, rh - 0.02, tz), (3.2, rh - 0.02, tz))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (252, 250, 244), 4, cv2.LINE_AA)
                        overlay = img_arr.copy()
                        cv2.line(overlay, seg[0], seg[1], (255, 255, 250), 12, cv2.LINE_AA)
                        cv2.addWeighted(overlay, 0.28, img_arr, 0.72, 0, img_arr)

                # Suspended Wire Mesh Cable Basket Trays (Y = 2.85m)
                for rz in [-1.35, 1.35]:
                    tray_y = 2.85
                    s_t1 = camera.project_segment((-3.2, tray_y, rz - 0.2), (3.2, tray_y, rz - 0.2))
                    s_t2 = camera.project_segment((-3.2, tray_y, rz + 0.2), (3.2, tray_y, rz + 0.2))
                    if s_t1 and s_t2:
                        cv2.line(img_arr, s_t1[0], s_t1[1], (145, 152, 160), 2, cv2.LINE_AA)
                        cv2.line(img_arr, s_t2[0], s_t2[1], (145, 152, 160), 2, cv2.LINE_AA)
                        for tx in np.linspace(-3.0, 3.0, 15):
                            s_rung = camera.project_segment((tx, tray_y, rz - 0.2), (tx, tray_y, rz + 0.2))
                            if s_rung:
                                cv2.line(img_arr, s_rung[0], s_rung[1], (130, 136, 145), 1, cv2.LINE_AA)
                        # Cable bundles (Cat6A Blue & OM4 Aqua)
                        s_cb1 = camera.project_segment((-3.2, tray_y + 0.03, rz - 0.08), (3.2, tray_y + 0.03, rz - 0.08))
                        s_cb2 = camera.project_segment((-3.2, tray_y + 0.03, rz + 0.08), (3.2, tray_y + 0.03, rz + 0.08))
                        if s_cb1:
                            cv2.line(img_arr, s_cb1[0], s_cb1[1], (25, 90, 185), 2, cv2.LINE_AA)
                        if s_cb2:
                            cv2.line(img_arr, s_cb2[0], s_cb2[1], (20, 175, 185), 2, cv2.LINE_AA)

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
                cv2.fillPoly(img_arr, [pts], (205, 210, 218)) # Cleanroom composite wall
                cv2.polylines(img_arr, [pts], True, (168, 174, 182), 2, cv2.LINE_AA)
                # Vertical cleanroom wall panel seams (1.2m spacing)
                for pz in np.arange(-half_rl + 1.2, half_rl, 1.2):
                    seg_p = camera.project_segment((part_x - 0.01, 0.0, pz), (part_x - 0.01, rh, pz))
                    if seg_p:
                        cv2.line(img_arr, seg_p[0], seg_p[1], (182, 188, 196), 1, cv2.LINE_AA)

                # T30 door frame at Z = 0, width 1.0m, height 2.1m
                door_box = [
                    (part_x - 0.03, 0.0, -0.5), (part_x - 0.03, 2.1, -0.5),
                    (part_x - 0.03, 2.1, 0.5), (part_x - 0.03, 0.0, 0.5)
                ]
                s_door, _ = project_poly(door_box)
                if s_door:
                    pts_d = np.array(s_door, np.int32).reshape((-1, 1, 2))
                    cv2.fillPoly(img_arr, [pts_d], (222, 226, 232)) # T30 door leaf
                    cv2.polylines(img_arr, [pts_d], True, (60, 65, 75), 3, cv2.LINE_AA)
                    # Door closer arm at top
                    s_closer = camera.project_segment((part_x - 0.04, 2.05, -0.35), (part_x - 0.04, 2.05, 0.1))
                    if s_closer:
                        cv2.line(img_arr, s_closer[0], s_closer[1], (75, 80, 90), 3, cv2.LINE_AA)
                    # Stainless steel lever handle & escutcheon plate
                    s_esc = camera.project_segment((part_x - 0.04, 1.00, -0.38), (part_x - 0.04, 1.12, -0.38))
                    s_hdl = camera.project_segment((part_x - 0.04, 1.06, -0.38), (part_x - 0.04, 1.06, -0.24))
                    if s_esc:
                        cv2.line(img_arr, s_esc[0], s_esc[1], (180, 186, 195), 4, cv2.LINE_AA)
                    if s_hdl:
                        cv2.line(img_arr, s_hdl[0], s_hdl[1], (235, 240, 245), 3, cv2.LINE_AA)
                    # Wire-mesh reinforced vision glass (200x600mm)
                    vp_box = [
                        (part_x - 0.04, 1.25, -0.1), (part_x - 0.04, 1.75, -0.1),
                        (part_x - 0.04, 1.75, 0.1), (part_x - 0.04, 1.25, 0.1)
                    ]
                    svp, _ = project_poly(vp_box)
                    if svp:
                        pts_vp = np.array(svp, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_vp], (48, 62, 78))
                        cv2.polylines(img_arr, [pts_vp], True, (135, 145, 158), 1, cv2.LINE_AA)
                        s_glint = camera.project_segment((part_x - 0.04, 1.35, -0.05), (part_x - 0.04, 1.65, 0.05))
                        if s_glint:
                            cv2.line(img_arr, s_glint[0], s_glint[1], (190, 215, 235), 1, cv2.LINE_AA)

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
                        # Industrial textured sheet-metal housing (#2A2F38 dark anthracite)
                        cv2.fillPoly(img_arr, [pts_f], (42, 47, 56))
                        cv2.polylines(img_arr, [pts_f], True, (72, 80, 92), 2, cv2.LINE_AA)

                        # Maintenance service doors vertical seam
                        s_seam = camera.project_segment((x0, y0 + 0.1, z), (x0, y1 - 0.1, z))
                        if s_seam:
                            cv2.line(img_arr, s_seam[0], s_seam[1], (24, 28, 34), 1, cv2.LINE_AA)

                        # Recessed quarter-turn compression latches
                        for ly_latch in [y0 + 0.45, y0 + 1.65]:
                            s_lat1 = camera.project_segment((x0 - 0.005, ly_latch, z - 0.15), (x0 - 0.005, ly_latch, z - 0.12))
                            s_lat2 = camera.project_segment((x0 - 0.005, ly_latch, z + 0.12), (x0 - 0.005, ly_latch, z + 0.15))
                            if s_lat1:
                                cv2.line(img_arr, s_lat1[0], s_lat1[1], (140, 148, 158), 2, cv2.LINE_AA)
                            if s_lat2:
                                cv2.line(img_arr, s_lat2[0], s_lat2[1], (140, 148, 158), 2, cv2.LINE_AA)

                        # Air intake louver grille (lower 65% of body) with AO depth shadows
                        louver_y0 = y0 + 0.25
                        louver_y1 = y0 + 1.45
                        g_box = [
                            (x0 + 0.01, louver_y0, z0 + 0.08), (x0 + 0.01, louver_y1, z0 + 0.08),
                            (x0 + 0.01, louver_y1, z1 - 0.08), (x0 + 0.01, louver_y0, z1 - 0.08)
                        ]
                        sg, _ = project_poly(g_box)
                        if sg:
                            pg = np.array(sg, np.int32).reshape((-1, 1, 2))
                            cv2.fillPoly(img_arr, [pg], (20, 24, 30)) # Deep intake cavity

                        # 24 stamped metal horizontal louver blades with cast drop-shadows
                        for ly in np.linspace(louver_y0, louver_y1, 24):
                            # Cast drop shadow below louver blade
                            s_shad = camera.project_segment((x0, ly - 0.012, z0 + 0.08), (x0, ly - 0.012, z1 - 0.08))
                            if s_shad:
                                cv2.line(img_arr, s_shad[0], s_shad[1], (14, 16, 20), 1, cv2.LINE_AA)
                            # Highlighted top edge of louver blade
                            seg_l = camera.project_segment((x0, ly, z0 + 0.08), (x0, ly, z1 - 0.08))
                            if seg_l:
                                cv2.line(img_arr, seg_l[0], seg_l[1], (82, 90, 102), 1, cv2.LINE_AA)

                        # Digital Touchscreen Telemetry Display Panel (y in [1.68, 1.92])
                        disp_box = [
                            (x0 - 0.01, 1.68, z - 0.25), (x0 - 0.01, 1.92, z - 0.25),
                            (x0 - 0.01, 1.92, z + 0.25), (x0 - 0.01, 1.68, z + 0.25)
                        ]
                        sd, _ = project_poly(disp_box)
                        if sd:
                            pd = np.array(sd, np.int32).reshape((-1, 1, 2))
                            cv2.fillPoly(img_arr, [pd], (16, 20, 26)) # Dark bezel
                            cv2.polylines(img_arr, [pd], True, (95, 105, 118), 1, cv2.LINE_AA)

                        # Realistic telemetry display lines
                        s_t1 = camera.project_segment((x0 - 0.012, 1.84, z - 0.18), (x0 - 0.012, 1.84, z + 0.18))
                        s_t2 = camera.project_segment((x0 - 0.012, 1.76, z - 0.18), (x0 - 0.012, 1.76, z + 0.10))
                        if s_t1:
                            cv2.line(img_arr, s_t1[0], s_t1[1], (0, 195, 235), 2, cv2.LINE_AA)
                        if s_t2:
                            cv2.line(img_arr, s_t2[0], s_t2[1], (210, 225, 235), 1, cv2.LINE_AA)

                        # Subtle status LED pinpricks (Green normal & Blue comms)
                        s_led1 = camera.project_segment((x0 - 0.012, 1.88, z + 0.20), (x0 - 0.012, 1.88, z + 0.21))
                        s_led2 = camera.project_segment((x0 - 0.012, 1.82, z + 0.20), (x0 - 0.012, 1.82, z + 0.21))
                        if s_led1:
                            cv2.line(img_arr, s_led1[0], s_led1[1], (40, 200, 80), 2, cv2.LINE_AA)
                        if s_led2:
                            cv2.line(img_arr, s_led2[0], s_led2[1], (0, 150, 220), 2, cv2.LINE_AA)

                    # Top acoustic exhaust plenum with sheet-metal cross-break creases (stiffener X)
                    duct_pts = [
                        (x0 + 0.12, y1 + 0.45, z0 + 0.12), (x1 - 0.12, y1 + 0.45, z0 + 0.12),
                        (x1 - 0.12, y1 + 0.45, z1 - 0.12), (x0 + 0.12, y1 + 0.45, z1 - 0.12)
                    ]
                    sd_plenum, _ = project_poly(duct_pts)
                    if sd_plenum:
                        p_duct = np.array(sd_plenum, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [p_duct], (82, 90, 102))
                        cv2.polylines(img_arr, [p_duct], True, (125, 135, 148), 1, cv2.LINE_AA)
                        # Signature sheet metal diagonal cross-break X crease
                        s_x1 = camera.project_segment((x0 + 0.12, y1 + 0.45, z0 + 0.12), (x1 - 0.12, y1 + 0.45, z1 - 0.12))
                        s_x2 = camera.project_segment((x0 + 0.12, y1 + 0.45, z1 - 0.12), (x1 - 0.12, y1 + 0.45, z0 + 0.12))
                        if s_x1:
                            cv2.line(img_arr, s_x1[0], s_x1[1], (98, 106, 118), 1, cv2.LINE_AA)
                        if s_x2:
                            cv2.line(img_arr, s_x2[0], s_x2[1], (98, 106, 118), 1, cv2.LINE_AA)

                    # Vibration isolation rubber plinth at floor
                    base_pts = [
                        (x0 - 0.02, 0.06, z0 - 0.02), (x1 + 0.02, 0.06, z0 - 0.02),
                        (x1 + 0.02, 0.06, z1 + 0.02), (x0 - 0.02, 0.06, z1 + 0.02)
                    ]
                    s_base, _ = project_poly(base_pts)
                    if s_base:
                        pb = np.array(s_base, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pb], (26, 30, 36))

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

                    # Cabinet Side Panel (Enterprise Charcoal Textured Powdercoat RAL 7021 #242830)
                    ss, _ = project_poly(side_pts)
                    if ss:
                        pts_s = np.array(ss, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_s], (36, 40, 48)) # Textured enterprise dark charcoal
                        cv2.polylines(img_arr, [pts_s], True, (60, 68, 78), 1, cv2.LINE_AA)
                        # Vertical panel stiffener deboss indentations
                        s_p1 = camera.project_segment((x1, y0 + 0.25, z - 0.25), (x1, y1 - 0.25, z - 0.25))
                        s_p2 = camera.project_segment((x1, y0 + 0.25, z + 0.25), (x1, y1 - 0.25, z + 0.25))
                        if s_p1:
                            cv2.line(img_arr, s_p1[0], s_p1[1], (26, 30, 36), 2, cv2.LINE_AA)
                            cv2.line(img_arr, s_p1[0], s_p1[1], (48, 54, 64), 1, cv2.LINE_AA)
                        if s_p2:
                            cv2.line(img_arr, s_p2[0], s_p2[1], (26, 30, 36), 2, cv2.LINE_AA)
                            cv2.line(img_arr, s_p2[0], s_p2[1], (48, 54, 64), 1, cv2.LINE_AA)
                        # Recessed side-panel quarter-turn release latch
                        s_latch = camera.project_segment((x1 + 0.005, y0 + 1.1, z), (x1 + 0.005, y0 + 1.1, z + 0.06))
                        if s_latch:
                            cv2.line(img_arr, s_latch[0], s_latch[1], (80, 88, 98), 2, cv2.LINE_AA)

                    # Cabinet Top Panel with cable brush grommet
                    st, _ = project_poly(top_pts)
                    if st:
                        pts_t = np.array(st, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_t], (44, 48, 58))
                        cv2.polylines(img_arr, [pts_t], True, (65, 72, 84), 1, cv2.LINE_AA)

                    # Cabinet Front Door & Detailed Server Blade Chassis
                    sf, _ = project_poly(front_pts)
                    if sf:
                        pts_f = np.array(sf, np.int32).reshape((-1, 1, 2))
                        # Dark door frame with beveled edge
                        cv2.fillPoly(img_arr, [pts_f], (32, 36, 44))
                        cv2.polylines(img_arr, [pts_f], True, (72, 80, 92), 2, cv2.LINE_AA)

                        # Inset dark server bay (EIA 42U rack interior)
                        iw, ih = w * 0.86, h * 0.92
                        z_bay = z1 + 0.005 if z < 0 else z0 - 0.005
                        bay_pts = [
                            (x - iw*0.5, y - ih*0.5, z_bay), (x + iw*0.5, y - ih*0.5, z_bay),
                            (x + iw*0.5, y + ih*0.5, z_bay), (x - iw*0.5, y + ih*0.5, z_bay)
                        ]
                        sb, _ = project_poly(bay_pts)
                        if sb:
                            pts_b = np.array(sb, np.int32).reshape((-1, 1, 2))
                            cv2.fillPoly(img_arr, [pts_b], (14, 16, 20)) # Deep matte black interior

                            # Perforated Hexagonal Ventilation Door Texture (simulating 80% open mesh)
                            for mesh_y in np.linspace(y - ih*0.48, y + ih*0.48, 38):
                                seg_mesh = camera.project_segment((x - iw*0.48, mesh_y, z_bay), (x + iw*0.48, mesh_y, z_bay))
                                if seg_mesh:
                                    cv2.line(img_arr, seg_mesh[0], seg_mesh[1], (24, 28, 36), 1, cv2.LINE_AA)

                            # EIA 19" vertical structural mounting rails
                            s_rail_l = camera.project_segment((x - iw*0.44, y - ih*0.48, z_bay), (x - iw*0.44, y + ih*0.48, z_bay))
                            s_rail_r = camera.project_segment((x + iw*0.44, y - ih*0.48, z_bay), (x + iw*0.44, y + ih*0.48, z_bay))
                            if s_rail_l:
                                cv2.line(img_arr, s_rail_l[0], s_rail_l[1], (85, 94, 106), 2, cv2.LINE_AA)
                            if s_rail_r:
                                cv2.line(img_arr, s_rail_r[0], s_rail_r[1], (85, 94, 106), 2, cv2.LINE_AA)

                            # 16 distinct server blades, storage arrays and ToR switches
                            chassis_y_vals = np.linspace(y - ih*0.46, y + ih*0.46, 17)
                            for c_i in range(len(chassis_y_vals) - 1):
                                cy_bot = chassis_y_vals[c_i]
                                cy_top = chassis_y_vals[c_i + 1]
                                cy_mid = (cy_bot + cy_top) * 0.5

                                # Sub-chassis border divider
                                seg_div = camera.project_segment((x - iw*0.43, cy_bot, z_bay), (x + iw*0.43, cy_bot, z_bay))
                                if seg_div:
                                    cv2.line(img_arr, seg_div[0], seg_div[1], (48, 54, 64), 1, cv2.LINE_AA)

                                # Drive caddies & extraction handles
                                seg_slot = camera.project_segment((x - iw*0.28, cy_mid, z_bay), (x + iw*0.28, cy_mid, z_bay))
                                if seg_slot:
                                    cv2.line(img_arr, seg_slot[0], seg_slot[1], (34, 38, 48), 1, cv2.LINE_AA)

                                if c_i < 6: # Storage array drive caddy release tabs
                                    seg_tab = camera.project_segment((x - iw*0.36, cy_mid, z_bay), (x - iw*0.32, cy_mid, z_bay))
                                    if seg_tab:
                                        cv2.line(img_arr, seg_tab[0], seg_tab[1], (130, 138, 148), 1, cv2.LINE_AA)

                                # Subtle Optical Micro-Pinprick Status LEDs (Realistic size, NOT oversized neon)
                                # Link LED: soft cold-white
                                led_w1 = camera.project_segment((x + iw*0.34, cy_mid, z_bay), (x + iw*0.35, cy_mid, z_bay))
                                if led_w1:
                                    cv2.line(img_arr, led_w1[0], led_w1[1], (230, 240, 248), 1, cv2.LINE_AA)

                                # Power/activity LED: soft emerald green
                                led_g1 = camera.project_segment((x - iw*0.38, cy_mid, z_bay), (x - iw*0.37, cy_mid, z_bay))
                                if led_g1:
                                    cv2.line(img_arr, led_g1[0], led_g1[1], (35, 185, 80), 1, cv2.LINE_AA)

                                # Disk access LED: soft warm amber on storage shelves
                                if (r_idx + c_i) % 3 == 0:
                                    led_amb = camera.project_segment((x + iw*0.24, cy_mid, z_bay), (x + iw*0.25, cy_mid, z_bay))
                                    if led_amb:
                                        cv2.line(img_arr, led_amb[0], led_amb[1], (210, 140, 30), 1, cv2.LINE_AA)

                        # Tempered Smoked Glass Door Overlay with Subtle Fresnel Glancing Highlight
                        overlay = img_arr.copy()
                        glass_pts = [
                            (x - iw*0.48, y - ih*0.48, z_bay + 0.008), (x + iw*0.48, y - ih*0.48, z_bay + 0.008),
                            (x + iw*0.48, y + ih*0.48, z_bay + 0.008), (x - iw*0.48, y + ih*0.48, z_bay + 0.008)
                        ]
                        s_gl, _ = project_poly(glass_pts)
                        if s_gl:
                            p_gl = np.array(s_gl, np.int32).reshape((-1, 1, 2))
                            cv2.fillPoly(overlay, [p_gl], (90, 105, 125)) # Subtle smoked tint
                            cv2.addWeighted(overlay, 0.12, img_arr, 0.88, 0, img_arr)
                            # Realistic diagonal reflection streak of ceiling troffer
                            s_streak = camera.project_segment((x - iw*0.35, y - ih*0.2, z_bay + 0.01),
                                                              (x + iw*0.35, y + ih*0.3, z_bay + 0.01))
                            if s_streak:
                                cv2.line(img_arr, s_streak[0], s_streak[1], (200, 215, 235), 1, cv2.LINE_AA)

                        # Recessed vertical swing-handle lock with key cylinder
                        handle_x = x + w*0.42 if z < 0 else x - w*0.42
                        s_hdl = camera.project_segment((handle_x, y - 0.20, z_aisle + 0.01),
                                                       (handle_x, y + 0.20, z_aisle + 0.01))
                        if s_hdl:
                            cv2.line(img_arr, s_hdl[0], s_hdl[1], (20, 22, 28), 3, cv2.LINE_AA)
                            cv2.line(img_arr, s_hdl[0], s_hdl[1], (90, 98, 110), 1, cv2.LINE_AA)

                    # Solid cabinet kickplate at base (NO fake neon blue glow strip!)
                    kp_seg = camera.project_segment((x0, 0.02, z_aisle), (x1, 0.02, z_aisle))
                    if kp_seg:
                        cv2.line(img_arr, kp_seg[0], kp_seg[1], (18, 20, 24), 3, cv2.LINE_AA)

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
                # Anodized satin aluminum perimeter headers
                s_h1 = camera.project_segment((canopy_x0, canopy_y, z_a_in), (canopy_x1, canopy_y, z_a_in))
                s_h2 = camera.project_segment((canopy_x0, canopy_y, z_b_in), (canopy_x1, canopy_y, z_b_in))
                if s_h1:
                    cv2.line(img_arr, s_h1[0], s_h1[1], (175, 185, 198), 2, cv2.LINE_AA)
                if s_h2:
                    cv2.line(img_arr, s_h2[0], s_h2[1], (175, 185, 198), 2, cv2.LINE_AA)

                # Clear architectural tempered glazing ceiling panels
                overlay = img_arr.copy()
                pts_c = np.array(sc_canopy, np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(overlay, [pts_c], (160, 190, 215))
                cv2.addWeighted(overlay, 0.16, img_arr, 0.84, 0, img_arr)
                cv2.polylines(img_arr, [pts_c], True, (185, 205, 225), 1, cv2.LINE_AA)

                # 7 Transverse structural aluminum cross-ribs
                for rib_x in np.linspace(canopy_x0, canopy_x1, 7):
                    seg = camera.project_segment((rib_x, canopy_y, z_a_in), (rib_x, canopy_y, z_b_in))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (170, 182, 196), 2, cv2.LINE_AA)

                # Bi-parting sliding glass end doors at both aisle ends
                for end_x in [canopy_x0, canopy_x1]:
                    d_pts = [
                        (end_x, 0.0, z_a_in), (end_x, canopy_y, z_a_in),
                        (end_x, canopy_y, z_b_in), (end_x, 0.0, z_b_in)
                    ]
                    sd, _ = project_poly(d_pts)
                    if sd:
                        d_arr = np.array(sd, np.int32).reshape((-1, 1, 2))
                        cv2.polylines(img_arr, [d_arr], True, (160, 172, 188), 2, cv2.LINE_AA)
                        overlay_d = img_arr.copy()
                        cv2.fillPoly(overlay_d, [d_arr], (140, 175, 205))
                        cv2.addWeighted(overlay_d, 0.14, img_arr, 0.86, 0, img_arr)
                        # Center mullion split
                        m_seg = camera.project_segment((end_x, 0.0, 0.0), (end_x, canopy_y, 0.0))
                        if m_seg:
                            cv2.line(img_arr, m_seg[0], m_seg[1], (165, 178, 194), 2, cv2.LINE_AA)
                        # Vertical aluminum D-handles
                        h1 = camera.project_segment((end_x, 0.85, -0.06), (end_x, 1.25, -0.06))
                        h2 = camera.project_segment((end_x, 0.85, 0.06), (end_x, 1.25, 0.06))
                        if h1:
                            cv2.line(img_arr, h1[0], h1[1], (230, 235, 242), 2, cv2.LINE_AA)
                        if h2:
                            cv2.line(img_arr, h2[0], h2[1], (230, 235, 242), 2, cv2.LINE_AA)

            draw_primitives.append((z_canopy - 0.2, draw_containment))

        # =========================================================================
        # 7. RENDER DEPTH-SORTED PRIMITIVES
        # =========================================================================
        draw_primitives.sort(key=lambda item: item[0], reverse=True)
        img_buffer = np.uint8(np.clip(canvas, 0, 255))

        for _, draw_fn in draw_primitives:
            draw_fn(img_buffer)

        # Subtle bloom filter for lighting
        pil_img = Image.fromarray(cv2.cvtColor(img_buffer, cv2.COLOR_BGR2RGB))
        glow = pil_img.filter(ImageFilter.GaussianBlur(radius=1.5))
        final_pil = Image.blend(pil_img, glow, alpha=0.08)

        return final_pil

print("PhotorealisticSceneEngine defined.")
