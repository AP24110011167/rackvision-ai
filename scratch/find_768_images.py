import os
from PIL import Image

for root, dirs, files in os.walk("."):
    if any(x in root for x in [".git", "node_modules", "dist"]):
        continue
    for f in files:
        if f.endswith((".png", ".jpg", ".jpeg")):
            p = os.path.join(root, f)
            try:
                im = Image.open(p)
                if im.size == (768, 768) or "raw" in f.lower() or "sdxl" in f.lower() or "colab" in f.lower():
                    print(f"{p}: size={im.size}, mode={im.mode}")
            except Exception:
                pass
