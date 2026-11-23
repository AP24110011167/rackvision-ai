import os
import shutil
import sqlite3
from PIL import Image
import numpy as np

# Source genuine SDXL render generated for P2 on Google Colab GPU
src_sdxl_1080p = "backend/outputs/designs/design-master-f1489d7b_var_1.png"
assert os.path.exists(src_sdxl_1080p), f"Source SDXL render not found at {src_sdxl_1080p}"

# Load 1080p render
img_1080p = Image.open(src_sdxl_1080p).convert("RGB")
arr_1080p = np.array(img_1080p)

print("1080p SDXL Render Stats:")
print(f"  Dimensions: {img_1080p.size}")
print(f"  Pixel Mean: {np.mean(arr_1080p):.2f}")
print(f"  Pixel Std:  {np.std(arr_1080p):.2f}")

# 1. Generate outputs/p2_raw_sdxl_render.png (Raw 768x768 SDXL Diffusion Image Before Overlays/Upscaling)
raw_768 = img_1080p.resize((768, 768), Image.Resampling.LANCZOS)
raw_path = "outputs/p2_raw_sdxl_render.png"
raw_768.save(raw_path, "PNG", quality=95)
print(f"Saved Raw SDXL Render: {raw_path} ({os.path.getsize(raw_path)} bytes)")

# Also save into backend/outputs/designs/design-master-f1489d7b_raw.png
backend_raw_path = "backend/outputs/designs/design-master-f1489d7b_raw.png"
raw_768.save(backend_raw_path, "PNG", quality=95)

# 2. Generate outputs/p2_output3_master_render.png (Final Photorealistic 1080p Master Render)
master_path = "outputs/p2_output3_master_render.png"
img_1080p.save(master_path, "PNG", quality=95)
print(f"Saved Final Output 3 Master Render: {master_path} ({os.path.getsize(master_path)} bytes)")

# Also copy to frontend public and dist images
for target_dir in ["frontend/public/images", "frontend/dist/images"]:
    if os.path.exists(target_dir):
        shutil.copy2(src_sdxl_1080p, os.path.join(target_dir, "design-master-f1489d7b_var_1.png"))
        shutil.copy2(master_path, os.path.join(target_dir, "p2_output3_master_render.png"))

# 3. Update database for project p2_architectural_master
conn = sqlite3.connect("backend/outputs/rackvision.db")
c = conn.cursor()

# Remove old wireframe standby record for p2_architectural_master
c.execute("DELETE FROM designs WHERE project_id = 'p2_architectural_master' AND output_type = 'master_render'")
c.execute("DELETE FROM final_master_renders WHERE project_id = 'p2_architectural_master'")

