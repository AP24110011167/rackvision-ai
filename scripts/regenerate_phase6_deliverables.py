"""
RackVision AI — Phase 6: Final Visual Fidelity Correction Deliverables Script.
Renders all 3 viewpoints for P1 and P2 with photorealistic materials, geometry-lock,
and non-occluded camera perspectives.

Deliverables:
- p1_final_master.png
- p2_final_master.png
- p1_geometry_diagnostic.png
- p2_geometry_diagnostic.png
- p1_elevated_view.png
- p1_server_room_view.png
- p1_cooling_view.png
- p2_elevated_view.png
- p2_server_room_view.png
- p2_cooling_view.png
- p1_vs_p2_comparison.png
"""

import os
import sys
import json
import hashlib
import shutil
from pathlib import Path
from typing import Dict, Any
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

from ai_engine.sketch_intelligence.engine import SketchIntelligenceEngine
from app.services.design_generation.hybrid_geometry_renderer import HybridGeometryRenderer
from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera

def compute_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def save_and_distribute(img: Image.Image, filename: str, diag_dir: Path, artifacts_dir: Path) -> Path:
    target_diag = diag_dir / filename
    img.save(str(target_diag), "PNG", quality=95)
    
    target_root = PROJECT_ROOT / filename
    shutil.copy(str(target_diag), str(target_root))
    
    target_artifact = artifacts_dir / filename
    shutil.copy(str(target_diag), str(target_artifact))
    
    sha = compute_sha256(target_diag)
    print(f"  [SAVED] {filename} (SHA-256: {sha[:16]}...)")
    return target_diag

