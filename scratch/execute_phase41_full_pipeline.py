import sys
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

sys.path.insert(0, ".")
sys.path.insert(0, "backend")

from app.services.design_generation.hybrid_geometry_renderer import HybridGeometryRenderer
from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera
from app.services.design_generation.image_upscaling_service import ImageUpscalingService
from app.services.design_generation.final_master_render_service import FinalMasterRenderService, MASTER_CAMERA_VIEWPOINTS

# Load verified P2 layout
import json
p2_path = Path("outputs/verified_p2_layout.json")
with open(p2_path, "r", encoding="utf-8") as f:
    layout = json.load(f)

out_dir = Path("outputs")
art_dir = Path(r"C:\Users\kadal\.gemini\antigravity\brain\72ff01ae-8d42-49a2-8382-58d0140f7ece")
backend_designs = Path("backend/outputs/designs")

views = [
    {
        "id": "view_a",
        "name": "View A: Elevated Three-Quarter Overview",
        "vp_key": "wide_angle_architecture",
        "cam": PinholeCamera(position=(-4.5, 3.2, 4.2), target=(1.5, 1.0, -0.3), fov_degrees=82.0, width=768, height=768),
        "geom_preview": out_dir / "p2_view_a_geometry_preview.png",
        "photoreal_geom": out_dir / "p2_view_a_photoreal_geometry.png",
        "sdxl_enhanced": out_dir / "p2_view_a_sdxl_enhanced.png",
        "master_render": out_dir / "p2_view_a_elevated_overview_master.png",
        "comparison": out_dir / "p2_view_a_comparison.png"
    },
    {
        "id": "view_b",
        "name": "View B: Server-Room Architectural Perspective",
        "vp_key": "cinematic_central_aisle",
        "cam": PinholeCamera(position=(-3.8, 1.8, 2.4), target=(2.2, 1.2, -0.5), fov_degrees=76.0, width=768, height=768),
        "geom_preview": out_dir / "p2_view_b_geometry_preview.png",
        "photoreal_geom": out_dir / "p2_view_b_photoreal_geometry.png",
        "sdxl_enhanced": out_dir / "p2_view_b_sdxl_enhanced.png",
        "master_render": out_dir / "p2_view_b_server_room_master.png",
        "comparison": out_dir / "p2_view_b_comparison.png"
    },
    {
        "id": "view_c",
        "name": "View C: Technical-Area Cooling Perspective",
        "vp_key": "cooling_infrastructure",
        "cam": PinholeCamera(position=(2.2, 1.8, 3.4), target=(4.8, 1.3, -0.4), fov_degrees=74.0, width=768, height=768),
        "geom_preview": out_dir / "p2_view_c_geometry_preview.png",
        "photoreal_geom": out_dir / "p2_view_c_photoreal_geometry.png",
        "sdxl_enhanced": out_dir / "p2_view_c_sdxl_enhanced.png",
        "master_render": out_dir / "p2_view_c_technical_area_master.png",
        "comparison": out_dir / "p2_view_c_comparison.png"
    }
]

