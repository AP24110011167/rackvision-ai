from PIL import Image
import numpy as np
from pathlib import Path

out_dir = Path("outputs")
image_files = [
    "p2_view_a_elevated_overview_canny.png",
    "p2_view_a_elevated_overview_raw.png",
    "p2_view_a_elevated_overview_master.png",
    "p2_view_b_server_room_canny.png",
    "p2_view_b_server_room_raw.png",
    "p2_view_b_server_room_master.png",
    "p2_view_c_technical_area_canny.png",
    "p2_view_c_technical_area_raw.png",
    "p2_view_c_technical_area_master.png",
    "p2_perspective_conditioning_canny.png",
    "p2_raw_sdxl_render.png",
    "p2_output3_master_render.png"
]

print(f"{'Filename':<42} | {'Size':<12} | {'Mode':<5} | {'Mean':<6} | {'Std':<6} | {'Status'}")
print("-" * 85)

for fname in image_files:
    p = out_dir / fname
    if p.exists():
        im = Image.open(p)
        arr = np.array(im)
        mean_val = np.mean(arr)
        std_val = np.std(arr)
        status = "PASS" if (im.mode == "L" or (mean_val >= 30.0 and std_val >= 12.0)) else "FAIL"
        print(f"{fname:<42} | {str(im.size):<12} | {im.mode:<5} | {mean_val:<6.1f} | {std_val:<6.1f} | {status}")
    else:
        print(f"{fname:<42} | MISSING")
