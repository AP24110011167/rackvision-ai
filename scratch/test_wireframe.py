import cv2
import numpy as np
from pathlib import Path

def generate_3d_wireframe(width=768, height=768, rack_count=8, has_ukg=False):
    canvas = np.zeros((height, width), dtype=np.uint8)

    # 1. Perspective Vanishing Point & Horizon
    vx = width // 2
    vy = int(height * 0.44)
    floor_y = int(height * 0.50)

    # Central cold aisle floor edges receding to vanishing point
    aisle_half_w = int(width * 0.16)
    cv2.line(canvas, (vx - aisle_half_w, height), (vx - 15, vy), 255, 2)
    cv2.line(canvas, (vx + aisle_half_w, height), (vx + 15, vy), 255, 2)

    # Raised access floor tile perspective grid lines
    for t_step in [0.15, 0.32, 0.50, 0.68, 0.85]:
        fy = int(floor_y + (height - floor_y) * (t_step ** 1.4))
        fw = int(aisle_half_w * 2 * (t_step ** 0.8))
        cv2.line(canvas, (vx - fw, fy), (vx + fw, fy), 180, 1)

    # Perforated airflow tile outlines in the central aisle
    for tile_t in [0.25, 0.45, 0.65, 0.85]:
        ty = int(floor_y + (height - floor_y) * (tile_t ** 1.3))
        th = int(height * 0.04 * tile_t)
        tw = int(width * 0.10 * tile_t)
        cv2.rectangle(canvas, (vx - tw, ty - th), (vx + tw, ty + th), 255, 1)
        # Internal grille hatch line
        cv2.line(canvas, (vx - tw + 4, ty), (vx + tw - 4, ty), 160, 1)

    # 2. Overhead Suspended Cable Ladder Trays & Ceiling Lights
    tray_left_x0 = vx - int(width * 0.32)
    tray_right_x0 = vx + int(width * 0.32)
    tray_y0 = int(height * 0.14)

    # Left and right cable tray rails
    cv2.line(canvas, (tray_left_x0, tray_y0), (vx - 25, vy - 20), 220, 2)
    cv2.line(canvas, (tray_left_x0 + 35, tray_y0), (vx - 10, vy - 20), 180, 1)
    cv2.line(canvas, (tray_right_x0, tray_y0), (vx + 25, vy - 20), 220, 2)
    cv2.line(canvas, (tray_right_x0 - 35, tray_y0), (vx + 10, vy - 20), 180, 1)

    # Cable tray cross rungs
    for r_step in [0.2, 0.4, 0.6, 0.8]:
        ry = int(vy - 20 + (tray_y0 - (vy - 20)) * r_step)
        rx_l1 = int(vx - 25 + (tray_left_x0 - (vx - 25)) * r_step)
        rx_l2 = int(vx - 10 + (tray_left_x0 + 35 - (vx - 10)) * r_step)
        cv2.line(canvas, (rx_l1, ry), (rx_l2, ry), 180, 1)

        rx_r1 = int(vx + 25 + (tray_right_x0 - (vx + 25)) * r_step)
        rx_r2 = int(vx + 10 + (tray_right_x0 - 35 - (vx + 10)) * r_step)
        cv2.line(canvas, (rx_r1, ry), (rx_r2, ry), 180, 1)

    # Recessed linear ceiling lighting troffers
    cv2.line(canvas, (vx - 60, 20), (vx - 8, vy - 35), 255, 1)
    cv2.line(canvas, (vx + 60, 20), (vx + 8, vy - 35), 255, 1)

    # 3. Symmetrical 3D Server Cabinets in Perspective
    racks_left = rack_count // 2
    racks_right = rack_count - racks_left

    for is_right, count in [(False, racks_left), (True, racks_right)]:
        sign = 1 if is_right else -1
        for i in range(count - 1, -1, -1):
            t_back = i / count
            t_front = (i + 1) / count

            sc_back = 0.38 + 0.62 * (t_back ** 1.3)
            sc_front = 0.38 + 0.62 * (t_front ** 1.3)

            base_y_b = int(floor_y + (height - floor_y) * 0.90 * sc_back)
            base_y_f = int(floor_y + (height - floor_y) * 0.90 * sc_front)

            rack_h_b = int(height * 0.54 * sc_back)
            rack_h_f = int(height * 0.54 * sc_front)

            top_y_b = base_y_b - rack_h_b
            top_y_f = base_y_f - rack_h_f

            aisle_m_b = int(aisle_half_w * sc_back)
            aisle_m_f = int(aisle_half_w * sc_front)

            rack_w_b = int(width * 0.17 * sc_back)
            rack_w_f = int(width * 0.17 * sc_front)

            ix_b = vx + sign * aisle_m_b
            ix_f = vx + sign * aisle_m_f
            ox_b = ix_b + sign * rack_w_b
            ox_f = ix_f + sign * rack_w_f

            # Front face rectangle (facing cold aisle)
            front_pts = np.array([[ix_f, top_y_f], [ox_f, top_y_f], [ox_f, base_y_f], [ix_f, base_y_f]], np.int32)
            cv2.polylines(canvas, [front_pts], isClosed=True, color=255, thickness=2)

            # Tempered glass door frame inset
            door_inset = max(2, int(8 * sc_front))
            door_pts = np.array([
                [ix_f + sign * door_inset, top_y_f + door_inset],
                [ox_f - sign * door_inset, top_y_f + door_inset],
                [ox_f - sign * door_inset, base_y_f - door_inset],
                [ix_f + sign * door_inset, base_y_f - door_inset]
            ], np.int32)
            cv2.polylines(canvas, [door_pts], isClosed=True, color=200, thickness=1)

            # Vertical door latch handle
            handle_x = ix_f + sign * (door_inset + max(2, int(4 * sc_front)))
            cv2.line(canvas, (handle_x, top_y_f + int(rack_h_f * 0.40)), (handle_x, top_y_f + int(rack_h_f * 0.60)), 255, 1)

            # Horizontal server blade slots
            num_blades = 7
            for b in range(1, num_blades):
                by = top_y_f + int((base_y_f - top_y_f) * (b / num_blades))
                cv2.line(canvas, (ix_f + sign * door_inset, by), (ox_f - sign * door_inset, by), 160, 1)

            # Side panel (receding into depth)
            side_pts = np.array([[ix_b, top_y_b], [ix_f, top_y_f], [ix_f, base_y_f], [ix_b, base_y_b]], np.int32)
            cv2.polylines(canvas, [side_pts], isClosed=True, color=220, thickness=1)

            # Top panel (receding into depth)
            top_pts = np.array([[ix_b, top_y_b], [ix_f, top_y_f], [ox_f, top_y_f], [ox_b, top_y_b]], np.int32)
            cv2.polylines(canvas, [top_pts], isClosed=True, color=220, thickness=1)

            # Under-rack plinth / LED strip base line
            cv2.line(canvas, (ix_f, base_y_f + 3), (ox_f, base_y_f + 3), 255, 1)

    # 4. Rear Wall Double Exit Doors
    door_w = int(width * 0.08)
    door_h = int(height * 0.16)
    door_top = vy - door_h // 2
    door_bottom = vy + door_h // 2
    cv2.rectangle(canvas, (vx - door_w, door_top), (vx + door_w, door_bottom), 255, 2)
    # Center seam
    cv2.line(canvas, (vx, door_top), (vx, door_bottom), 200, 1)
    # Glass vision panels in doors
    cv2.rectangle(canvas, (vx - door_w + 4, door_top + 8), (vx - 4, door_top + door_h // 2), 180, 1)
    cv2.rectangle(canvas, (vx + 4, door_top + 8), (vx + door_w - 4, door_top + door_h // 2), 180, 1)

    # 5. Cooling Infrastructure (CRAC / UKG Units) along Perimeter
    if has_ukg or rack_count >= 8:
        # Draw cooling unit outlines on the perimeter background
        unit_w = int(width * 0.09)
        unit_h = int(height * 0.28)
        unit_y = floor_y - int(unit_h * 0.4)
        for unit_x in [30, width - 30 - unit_w]:
            cv2.rectangle(canvas, (unit_x, unit_y), (unit_x + unit_w, unit_y + unit_h), 220, 2)
            # Intake louvers
            for l_idx in range(1, 6):
                ly = unit_y + l_idx * (unit_h // 7)
                cv2.line(canvas, (unit_x + 5, ly), (unit_x + unit_w - 5, ly), 160, 1)

    return canvas

img = generate_3d_wireframe(768, 768, rack_count=8, has_ukg=False)
out_file = Path("scratch/sample_3d_wireframe.png")
cv2.imwrite(str(out_file), img)
print("Generated sample 3D wireframe:", out_file, "size:", img.shape, "non-zero pixels:", cv2.countNonZero(img))
