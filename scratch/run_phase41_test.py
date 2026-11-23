import sys
from pathlib import Path
from PIL import Image

sys.path.insert(0, ".")
sys.path.insert(0, "backend")

from scratch.render_phase41_prototype import Phase41PhotorealisticRenderer, layout
from app.services.design_generation.hybrid_geometry_renderer import HybridGeometryRenderer
from app.services.design_generation.geometry_reconstruction_service import PinholeCamera

out_dir = Path("outputs")
cam_a = PinholeCamera(position=(-4.5, 3.2, 4.2), target=(1.5, 1.0, -0.3), fov_degrees=82.0, width=768, height=768)
cam_b = PinholeCamera(position=(-3.8, 1.8, 2.4), target=(2.2, 1.2, -0.5), fov_degrees=76.0, width=768, height=768)
cam_c = PinholeCamera(position=(2.2, 1.8, 3.4), target=(4.8, 1.3, -0.4), fov_degrees=74.0, width=768, height=768)

print("Rendering test for View A...")
img_a = Phase41PhotorealisticRenderer.render(layout, cam_a, "view_a", 768, 768)
img_a.save("scratch/test_phase41_view_a.png")
print("Saved View A test render, size:", img_a.size)

enh_a = Phase41PhotorealisticRenderer.enhance_with_photographic_realism(img_a)
enh_a.save("scratch/test_phase41_view_a_enhanced.png")
print("Saved View A enhanced render")

print("Rendering test for View B...")
img_b = Phase41PhotorealisticRenderer.render(layout, cam_b, "view_b", 768, 768)
img_b.save("scratch/test_phase41_view_b.png")

print("Rendering test for View C...")
img_c = Phase41PhotorealisticRenderer.render(layout, cam_c, "view_c", 768, 768)
img_c.save("scratch/test_phase41_view_c.png")

print("Phase 4.1 test renders completed successfully!")
