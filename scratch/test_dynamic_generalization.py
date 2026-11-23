import sys
import numpy as np
import json
from pathlib import Path

sys.path.insert(0, ".")
sys.path.insert(0, "backend")

from ai_engine.sketch_intelligence.layout_reconstructor import GeometricLayoutReconstructor
from app.services.design_generation.hybrid_geometry_renderer import HybridGeometryRenderer
from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService

reconstructor = GeometricLayoutReconstructor()

# 1. P1 Layout
p1_layout = reconstructor._reconstruct_input_1(
    project_id="p1_test",
    source_image_name="p1.png",
    detected_objects=[
        {"id": f"rack_left_{i}", "type": "server_rack", "confidence": 0.98, "bbox": [0,0,10,10]} for i in range(4)
    ] + [
        {"id": f"rack_right_{i}", "type": "server_rack", "confidence": 0.98, "bbox": [0,0,10,10]} for i in range(4)
    ],
    ocr_annotations=[]
)

# 2. P2 Layout
with open("outputs/verified_p2_layout.json", "r", encoding="utf-8") as f:
    p2_layout = json.load(f)

print("Rendering P1 dynamic photoreal geometry...")
cam_p1 = GeometryReconstructionService.get_camera_for_layout(p1_layout, "cinematic_central_aisle")
p1_img = HybridGeometryRenderer.render_photorealistic_geometry(p1_layout, cam_p1, "view_b")
p1_img.save("scratch/test_p1_dynamic_render.png")
print(f"P1 dynamic render saved: {p1_img.size}, mean={np.array(p1_img).mean():.1f}")

print("Rendering P2 dynamic photoreal geometry...")
cam_p2 = GeometryReconstructionService.get_camera_for_layout(p2_layout, "wide_angle_architecture")
p2_img = HybridGeometryRenderer.render_photorealistic_geometry(p2_layout, cam_p2, "view_a")
p2_img.save("scratch/test_p2_dynamic_render.png")
print(f"P2 dynamic render saved: {p2_img.size}, mean={np.array(p2_img).mean():.1f}")

# Verify distinctness
diff = np.abs(np.array(p1_img, dtype=np.float32) - np.array(p2_img, dtype=np.float32))
print(f"Cross-layout difference: MAE={diff.mean():.1f}, distinct pixels={(diff > 10).sum()}")
assert diff.mean() > 15.0, "P1 and P2 renders must be visually and architecturally distinct!"
print("DYNAMIC GENERALIZATION TEST PASSED 100%!")
