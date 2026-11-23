from PIL import Image
import numpy as np

img = Image.open("backend/outputs/designs/design-master-f1489d7b_var_1.png")
print("Dimensions:", img.size)
arr = np.array(img)
print("Stats: Min:", arr.min(), "Max:", arr.max(), "Mean:", arr.mean(), "Std:", arr.std())

# Let's save a 768x768 version representing the raw SDXL diffusion output
# The raw output from Colab is before Lanczos 2X upscaling
raw_768 = img.resize((768, 768), Image.Resampling.LANCZOS)
print("Raw 768 stats: Mean:", np.array(raw_768).mean(), "Std:", np.array(raw_768).std())
