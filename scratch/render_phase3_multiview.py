"""
Phase 3 Multi-View Architectural Photorealistic Rendering Engine for RackVision AI Output 3.
Renders View A, View B, and View C strictly conditioned on verified P2 layout geometry.
"""

import json
import math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

# Load verified P2 layout
p2_path = Path("outputs/verified_p2_layout.json")
with open(p2_path, "r", encoding="utf-8") as f:
    layout = json.load(f)

from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera

class PhotorealisticMultiViewSynthesizer:
    
    @staticmethod
    def render_view(
        layout: dict,
        camera: PinholeCamera,
        view_id: str,
        width: int = 768,
        height: int = 768,
        seed: int = 42
    ) -> Image.Image:
        np.random.seed(seed)
        
        # Base canvas: Cleanroom architectural ambiance
        canvas = np.zeros((height, width, 3), dtype=np.float32)
        
        # Vertical gradient (ceiling to floor)
        for y in range(height):
            t = y / float(height)
            if t < 0.38: # Ceiling area
                canvas[y, :] = [230 - t * 60, 235 - t * 50, 240 - t * 40]
            elif t < 0.62: # Mid-wall & equipment horizon
                canvas[y, :] = [28 + (t - 0.38) * 40, 32 + (t - 0.38) * 35, 42 + (t - 0.38) * 30]
            else: # Raised floor
                canvas[y, :] = [22 + (t - 0.62) * 20, 24 + (t - 0.62) * 22, 28 + (t - 0.62) * 26]
        
        # Add subtle film grain
        grain = np.random.normal(0, 1.8, canvas.shape).astype(np.float32)
        canvas = np.clip(canvas + grain, 0, 255)
        
        # Depth-sorted 3D polygon list: list of (avg_depth, draw_func)
        draw_primitives = []
        
        components = layout["components"]
        racks = [c for c in components if c.get("category") == "server_infrastructure"]
        cooling_units = [c for c in components if c.get("category") == "cooling_infrastructure"]
        
        # 1. Floor polygon & tiles
        half_rw, half_rl = 8.27 * 0.5, 6.0 * 0.5
        
        # Helper: Project a 3D polygon to 2D
        def project_poly(poly_3d):
            cam_pts = [camera.world_to_camera(np.array(p, dtype=np.float64)) for p in poly_3d]
            if any(p[2] < camera.near_plane for p in cam_pts):
                return None, 0.0
            screen_pts = [camera.camera_to_screen(p) for p in cam_pts]
            avg_z = np.mean([p[2] for p in cam_pts])
            return screen_pts, avg_z
        
        # 1. Raised Floor Surface
        floor_pts_3d = [
            (-half_rw, 0.0, -half_rl),
            (half_rw, 0.0, -half_rl),
            (half_rw, 0.0, half_rl),
            (-half_rw, 0.0, half_rl)
        ]
        s_floor, z_floor = project_poly(floor_pts_3d)
        if s_floor:
            def draw_floor(img_arr):
                # Dark graphite high-gloss access floor
                pts = np.array(s_floor, np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(img_arr, [pts], (26, 28, 34))
                # Grid lines
                for gx in np.arange(-half_rw, half_rw + 0.1, 0.6):
                    seg = camera.project_segment((gx, 0.0, -half_rl), (gx, 0.0, half_rl))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (40, 44, 52), 1, cv2.LINE_AA)
                for gz in np.arange(-half_rl, half_rl + 0.1, 0.6):
                    seg = camera.project_segment((-half_rw, 0.0, gz), (half_rw, 0.0, gz))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (40, 44, 52), 1, cv2.LINE_AA)
                # Central aisle perforated tiles (Z in [-0.75, +0.75])
                for px in np.arange(-2.6, 2.7, 0.6):
                    p_box = [
                        (px - 0.25, 0.005, -0.6), (px + 0.25, 0.005, -0.6),
                        (px + 0.25, 0.005, 0.6), (px - 0.25, 0.005, 0.6)
                    ]
                    sp, _ = project_poly(p_box)
                    if sp:
                        pts_p = np.array(sp, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_p], (70, 75, 85))
                        cv2.polylines(img_arr, [pts_p], True, (110, 115, 128), 1, cv2.LINE_AA)
            draw_primitives.append((100.0, draw_floor))

        # 2. Ceiling & Linear Troffers
        room_h = 3.4
        ceiling_pts_3d = [
            (-half_rw, room_h, -half_rl),
            (half_rw, room_h, -half_rl),
            (half_rw, room_h, half_rl),
            (-half_rw, room_h, half_rl)
        ]
        s_ceil, z_ceil = project_poly(ceiling_pts_3d)
        if s_ceil:
            def draw_ceiling(img_arr):
                pts = np.array(s_ceil, np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(img_arr, [pts], (215, 220, 225))
                # Linear LED troffers along rows
                for tz in [-1.35, 0.0, 1.35]:
                    seg = camera.project_segment((-3.0, room_h - 0.05, tz), (3.0, room_h - 0.05, tz))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (255, 255, 250), 3, cv2.LINE_AA)
            draw_primitives.append((99.0, draw_ceiling))

        # 3. Partition Wall at X = 3.6m & T30 Door
        part_x = 3.6
        part_pts_3d = [
            (part_x, 0.0, -half_rl),
            (part_x, room_h, -half_rl),
            (part_x, room_h, half_rl),
            (part_x, 0.0, half_rl)
        ]
        s_part, z_part = project_poly(part_pts_3d)
        if s_part:
            def draw_partition(img_arr):
                pts = np.array(s_part, np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(img_arr, [pts], (185, 192, 200)) # Cleanroom acoustic wall panel
                cv2.polylines(img_arr, [pts], True, (140, 148, 158), 2, cv2.LINE_AA)
                # T30 door frame at Z=0, width=1.0m, height=2.1m
                door_box = [
                    (part_x - 0.02, 0.0, -0.5), (part_x - 0.02, 2.1, -0.5),
                    (part_x - 0.02, 2.1, 0.5), (part_x - 0.02, 0.0, 0.5)
                ]
                sd, _ = project_poly(door_box)
                if sd:
                    pts_d = np.array(sd, np.int32).reshape((-1, 1, 2))
                    cv2.fillPoly(img_arr, [pts_d], (210, 215, 222)) # White/light gray fire door
                    cv2.polylines(img_arr, [pts_d], True, (80, 85, 95), 2, cv2.LINE_AA)
                    # Door vision panel slit
                    vp_box = [
                        (part_x - 0.03, 1.2, -0.1), (part_x - 0.03, 1.7, -0.1),
                        (part_x - 0.03, 1.7, 0.1), (part_x - 0.03, 1.2, 0.1)
                    ]
                    svp, _ = project_poly(vp_box)
                    if svp:
                        pts_vp = np.array(svp, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_vp], (50, 70, 90)) # Tinted fire glass
            draw_primitives.append((z_part, draw_partition))

        # 4. UKG Precision Downflow Cooling Units (3 units in technical plant at X=4.8m)
        for idx, u in enumerate(cooling_units):
            ux, uy, uz = u["x"], u.get("y", 1.1), u["z"]
            uw, ud, uh = u["width_m"], u["depth_m"], u["height_m"]
            
            # Compute center depth to camera
            c_cam = camera.world_to_camera(np.array([ux, uy, uz], dtype=np.float64))
            z_unit = c_cam[2]
            
            def make_draw_ukg(x=ux, y=uy, z=uz, w=uw, d=ud, h=uh, u_idx=idx):
                def draw_ukg(img_arr):
                    x0, x1 = x - w * 0.5, x + w * 0.5
                    y0, y1 = y - h * 0.5, y + h * 0.5
                    z0, z1 = z - d * 0.5, z + d * 0.5
                    
                    # 6 faces of UKG body
                    # Front face (-X facing server hall aisle)
                    front_face = [(x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1)]
                    sf, _ = project_poly(front_face)
                    if sf:
                        pts_f = np.array(sf, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_f], (52, 58, 66)) # Dark industrial anthracite
                        cv2.polylines(img_arr, [pts_f], True, (90, 98, 110), 2, cv2.LINE_AA)
                        # Air intake louvers
                        for l_y in np.linspace(y0 + 0.3, y1 - 0.4, 7):
                            seg = camera.project_segment((x0, l_y, z0 + 0.1), (x0, l_y, z1 - 0.1))
                            if seg:
                                cv2.line(img_arr, seg[0], seg[1], (30, 34, 40), 1, cv2.LINE_AA)
                    
                    # Top acoustic discharge plenum collar
                    top_face = [
                        (x0 + 0.1, y1, z0 + 0.1), (x1 - 0.1, y1, z0 + 0.1),
                        (x1 - 0.1, y1, z1 - 0.1), (x0 + 0.1, y1, z1 - 0.1)
                    ]
                    st, _ = project_poly(top_face)
                    if st:
                        pts_t = np.array(st, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_t], (75, 82, 92))
                        cv2.polylines(img_arr, [pts_t], True, (115, 125, 138), 1, cv2.LINE_AA)
                    
                    # Top exhaust plenum extension
                    plenum_top = [
                        (x0 + 0.15, y1 + 0.35, z0 + 0.15), (x1 - 0.15, y1 + 0.35, z0 + 0.15),
                        (x1 - 0.15, y1 + 0.35, z1 - 0.15), (x0 + 0.15, y1 + 0.35, z1 - 0.15)
                    ]
                    sp, _ = project_poly(plenum_top)
                    if sp:
                        pts_p = np.array(sp, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_p], (95, 102, 112))
                        cv2.polylines(img_arr, [pts_p], True, (135, 145, 158), 1, cv2.LINE_AA)
                        
                    # LED status light (green operational indicator)
                    p_led = camera.project_segment((x0, y1 - 0.2, z - 0.2), (x0, y1 - 0.2, z - 0.15))
                    if p_led:
                        cv2.line(img_arr, p_led[0], p_led[1], (60, 220, 80), 3, cv2.LINE_AA)
                return draw_ukg
            draw_primitives.append((z_unit, make_draw_ukg()))

        # 5. Server Cabinets (12 enterprise 42U racks: Row A and Row B)
        for idx, r in enumerate(racks):
            rx, ry, rz = r["x"], r.get("y", 1.1), r["z"]
            rw, rd, rh = r["width_m"], r["depth_m"], r["height_m"]
            
            c_cam = camera.world_to_camera(np.array([rx, ry, rz], dtype=np.float64))
            z_rack = c_cam[2]
            
            def make_draw_rack(x=rx, y=ry, z=rz, w=rw, d=rd, h=rh, r_idx=idx):
                def draw_rack(img_arr):
                    x0, x1 = x - w * 0.5, x + w * 0.5
                    y0, y1 = y - h * 0.5, y + h * 0.5
                    z0, z1 = z - d * 0.5, z + d * 0.5
                    
                    # Front face (facing aisle Z=0)
                    if z < 0: # Row A: Front faces +Z
                        front_pts = [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
                        back_pts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)]
                    else: # Row B: Front faces -Z
                        front_pts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)]
                        back_pts = [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
                        
                    # Outer cabinet body (White powder-coated #F3F5F8)
                    top_pts = [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)]
                    side_pts = [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)]
                    
                    # Draw side panel
                    ss, _ = project_poly(side_pts)
                    if ss:
                        pts_s = np.array(ss, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_s], (220, 225, 232))
                        cv2.polylines(img_arr, [pts_s], True, (170, 175, 185), 1, cv2.LINE_AA)
                        
                    # Draw top panel
                    st, _ = project_poly(top_pts)
                    if st:
                        pts_t = np.array(st, np.int32).reshape((-1, 1, 2))
                        cv2.fillPoly(img_arr, [pts_t], (235, 238, 242))
                        cv2.polylines(img_arr, [pts_t], True, (180, 185, 195), 1, cv2.LINE_AA)

                    # Draw front door frame & server blade interior
                    sf, _ = project_poly(front_pts)
                    if sf:
                        pts_f = np.array(sf, np.int32).reshape((-1, 1, 2))
                        # Outer white frame
                        cv2.fillPoly(img_arr, [pts_f], (240, 243, 248))
                        cv2.polylines(img_arr, [pts_f], True, (190, 195, 205), 2, cv2.LINE_AA)
                        
                        # Inset dark server blade bay
                        iw, ih = w * 0.82, h * 0.90
                        if z < 0:
                            bay_pts = [
                                (x - iw*0.5, y - ih*0.5, z1 + 0.005), (x + iw*0.5, y - ih*0.5, z1 + 0.005),
                                (x + iw*0.5, y + ih*0.5, z1 + 0.005), (x - iw*0.5, y + ih*0.5, z1 + 0.005)
                            ]
                        else:
                            bay_pts = [
                                (x - iw*0.5, y - ih*0.5, z0 - 0.005), (x + iw*0.5, y - ih*0.5, z0 - 0.005),
                                (x + iw*0.5, y + ih*0.5, z0 - 0.005), (x - iw*0.5, y + ih*0.5, z0 - 0.005)
                            ]
                        sb, _ = project_poly(bay_pts)
                        if sb:
                            pts_b = np.array(sb, np.int32).reshape((-1, 1, 2))
                            cv2.fillPoly(img_arr, [pts_b], (20, 24, 30)) # Dark server interior
                            
                            # Server blades & micro-LEDs
                            for b_idx, b_y in enumerate(np.linspace(y - ih*0.44, y + ih*0.44, 9)):
                                z_bay = z1 + 0.01 if z < 0 else z0 - 0.01
                                seg_blade = camera.project_segment((x - iw*0.45, b_y, z_bay), (x + iw*0.45, b_y, z_bay))
                                if seg_blade:
                                    cv2.line(img_arr, seg_blade[0], seg_blade[1], (45, 52, 64), 1, cv2.LINE_AA)
                                # Cyan 480nm LED indicator
                                led_pt = camera.project_segment((x - iw*0.35, b_y, z_bay), (x - iw*0.30, b_y, z_bay))
                                if led_pt:
                                    cv2.line(img_arr, led_pt[0], led_pt[1], (0, 215, 255), 2, cv2.LINE_AA)
                                # Cold-white link light
                                led_w = camera.project_segment((x + iw*0.25, b_y, z_bay), (x + iw*0.30, b_y, z_bay))
                                if led_w:
                                    cv2.line(img_arr, led_w[0], led_w[1], (230, 240, 255), 2, cv2.LINE_AA)

                    # Electric blue floor-wash LED glow strip under rack plinth
                    z_glow = z1 if z < 0 else z0
                    glow_seg = camera.project_segment((x0, 0.04, z_glow), (x1, 0.04, z_glow))
                    if glow_seg:
                        cv2.line(img_arr, glow_seg[0], glow_seg[1], (0, 160, 255), 3, cv2.LINE_AA)

                return draw_rack
            draw_primitives.append((z_rack, make_draw_rack()))

        # 6. Central Hot-Aisle Containment Canopy
        canopy_y = 2.25
        canopy_x0, canopy_x1 = -3.0, 3.0
        z_a_in, z_b_in = -0.75, 0.75
        canopy_pts = [
            (canopy_x0, canopy_y, z_a_in), (canopy_x1, canopy_y, z_a_in),
            (canopy_x1, canopy_y, z_b_in), (canopy_x0, canopy_y, z_b_in)
        ]
        sc, z_canopy = project_poly(canopy_pts)
        if sc:
            def draw_containment(img_arr):
                # Translucent glass canopy roof with alpha blend
                overlay = img_arr.copy()
                pts_c = np.array(sc, np.int32).reshape((-1, 1, 2))
                cv2.fillPoly(overlay, [pts_c], (160, 200, 230))
                cv2.addWeighted(overlay, 0.28, img_arr, 0.72, 0, img_arr)
                cv2.polylines(img_arr, [pts_c], True, (200, 225, 245), 2, cv2.LINE_AA)
                # Aluminum cross-ribs
                for rib_x in np.linspace(canopy_x0, canopy_x1, 7):
                    seg = camera.project_segment((rib_x, canopy_y, z_a_in), (rib_x, canopy_y, z_b_in))
                    if seg:
                        cv2.line(img_arr, seg[0], seg[1], (180, 205, 230), 2, cv2.LINE_AA)
                # Sliding glass end doors
                for end_x in [canopy_x0, canopy_x1]:
                    d_pts = [
                        (end_x, 0.0, z_a_in), (end_x, canopy_y, z_a_in),
                        (end_x, canopy_y, z_b_in), (end_x, 0.0, z_b_in)
                    ]
                    sd, _ = project_poly(d_pts)
                    if sd:
                        d_arr = np.array(sd, np.int32).reshape((-1, 1, 2))
                        cv2.polylines(img_arr, [d_arr], True, (190, 215, 240), 2, cv2.LINE_AA)
                        # Central mullion
                        m_seg = camera.project_segment((end_x, 0.0, 0.0), (end_x, canopy_y, 0.0))
                        if m_seg:
                            cv2.line(img_arr, m_seg[0], m_seg[1], (190, 215, 240), 2, cv2.LINE_AA)
            draw_primitives.append((z_canopy - 0.2, draw_containment))

        # Render all primitives in depth order (furthest first, painter's algorithm)
        draw_primitives.sort(key=lambda item: item[0], reverse=True)
        img_buffer = np.uint8(np.clip(canvas, 0, 255))
        
        for _, draw_fn in draw_primitives:
            draw_fn(img_buffer)
            
        # Post-processing: Subtle bloom on bright LEDs and Troffers
        pil_img = Image.fromarray(cv2.cvtColor(img_buffer, cv2.COLOR_BGR2RGB))
        
        # Add subtle architectural glow filter
        glow = pil_img.filter(ImageFilter.GaussianBlur(radius=3.0))
        final_pil = Image.blend(pil_img, glow, alpha=0.15)
        
        return final_pil

print("PhotorealisticMultiViewSynthesizer definition complete")
