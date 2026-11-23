from PIL import Image
import numpy as np

for name in ["design-master-f1489d7b_var_1.png", "design-master-66029eaf_var_1.png", "design-master-08af94dc_var_1.png"]:
    p = f"backend/outputs/designs/{name}"
    try:
        img = Image.open(p)
        arr = np.array(img)
        print(f"=== {name} ===")
        print(f"Size: {img.size}, Mode: {img.mode}, Std: {np.std(arr):.2f}, Mean: {np.mean(arr):.2f}")
    except Exception as e:
        print(f"Error reading {name}: {e}")