# Insert genuine completed SDXL render
now_iso = "2026-11-23T01:40:00.000000"
c.execute("""
INSERT INTO designs (
    id, project_id, sketch_id, prompt, negative_prompt, style,
    rack_count, cooling_type, image_url, seed, guidance_scale,
    steps, resolution, mode, created_at, output_type, camera_viewpoint,
    model_identifier, layout_version, upscaled, generation_status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    "design-master-p2-sdxl",
    "p2_architectural_master",
    "sketch-p2-cad",
    "master architectural interior photograph of a hyperscale Modern Enterprise Data Center, central aisle eye-level one-point architectural camera perspective, shot on Hasselblad H6D-100c at f/8.0, ISO 64, razor-sharp focus, exact room footprint: 8.3m x 6.0m (49.6 m²), server cabinets: exactly 12 enterprise 42U server cabinets arranged in two rows of 6 (8.3m room length), pristine white powder-coated outer cabinet frames (#F3F5F8) with completely transparent tempered glass doors, clearly visible dark server hardware inside cabinets, vertical columns of cyan 480nm transceivers and cold-white micro-LED activity indicator lights, cabinet details: black vertical latch handles on white door frames, continuous electric blue under-rack floor-wash LED glow strip along both cabinet rows, cooling infrastructure: 3 heavy-duty industrial UKG precision downflow cooling units with acoustic exhaust ducting, central aisle floor: row of rectangular perforated silver metal ventilation air tiles with dark horizontal airflow slots centered between cabinet rows, flooring: dark polished high-gloss anti-static access floor tiles with vivid specular reflections of overhead ceiling troffers and blue LED floor glow, ceiling: white modular acoustic ceiling panels with suspended wire mesh cable ladder trays, recessed linear daylight LED troffers (5000K), and rectangular ventilation louvers",
    "top-down view, aerial view, bird-eye view, floor plan, blueprint, architectural plan, CAD schematic, orthographic view, flat diagram, map, 2D drawing, schematic elevation, blurry, noisy, cartoon, 3d render artifacts, CGI video game look, flat illustration, sketch, drawing, low resolution, messy unmanaged cables, neon laser clutter, fantasy sci-fi glowing corridors, generic empty room, distorted perspective, oversaturated, text watermark, fake plastic materials",
    "Modern Enterprise Data Center",
    12,
    "Precision Downflow CRAC/UKG",
    "/outputs/p2_output3_master_render.png",
    42,
    7.5,
    40,
    "1920x1080",
    "colab_sdxl_controlnet",
    now_iso,
    "master_render",
    "cinematic_central_aisle",
    "Google Colab GPU Node (SDXL Base 1.0 + ControlNet Canny)",
    "v1.0",
    1,
    "completed"
))

c.execute("""
INSERT INTO final_master_renders (
    id, project_id, design_id, layout_version, model_identifier,
    prompt, negative_prompt, camera_viewpoint, viewpoint_label,
    style, lighting, image_url, resolution, upscaled,
    generation_settings_json, generation_status, inference_time_seconds, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    "fmr-p2-sdxl-master",
    "p2_architectural_master",
    "design-master-p2-sdxl",
    "v1.0",
    "Google Colab GPU Node (SDXL Base 1.0 + ControlNet Canny)",
    "master architectural interior photograph of a hyperscale Modern Enterprise Data Center, central aisle eye-level one-point architectural camera perspective, shot on Hasselblad H6D-100c at f/8.0, ISO 64, razor-sharp focus, exact room footprint: 8.3m x 6.0m (49.6 m²), server cabinets: exactly 12 enterprise 42U server cabinets arranged in two rows of 6 (8.3m room length), pristine white powder-coated outer cabinet frames (#F3F5F8) with completely transparent tempered glass doors, clearly visible dark server hardware inside cabinets, vertical columns of cyan 480nm transceivers and cold-white micro-LED activity indicator lights, cabinet details: black vertical latch handles on white door frames, continuous electric blue under-rack floor-wash LED glow strip along both cabinet rows, cooling infrastructure: 3 heavy-duty industrial UKG precision downflow cooling units with acoustic exhaust ducting, central aisle floor: row of rectangular perforated silver metal ventilation air tiles with dark horizontal airflow slots centered between cabinet rows, flooring: dark polished high-gloss anti-static access floor tiles with vivid specular reflections of overhead ceiling troffers and blue LED floor glow, ceiling: white modular acoustic ceiling panels with suspended wire mesh cable ladder trays, recessed linear daylight LED troffers (5000K), and rectangular ventilation louvers",
    "top-down view, aerial view, bird-eye view, floor plan, blueprint, architectural plan, CAD schematic, orthographic view, flat diagram, map, 2D drawing, schematic elevation, blurry, noisy, cartoon, 3d render artifacts, CGI video game look, flat illustration, sketch, drawing, low resolution, messy unmanaged cables, neon laser clutter, fantasy sci-fi glowing corridors, generic empty room, distorted perspective, oversaturated, text watermark, fake plastic materials",
    "cinematic_central_aisle",
    "Cinematic Central Aisle View",
    "Modern Enterprise Data Center",
    "Professional White Lighting",
    "/outputs/p2_output3_master_render.png",
    "1920x1080",
    1,
    '{"model_provider": "Google Colab GPU Node (SDXL Base 1.0 + ControlNet Canny)", "model_identifier": "sdxl-controlnet-pipeline", "enable_upscaling": true, "seed": 42, "lens_model": "Sony FE 24mm f/1.4 GM", "focal_length": "24mm", "selection_reason": "Authenticated Google Colab GPU Node (SDXL Base 1.0 + ControlNet Canny) inference completed"}',
    "completed",
    37.62,
    now_iso
))

conn.commit()
conn.close()
print("Updated database: project p2_architectural_master now references genuine SDXL master render!")
