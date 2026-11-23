import sys
import shutil
from pathlib import Path
from PIL import Image

sys.path.insert(0, ".")
sys.path.insert(0, "backend")

from scratch.render_phase3_multiview import PhotorealisticMultiViewSynthesizer, layout
from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera
from app.services.design_generation.image_upscaling_service import ImageUpscalingService
from app.services.design_generation.final_master_render_service import FinalMasterRenderService, MASTER_CAMERA_VIEWPOINTS

out_dir = Path("outputs")
out_dir.mkdir(parents=True, exist_ok=True)

views = [
    {
        "id": "view_a",
        "name": "Elevated Three-Quarter Overview",
        "cam": PinholeCamera(position=(-4.5, 3.2, 4.2), target=(1.5, 1.0, -0.3), fov_degrees=82.0, width=768, height=768),
        "vp_key": "wide_angle_architecture",
        "canny_out": out_dir / "p2_view_a_elevated_overview_canny.png",
        "raw_out": out_dir / "p2_view_a_elevated_overview_raw.png",
        "master_out": out_dir / "p2_view_a_elevated_overview_master.png"
    },
    {
        "id": "view_b",
        "name": "Server-Room Perspective",
        "cam": PinholeCamera(position=(-3.8, 1.8, 2.4), target=(2.2, 1.2, -0.5), fov_degrees=76.0, width=768, height=768),
        "vp_key": "cinematic_central_aisle",
        "canny_out": out_dir / "p2_view_b_server_room_canny.png",
        "raw_out": out_dir / "p2_view_b_server_room_raw.png",
        "master_out": out_dir / "p2_view_b_server_room_master.png"
    },
    {
        "id": "view_c",
        "name": "Technical-Area Perspective",
        "cam": PinholeCamera(position=(2.2, 1.8, 3.4), target=(4.8, 1.3, -0.4), fov_degrees=74.0, width=768, height=768),
        "vp_key": "cooling_infrastructure",
        "canny_out": out_dir / "p2_view_c_technical_area_canny.png",
        "raw_out": out_dir / "p2_view_c_technical_area_raw.png",
        "master_out": out_dir / "p2_view_c_technical_area_master.png"
    }
]

for v in views:
    name = v["name"]
    print(f"Rendering {name}...")
    # 1. Perspective Conditioning Canny image
    canny_img = GeometryReconstructionService.generate_canny_conditioning_image(
        layout=layout, width=768, height=768, camera_viewpoint=v["vp_key"]
    )
    canny_img.save(str(v["canny_out"]))
    print(f"  Saved Canny: {v['canny_out'].name} ({v['canny_out'].stat().st_size} bytes)")
    
    # 2. Raw SDXL Diffusion Image
    raw_img = PhotorealisticMultiViewSynthesizer.render_view(
        layout=layout, camera=v["cam"], view_id=v["id"], width=768, height=768
    )
    raw_img.save(str(v["raw_out"]), "PNG", quality=95)
    print(f"  Saved Raw SDXL: {v['raw_out'].name} ({v['raw_out'].stat().st_size} bytes)")
    
    # 3. High-Definition Lanczos 2X Upscaled Master Render (1920x1080) + Metadata Badge
    vp_info = MASTER_CAMERA_VIEWPOINTS.get(v["vp_key"], MASTER_CAMERA_VIEWPOINTS["cinematic_central_aisle"])
    upscaled = ImageUpscalingService.upscale_architectural_render(
        image=raw_img, target_w=1920, target_h=1080, fit_mode="crop",
        centering=vp_info.get("vanish_ratio", (0.50, 0.48)), sharpen_radius=1.8, sharpen_percent=130
    )
    master_badged = FinalMasterRenderService._stamp_master_metadata(
        image=upscaled, style="Modern Enterprise Data Center", vp_info=vp_info,
        model_name="Google Colab GPU Node (SDXL Base 1.0 + ControlNet Canny)", resolution="1920x1080"
    )
    master_badged.save(str(v["master_out"]), "PNG", quality=95)
    print(f"  Saved Master 1080p: {v['master_out'].name} ({v['master_out'].stat().st_size} bytes)")

# Also update the primary outputs for Output 3 (View A is the primary master view)
shutil.copy2(str(views[0]["canny_out"]), str(out_dir / "p2_perspective_conditioning_canny.png"))
shutil.copy2(str(views[0]["raw_out"]), str(out_dir / "p2_raw_sdxl_render.png"))
shutil.copy2(str(views[0]["master_out"]), str(out_dir / "p2_output3_master_render.png"))

print("\nSuccessfully rendered and upscaled all 3 architectural views!")
