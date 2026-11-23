from PIL import Image
import numpy as np

img = Image.open("outputs/p2_raw_sdxl_render.png")
arr = np.array(img)
print("Image shape:", arr.shape)
print("Mean:", np.mean(arr), "Std:", np.std(arr))

# Let's inspect where features are in the image
# In an eye-level central corridor, the central aisle is in the middle columns [300:468],
# and the vanishing point is near (384, 384).
center_region = arr[300:500, 300:468]
print("Center region mean:", np.mean(center_region))
left_region = arr[200:600, 0:250]
print("Left region mean:", np.mean(left_region))
right_region = arr[200:600, 518:768]
print("Right region mean:", np.mean(right_region))
