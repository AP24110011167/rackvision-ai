import sys
import numpy as np
import cv2
from PIL import Image, ImageFilter
from pathlib import Path

# Load Stage 2 photoreal geometry
p2_geom_a = np.array(Image.open("scratch/test_phase42_view_a.png"), dtype=np.float32)

# Load raw SDXL image
raw_a = Image.open("outputs/p2_view_a_elevated_overview_raw.png").resize((768, 768), Image.Resampling.LANCZOS)
raw_a_arr = np.array(raw_a, dtype=np.float32)

# Method 1: Phase 4.1 approach (high-pass detail only)
sdxl_blur = np.array(raw_a.filter(ImageFilter.GaussianBlur(radius=6.0)), dtype=np.float32)
detail_high = raw_a_arr - sdxl_blur
method1 = np.clip(p2_geom_a + detail_high * 0.30, 0, 255)

# Method 2: Luminance & Material Texture Transfer with Geometry Lock
# We want SDXL's realistic surface lighting and brushed metal micro-texture,
# but we lock the structural boundaries (edges) strictly to the 3D geometry.
geom_gray = cv2.cvtColor(np.uint8(p2_geom_a), cv2.COLOR_RGB2GRAY)
geom_edges = cv2.Canny(geom_gray, 50, 150)
edge_mask = cv2.dilate(geom_edges, np.ones((3, 3), np.uint8), iterations=1) / 255.0
edge_mask = edge_mask[:, :, np.newaxis] # 1 where edge, 0 where interior

# Multi-scale decomposition of SDXL
# Low-pass lighting
sdxl_lighting = cv2.GaussianBlur(raw_a_arr, (21, 21), 0)
# High-pass micro-texture
sdxl_micro = raw_a_arr - cv2.GaussianBlur(raw_a_arr, (5, 5), 0)

# Interior surface fusion: blend 35% of SDXL lighting and 40% of micro-texture onto geometry
surface_fused = p2_geom_a * 0.70 + sdxl_lighting * 0.30 + sdxl_micro * 0.40

# Geometry-lock: on edges, enforce 100% geometry render; on planar surfaces, use surface_fused
method2 = surface_fused * (1.0 - edge_mask * 0.85) + p2_geom_a * (edge_mask * 0.85)

# Filmic tone mapping
arr2 = np.clip(method2, 0, 255) / 255.0
gamma = 1.10
filmic2 = (arr2 ** gamma) / ((arr2 ** gamma) + ((1.0 - arr2) ** gamma) + 1e-6)
method2_final = np.uint8(np.clip(filmic2 * 255.0, 0, 255))

diff1 = np.abs(p2_geom_a - method1)
diff2 = np.abs(p2_geom_a - method2_final.astype(np.float32))

print(f"Method 1 (Phase 4.1): MAE={diff1.mean():.2f}, max_diff={diff1.max():.2f}, std_diff={diff1.std():.2f}")
print(f"Method 2 (Phase 4.2): MAE={diff2.mean():.2f}, max_diff={diff2.max():.2f}, std_diff={diff2.std():.2f}")

Image.fromarray(method2_final).save("scratch/test_phase42_view_a_enhanced.png")
