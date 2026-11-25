"""
RackVision AI — Phase 5 Regenerate Deliverables & Verification Script
Authoritative regeneration of all 6 deliverables for P1 and P2 with strict geometry isolation.
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
from PIL import Image

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

def run_phase5_regeneration():
    print("=" * 80)
    print("RACKVISION AI — PHASE 5 DELIVERABLES REGENERATION")
    print("=" * 80)

    diag_dir = PROJECT_ROOT / "outputs" / "diagnostics"
    diag_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir = Path(r"C:\Users\kadal\.gemini\antigravity\brain\1ecb1371-8c6e-48a8-bb3d-7d465c396e68")

    # Locate source images
    p1_path = artifacts_dir / ".user_uploaded" / "media_1795611567394_1c881158.png"
    p2_path = artifacts_dir / ".user_uploaded" / "media_1795611575645_1b25a92c.jpg"

    if not p1_path.exists():
        raise FileNotFoundError(f"P1 input image not found at: {p1_path}")
    if not p2_path.exists():
        raise FileNotFoundError(f"P2 input image not found at: {p2_path}")

    # =========================================================================
    # PIPELINE 1: P1 COMPACT DATA CENTER
    # =========================================================================
    print("\n--- [PIPELINE 1: P1 COMPACT DATA CENTER] ---")
    p1_sha256 = compute_sha256(p1_path)
    print(f"P1 Source File: {p1_path.name} | SHA-256: {p1_sha256}")

    engine_p1 = SketchIntelligenceEngine()
    p1_result = engine_p1.analyze_sketch(
        image_path=str(p1_path),
        project_id="proj-p1-phase5-isolated",
        output_dir=str(diag_dir / "p1_trace")
    )
    p1_layout = p1_result["layout"]

    # 1. Save outputs/diagnostics/p1_extracted_layout.json
    p1_layout_path = diag_dir / "p1_extracted_layout.json"
    with open(p1_layout_path, "w", encoding="utf-8") as f:
        json.dump(p1_layout, f, indent=2)
    shutil.copy(str(p1_layout_path), str(artifacts_dir / "p1_extracted_layout.json"))
    print(f"[SAVED] {p1_layout_path} & brain artifact")

    # Compute P1 scene signature
    p1_scene_sig = GeometryReconstructionService.compute_scene_signature(p1_layout)
    print(f"P1 Scene Signature: {p1_scene_sig}")

    # Camera for P1: Central aisle symmetrical view
    cam_p1 = GeometryReconstructionService.get_camera_for_layout(p1_layout, "cinematic_central_aisle", 1024, 768)

    # 2. Render P1 Geometry Diagnostic
    p1_geom_img = HybridGeometryRenderer.render_geometry_preview(p1_layout, cam_p1, width=1024, height=768)
    p1_geom_diag_path = diag_dir / "p1_geometry_diagnostic.png"
    p1_geom_img.save(str(p1_geom_diag_path), "PNG")
    shutil.copy(str(p1_geom_diag_path), str(PROJECT_ROOT / "p1_geometry_diagnostic.png"))
    shutil.copy(str(p1_geom_diag_path), str(artifacts_dir / "p1_geometry_diagnostic.png"))
    print(f"[SAVED] {p1_geom_diag_path} (and root p1_geometry_diagnostic.png)")

    # 3. Render P1 Final Master
    p1_photoreal_raw = HybridGeometryRenderer.render_photorealistic_geometry(
        p1_layout, cam_p1, view_id="cinematic_central_aisle", width=1024, height=768, seed=42
    )
    p1_master_img = HybridGeometryRenderer.enhance_with_geometry_lock(p1_photoreal_raw, sdxl_diffusion_image=None)
    p1_master_path = diag_dir / "p1_final_master.png"
    p1_master_img.save(str(p1_master_path), "PNG")
    shutil.copy(str(p1_master_path), str(PROJECT_ROOT / "p1_final_master.png"))
    shutil.copy(str(p1_master_path), str(artifacts_dir / "p1_final_master.png"))
    print(f"[SAVED] {p1_master_path} (and root p1_final_master.png)")

    # =========================================================================
    # PIPELINE 2: P2 ENTERPRISE ARCHITECTURAL CAD DRAWING
    # =========================================================================
    print("\n--- [PIPELINE 2: P2 ENTERPRISE ARCHITECTURAL CAD DRAWING] ---")
    p2_sha256 = compute_sha256(p2_path)
    print(f"P2 Source File: {p2_path.name} | SHA-256: {p2_sha256}")

    engine_p2 = SketchIntelligenceEngine()
    p2_result = engine_p2.analyze_sketch(
        image_path=str(p2_path),
        project_id="proj-p2-phase5-isolated",
        output_dir=str(diag_dir / "p2_trace")
    )
    p2_layout = p2_result["layout"]

    # 1. Save outputs/diagnostics/p2_extracted_layout.json
    p2_layout_path = diag_dir / "p2_extracted_layout.json"
    with open(p2_layout_path, "w", encoding="utf-8") as f:
        json.dump(p2_layout, f, indent=2)
    shutil.copy(str(p2_layout_path), str(artifacts_dir / "p2_extracted_layout.json"))
    print(f"[SAVED] {p2_layout_path} & brain artifact")

    # Compute P2 scene signature
    p2_scene_sig = GeometryReconstructionService.compute_scene_signature(p2_layout)
    print(f"P2 Scene Signature: {p2_scene_sig}")

    # Camera for P2: Elevated wide-angle architectural overview exposing both server room & Technikspange
    cam_p2 = GeometryReconstructionService.get_camera_for_layout(p2_layout, "wide_angle_architecture", 1024, 768)

    # 2. Render P2 Geometry Diagnostic
    p2_geom_img = HybridGeometryRenderer.render_geometry_preview(p2_layout, cam_p2, width=1024, height=768)
    p2_geom_diag_path = diag_dir / "p2_geometry_diagnostic.png"
    p2_geom_img.save(str(p2_geom_diag_path), "PNG")
    shutil.copy(str(p2_geom_diag_path), str(PROJECT_ROOT / "p2_geometry_diagnostic.png"))
    shutil.copy(str(p2_geom_diag_path), str(artifacts_dir / "p2_geometry_diagnostic.png"))
    print(f"[SAVED] {p2_geom_diag_path} (and root p2_geometry_diagnostic.png)")

    # 3. Render P2 Final Master
    p2_photoreal_raw = HybridGeometryRenderer.render_photorealistic_geometry(
        p2_layout, cam_p2, view_id="wide_angle_architecture", width=1024, height=768, seed=42
    )
    p2_master_img = HybridGeometryRenderer.enhance_with_geometry_lock(p2_photoreal_raw, sdxl_diffusion_image=None)
    p2_master_path = diag_dir / "p2_final_master.png"
    p2_master_img.save(str(p2_master_path), "PNG")
    shutil.copy(str(p2_master_path), str(PROJECT_ROOT / "p2_final_master.png"))
    shutil.copy(str(p2_master_path), str(artifacts_dir / "p2_final_master.png"))
    print(f"[SAVED] {p2_master_path} (and root p2_final_master.png)")

    # =========================================================================
    # VERIFICATION & COMPARISON METRICS
    # =========================================================================
    print("\n--- [VERIFICATION & METRICS] ---")
    p1_geom_hash = compute_sha256(p1_geom_diag_path)
    p2_geom_hash = compute_sha256(p2_geom_diag_path)
    p1_master_hash = compute_sha256(p1_master_path)
    p2_master_hash = compute_sha256(p2_master_path)

    print(f"P1 Diagnostic SHA-256: {p1_geom_hash}")
    print(f"P2 Diagnostic SHA-256: {p2_geom_hash}")
    print(f"P1 Master SHA-256:     {p1_master_hash}")
    print(f"P2 Master SHA-256:     {p2_master_hash}")

    assert p1_geom_hash != p2_geom_hash, "P1 and P2 diagnostic image SHA-256 hashes must be distinct!"
    assert p1_master_hash != p2_master_hash, "P1 and P2 master render SHA-256 hashes must be distinct!"

    # Calculate pixel difference percentages
    p1_geom_arr = np.array(p1_geom_img)
    p2_geom_arr = np.array(p2_geom_img)
    geom_absdiff = cv2.absdiff(p1_geom_arr, p2_geom_arr)
    geom_diff_pixels = int(np.count_nonzero(geom_absdiff > 10))
    total_pixels = 1024 * 768 * 3
    geom_diff_pct = (geom_diff_pixels / total_pixels) * 100.0

    p1_master_arr = np.array(p1_master_img)
    p2_master_arr = np.array(p2_master_img)
    master_absdiff = cv2.absdiff(p1_master_arr, p2_master_arr)
    master_diff_pixels = int(np.count_nonzero(master_absdiff > 10))
    master_diff_pct = (master_diff_pixels / total_pixels) * 100.0

    print(f"Diagnostic Pixel Difference: {geom_diff_pct:.2f}% ({geom_diff_pixels:,} channel differences)")
    print(f"Master Render Pixel Difference: {master_diff_pct:.2f}% ({master_diff_pixels:,} channel differences)")

    print("\n[SUCCESS] All 6 Phase 5 deliverables regenerated and verified.")

if __name__ == "__main__":
    run_phase5_regeneration()