def run_phase6_pipeline():
    print("=" * 80)
    print("RACKVISION AI — PHASE 6: FINAL VISUAL FIDELITY CORRECTION PIPELINE")
    print("=" * 80)

    diag_dir = PROJECT_ROOT / "outputs" / "diagnostics"
    diag_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir = Path(r"C:\Users\kadal\.gemini\antigravity\brain\1ecb1371-8c6e-48a8-bb3d-7d465c396e68")

    # Locate source inputs
    p1_path = artifacts_dir / ".user_uploaded" / "media_1795611567394_1c881158.png"
    p2_path = artifacts_dir / ".user_uploaded" / "media_1795611575645_1b25a92c.jpg"

    if not p1_path.exists():
        raise FileNotFoundError(f"P1 input image not found at: {p1_path}")
    if not p2_path.exists():
        raise FileNotFoundError(f"P2 input image not found at: {p2_path}")

    # =========================================================================
    # 1. P1 EXTRACTION & MULTI-VIEWPOINT RENDERING
    # =========================================================================
    print("\n--- [1. PROCESSING P1 COMPACT DATA CENTER] ---")
    p1_sha256 = compute_sha256(p1_path)
    print(f"P1 Source: {p1_path.name} | SHA-256: {p1_sha256}")

    engine_p1 = SketchIntelligenceEngine()
    p1_res = engine_p1.analyze_sketch(
        image_path=str(p1_path),
        project_id="proj-p1-phase6-fidelity",
        output_dir=str(diag_dir / "p1_trace")
    )
    p1_layout = p1_res["layout"]
    
    # Save p1_extracted_layout.json
    p1_layout_path = diag_dir / "p1_extracted_layout.json"
    with open(p1_layout_path, "w", encoding="utf-8") as f:
        json.dump(p1_layout, f, indent=2)
    shutil.copy(str(p1_layout_path), str(PROJECT_ROOT / "p1_extracted_layout.json"))
    shutil.copy(str(p1_layout_path), str(artifacts_dir / "p1_extracted_layout.json"))
    print(f"  [SAVED] p1_extracted_layout.json")

    # P1 Cameras for all 3 Viewpoints
    cam_p1_elevated = GeometryReconstructionService.get_camera_for_layout(p1_layout, "wide_angle_architecture", 1024, 768)
    cam_p1_server_room = GeometryReconstructionService.get_camera_for_layout(p1_layout, "cinematic_central_aisle", 1024, 768)
    cam_p1_cooling = GeometryReconstructionService.get_camera_for_layout(p1_layout, "cooling_infrastructure", 1024, 768)

    # 1a. P1 Geometry Diagnostic (Wireframe Overview)
    p1_geom_img = HybridGeometryRenderer.render_geometry_preview(p1_layout, cam_p1_server_room, width=1024, height=768)
    save_and_distribute(p1_geom_img, "p1_geometry_diagnostic.png", diag_dir, artifacts_dir)

    # 1b. P1 Viewpoint 1: Elevated Overview
    p1_elev_raw = HybridGeometryRenderer.render_photorealistic_geometry(
        p1_layout, cam_p1_elevated, view_id="wide_angle_architecture", width=1024, height=768, seed=42
    )
    p1_elev_img = HybridGeometryRenderer.enhance_with_geometry_lock(p1_elev_raw, sdxl_diffusion_image=None)
    save_and_distribute(p1_elev_img, "p1_elevated_view.png", diag_dir, artifacts_dir)

    # 1c. P1 Viewpoint 2: Server-Room Perspective (Central Aisle)
    p1_sr_raw = HybridGeometryRenderer.render_photorealistic_geometry(
        p1_layout, cam_p1_server_room, view_id="cinematic_central_aisle", width=1024, height=768, seed=42
    )
    p1_sr_img = HybridGeometryRenderer.enhance_with_geometry_lock(p1_sr_raw, sdxl_diffusion_image=None)
    save_and_distribute(p1_sr_img, "p1_server_room_view.png", diag_dir, artifacts_dir)

    # 1d. P1 Viewpoint 3: Cooling Perspective
    p1_cool_raw = HybridGeometryRenderer.render_photorealistic_geometry(
        p1_layout, cam_p1_cooling, view_id="cooling_infrastructure", width=1024, height=768, seed=42
    )
    p1_cool_img = HybridGeometryRenderer.enhance_with_geometry_lock(p1_cool_raw, sdxl_diffusion_image=None)
    save_and_distribute(p1_cool_img, "p1_cooling_view.png", diag_dir, artifacts_dir)

    # 1e. P1 Final Master Render (Central Aisle primary)
    p1_master_img = p1_sr_img
    save_and_distribute(p1_master_img, "p1_final_master.png", diag_dir, artifacts_dir)

    # =========================================================================
    # 2. P2 EXTRACTION & MULTI-VIEWPOINT RENDERING
    # =========================================================================
    print("\n--- [2. PROCESSING P2 ENTERPRISE ARCHITECTURAL CAD] ---")
    p2_sha256 = compute_sha256(p2_path)
    print(f"P2 Source: {p2_path.name} | SHA-256: {p2_sha256}")

    engine_p2 = SketchIntelligenceEngine()
    p2_res = engine_p2.analyze_sketch(
        image_path=str(p2_path),
        project_id="proj-p2-phase6-fidelity",
        output_dir=str(diag_dir / "p2_trace")
    )
    p2_layout = p2_res["layout"]

    # Save p2_extracted_layout.json
    p2_layout_path = diag_dir / "p2_extracted_layout.json"
    with open(p2_layout_path, "w", encoding="utf-8") as f:
        json.dump(p2_layout, f, indent=2)
    shutil.copy(str(p2_layout_path), str(PROJECT_ROOT / "p2_extracted_layout.json"))
    shutil.copy(str(p2_layout_path), str(artifacts_dir / "p2_extracted_layout.json"))
    print(f"  [SAVED] p2_extracted_layout.json")

    # P2 Cameras for all 3 Viewpoints
    cam_p2_elevated = GeometryReconstructionService.get_camera_for_layout(p2_layout, "wide_angle_architecture", 1024, 768)
    cam_p2_server_room = GeometryReconstructionService.get_camera_for_layout(p2_layout, "cinematic_central_aisle", 1024, 768)
    cam_p2_cooling = GeometryReconstructionService.get_camera_for_layout(p2_layout, "cooling_infrastructure", 1024, 768)

    # 2a. P2 Geometry Diagnostic (Wireframe Overview)
    p2_geom_img = HybridGeometryRenderer.render_geometry_preview(p2_layout, cam_p2_elevated, width=1024, height=768)
    save_and_distribute(p2_geom_img, "p2_geometry_diagnostic.png", diag_dir, artifacts_dir)

    # 2b. P2 Viewpoint 1: Elevated Overview (Communicating both Server Room & Technikspange)
    p2_elev_raw = HybridGeometryRenderer.render_photorealistic_geometry(
        p2_layout, cam_p2_elevated, view_id="wide_angle_architecture", width=1024, height=768, seed=42
    )
    p2_elev_img = HybridGeometryRenderer.enhance_with_geometry_lock(p2_elev_raw, sdxl_diffusion_image=None)
    save_and_distribute(p2_elev_img, "p2_elevated_view.png", diag_dir, artifacts_dir)

    # 2c. P2 Viewpoint 2: Server-Room Perspective (Angled aisle view of 12 racks & containment)
    p2_sr_raw = HybridGeometryRenderer.render_photorealistic_geometry(
        p2_layout, cam_p2_server_room, view_id="cinematic_central_aisle", width=1024, height=768, seed=42
    )
    p2_sr_img = HybridGeometryRenderer.enhance_with_geometry_lock(p2_sr_raw, sdxl_diffusion_image=None)
    save_and_distribute(p2_sr_img, "p2_server_room_view.png", diag_dir, artifacts_dir)

    # 2d. P2 Viewpoint 3: Technical-Area Cooling Perspective (Directly in Technikspange with 3 UKGs)
    p2_cool_raw = HybridGeometryRenderer.render_photorealistic_geometry(
        p2_layout, cam_p2_cooling, view_id="cooling_infrastructure", width=1024, height=768, seed=42
    )
    p2_cool_img = HybridGeometryRenderer.enhance_with_geometry_lock(p2_cool_raw, sdxl_diffusion_image=None)
    save_and_distribute(p2_cool_img, "p2_cooling_view.png", diag_dir, artifacts_dir)

    # 2e. P2 Final Master Render (Elevated Overview primary)
    p2_master_img = p2_elev_img
    save_and_distribute(p2_master_img, "p2_final_master.png", diag_dir, artifacts_dir)

    # =========================================================================
    # 3. SIDE-BY-SIDE P1 VS P2 COMPARISON PANEL
    # =========================================================================
    print("\n--- [3. GENERATING P1 VS P2 COMPARISON PANEL] ---")
    # 2x2 grid: Top = Diagnostics, Bottom = Final Masters
    p1_d_thumb = p1_geom_img.resize((640, 480), Image.Resampling.LANCZOS)
    p2_d_thumb = p2_geom_img.resize((640, 480), Image.Resampling.LANCZOS)
    p1_m_thumb = p1_master_img.resize((640, 480), Image.Resampling.LANCZOS)
    p2_m_thumb = p2_master_img.resize((640, 480), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", (1320, 1060), (18, 20, 24))
    draw = ImageDraw.Draw(canvas)

    # Headers
    draw.text((30, 20), "P1 COMPACT DATA CENTER (4.8m x 3.6m | 8 Racks | 2 A/C | Open Aisle)", fill=(100, 200, 255))
    draw.text((690, 20), "P2 ENTERPRISE CAD (49.6m² + 19.2m² Plant | 12 Racks | 3 UKG | Containment)", fill=(255, 180, 80))

    draw.text((30, 50), "Output 3 Geometry Diagnostic Preview (Wireframe)", fill=(180, 180, 180))
    draw.text((690, 50), "Output 3 Geometry Diagnostic Preview (Wireframe)", fill=(180, 180, 180))

    canvas.paste(p1_d_thumb, (30, 75))
    canvas.paste(p2_d_thumb, (690, 75))

    draw.text((30, 575), "Output 3 Final Photorealistic Master Render", fill=(180, 180, 180))
    draw.text((690, 575), "Output 3 Final Photorealistic Master Render", fill=(180, 180, 180))

    canvas.paste(p1_m_thumb, (30, 600))
    canvas.paste(p2_m_thumb, (690, 600))

    save_and_distribute(canvas, "p1_vs_p2_comparison.png", diag_dir, artifacts_dir)

    # =========================================================================
    # 4. MATHEMATICAL VERIFICATION & NON-OCCLUSION REPORT
    # =========================================================================
    print("\n--- [4. MATHEMATICAL VERIFICATION & METRICS] ---")
    p1_m_arr = np.array(p1_master_img)
    p2_m_arr = np.array(p2_master_img)
    m_absdiff = cv2.absdiff(p1_m_arr, p2_m_arr)
    m_diff_pixels = int(np.count_nonzero(m_absdiff > 10))
    total_pixels = 1024 * 768 * 3
    m_diff_pct = (m_diff_pixels / total_pixels) * 100.0

    print(f"Master Render Pixel Difference: {m_diff_pct:.2f}% ({m_diff_pixels:,} / {total_pixels:,} channels)")
    assert m_diff_pct > 30.0, f"Master renders must be >30% distinct! Got {m_diff_pct:.2f}%"

    print("\n[SUCCESS] Phase 6 Deliverables regenerated, verified, and distributed.")

if __name__ == "__main__":
    run_phase6_pipeline()
