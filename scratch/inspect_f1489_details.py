from PIL import Image
import numpy as np

img = Image.open("backend/outputs/designs/design-master-f1489d7b_var_1.png")
print("Image size:", img.size)
print("Image format:", img.format)
print("Image mode:", img.mode)

# Check lower right where watermark badge is stamped:
# Badge is at:
# bw, bh = 460, 48
# bx1 = w - bw - 24
# by1 = h - bh - 24
w, h = img.size
badge_area = img.crop((w - 500, h - 80, w, h))
print("Badge area size:", badge_area.size)

# Check center of image (pure SDXL output):
center_area = img.crop((w//4, h//4, 3*w//4, 3*h//4))
arr_center = np.array(center_area)
print("Center area mean:", np.mean(arr_center), "std:", np.std(arr_center))