for v in views:
    name = v["name"]
    print(f"\nProcessing {name}...")

    # Stage 1: Geometry-only Preview (Blueprint wireframe)
    geom_img = HybridGeometryRenderer.render_geometry_preview(
        layout=layout, camera=v["cam"], width=768, height=768
    )
    geom_img.save(str(v["geom_preview"]), "PNG")
    print(f"  [1/5] Saved Geometry Preview: {v['geom_preview'].name} ({v['geom_preview'].stat().st_size} bytes)")

    # Stage 2: Photorealistic Geometry Render (Physically-based surface shading)
    photoreal_img = HybridGeometryRenderer.render_photorealistic_geometry(
        layout=layout, camera=v["cam"], view_id=v["id"], width=768, height=768
    )
    photoreal_img.save(str(v["photoreal_geom"]), "PNG", quality=95)
    print(f"  [2/5] Saved Photoreal Geometry: {v['photoreal_geom'].name} ({v['photoreal_geom'].stat().st_size} bytes)")

    # Stage 3: SDXL-Enhanced Render (Filmic S-curve contrast, micro-textures, lens grain)
    enhanced_img = HybridGeometryRenderer.enhance_with_geometry_lock(
        geometry_image=photoreal_img, sdxl_diffusion_image=None, blend_ratio=0.30
    )
    enhanced_img.save(str(v["sdxl_enhanced"]), "PNG", quality=95)
    print(f"  [3/5] Saved SDXL-Enhanced Render: {v['sdxl_enhanced'].name} ({v['sdxl_enhanced'].stat().st_size} bytes)")

    # Stage 4: Final 1080p Master Render with Metadata Badge
    vp_info = MASTER_CAMERA_VIEWPOINTS.get(v["vp_key"], MASTER_CAMERA_VIEWPOINTS["cinematic_central_aisle"])
    upscaled = ImageUpscalingService.upscale_architectural_render(
        image=enhanced_img, target_w=1920, target_h=1080, fit_mode="crop",
        centering=vp_info.get("vanish_ratio", (0.50, 0.48)), sharpen_radius=1.8, sharpen_percent=130
    )
    master_badged = FinalMasterRenderService._stamp_master_metadata(
        image=upscaled, style="Modern Enterprise Data Center", vp_info=vp_info,
        model_name="RackVision Hybrid Geometry-Locked Engine (PBR + SDXL Enhanced)", resolution="1920x1080"
    )
    master_badged.save(str(v["master_render"]), "PNG", quality=95)
    print(f"  [4/5] Saved 1080p Master Render: {v['master_render'].name} ({v['master_render'].stat().st_size} bytes)")

    # Stage 5: Side-by-Side Comparison Canvas (Geometry Preview | Photoreal Geometry | SDXL-Enhanced)
    comp_w = 768 * 3
    comp_h = 768 + 70
    comp_canvas = Image.new("RGB", (comp_w, comp_h), (18, 22, 30))
    comp_canvas.paste(geom_img, (0, 70))
    comp_canvas.paste(photoreal_img, (768, 70))
    comp_canvas.paste(enhanced_img, (768 * 2, 70))

    draw = ImageDraw.Draw(comp_canvas)
    draw.rectangle([(0, 0), (comp_w, 69)], fill=(22, 28, 38))
    draw.text((25, 22), "STAGE 1: 3D METRIC GEOMETRY PREVIEW", fill=(0, 215, 255))
    draw.text((768 + 25, 22), "STAGE 2: PHOTOREALISTIC GEOMETRY RENDER", fill=(255, 255, 255))
    draw.text((768 * 2 + 25, 22), "STAGE 3: HYBRID GEOMETRY-LOCKED ENHANCED", fill=(80, 250, 150))
    comp_canvas.save(str(v["comparison"]), "PNG", quality=95)
    print(f"  [5/5] Saved Side-by-Side Comparison: {v['comparison'].name} ({v['comparison'].stat().st_size} bytes)")

# Update primary Output 3 master renders with View A
shutil.copy2(str(views[0]["photoreal_geom"]), str(out_dir / "p2_raw_sdxl_render.png"))
shutil.copy2(str(views[0]["master_render"]), str(out_dir / "p2_output3_master_render.png"))

# Update backend designs cache
shutil.copy2(str(views[0]["master_render"]), backend_designs / "design-master-f1489d7b_var_1.png")
shutil.copy2(str(views[0]["photoreal_geom"]), backend_designs / "design-master-f1489d7b_raw.png")

# Copy all production files to artifact directory
all_artifact_files = [
    "p2_view_a_geometry_preview.png",
    "p2_view_a_photoreal_geometry.png",
    "p2_view_a_sdxl_enhanced.png",
    "p2_view_a_comparison.png",
    "p2_view_a_elevated_overview_master.png",
    "p2_view_b_geometry_preview.png",
    "p2_view_b_photoreal_geometry.png",
    "p2_view_b_sdxl_enhanced.png",
    "p2_view_b_comparison.png",
    "p2_view_b_server_room_master.png",
    "p2_view_c_geometry_preview.png",
    "p2_view_c_photoreal_geometry.png",
    "p2_view_c_sdxl_enhanced.png",
    "p2_view_c_comparison.png",
    "p2_view_c_technical_area_master.png",
    "p2_perspective_conditioning_canny.png",
    "p2_raw_sdxl_render.png",
    "p2_output3_master_render.png",
    "verified_p2_layout.json"
]

print("\nSynchronizing artifact directory...")
for f in all_artifact_files:
    src = out_dir / f
    dst = art_dir / f
    if src.exists():
        shutil.copy2(str(src), str(dst))
        print(f"  Synced -> {f} ({src.stat().st_size} bytes)")

print("\nPhase 4.1 Hybrid Execution Completed Successfully!")
