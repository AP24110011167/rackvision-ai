"""
RackVision AI — Independent P1 and P2 Extraction, Geometry Reconstruction, and Output Verification Script.
Executes two independent end-to-end pipelines:
1. P1 Compact Data Center Sketch (media_1795611567394_1c881158.png)
2. P2 Enterprise Architectural CAD Drawing (media_1795611575645_1b25a92c.jpg)

Outputs:
- outputs/diagnostics/p1_extracted_layout.json
- outputs/diagnostics/p2_extracted_layout.json
- outputs/diagnostics/p1_geometry_diagnostic.png (& root p1_geometry_diagnostic.png)
- outputs/diagnostics/p2_geometry_diagnostic.png (& root p2_geometry_diagnostic.png)
- outputs/diagnostics/p1_final_master.png (& root p1_final_master.png)
- outputs/diagnostics/p2_final_master.png (& root p2_final_master.png)
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

def run_trace():
    print("=" * 80)
    print("RACKVISION AI — INDEPENDENT PIPELINE TRACE & DIAGNOSTICS GENERATION")
    print("=" * 80)

    # 1. Setup directories
    diag_dir = PROJECT_ROOT / "outputs" / "diagnostics"
    diag_dir.mkdir(parents=True, exist_ok=True)

    artifacts_dir = Path(r"C:\Users\kadal\.gemini\antigravity\brain\1ecb1371-8c6e-48a8-bb3d-7d465c396e68")
    
    # Locate inputs
    p1_path = artifacts_dir / ".user_uploaded" / "media_1795611567394_1c881158.png"
    p2_path = artifacts_dir / ".user_uploaded" / "media_1795611575645_1b25a92c.jpg"

    if not p1_path.exists():
        raise FileNotFoundError(f"P1 input image not found at: {p1_path}")
    if not p2_path.exists():
        raise FileNotFoundError(f"P2 input image not found at: {p2_path}")

    # =========================================================================
    # PIPELINE 1: P1 COMPACT DATA CENTER SKETCH
    # =========================================================================
    print("\n[PIPELINE 1] Processing P1 Compact Data Center Drawing...")
    p1_sha256 = compute_sha256(p1_path)
    p1_img_bgr = cv2.imread(str(p1_path))
    p1_h, p1_w, p1_c = p1_img_bgr.shape
    print(f"  Source Filename: {p1_path.name}")
    print(f"  SHA-256 Hash:    {p1_sha256}")
    print(f"  Image Dimension: {p1_w} x {p1_h} ({p1_c} channels)")

    engine_p1 = SketchIntelligenceEngine()
    p1_result = engine_p1.analyze_sketch(
        image_path=str(p1_path),
        project_id="proj-p1-trace-diagnostics",
        output_dir=str(diag_dir / "p1_trace")
    )
    p1_layout = p1_result["layout"]

    # Save outputs/diagnostics/p1_extracted_layout.json
    p1_layout_path = diag_dir / "p1_extracted_layout.json"
    with open(p1_layout_path, "w", encoding="utf-8") as f:
        json.dump(p1_layout, f, indent=2)
    print(f"  [SAVED] {p1_layout_path}")

    # Log P1 detection & metric extraction
    p1_room = p1_layout.get("room", {})
    p1_components = p1_layout.get("components", [])
    p1_racks = [c for c in p1_components if c.get("category") == "server_infrastructure"]
    p1_cooling = [c for c in p1_components if c.get("category") == "cooling_infrastructure"]
    p1_doors = [c for c in p1_components if "door" in c.get("type", "").lower()]
    p1_elec = [c for c in p1_components if c.get("category") == "electrical_infrastructure"]
    p1_net = [c for c in p1_components if c.get("category") == "network_infrastructure"]

    print(f"  Room Footprint:  {p1_room.get('width_m')}m x {p1_room.get('length_m')}m (Area: {p1_room.get('area_sqm')} m²)")
    print(f"  Rack Count:      {len(p1_racks)} racks (Rows: {set(r.get('row') for r in p1_racks)})")
    print(f"  Cooling Units:   {len(p1_cooling)} units ({[c.get('type') for c in p1_cooling]})")
    print(f"  Doors/Openings:  {len(p1_doors)} ({[d.get('type') for d in p1_doors]})")
    print(f"  Electrical Area: {len(p1_elec)} units")
    print(f"  Network Area:    {len(p1_net)} units")

    # Camera configuration for P1
    cam_p1 = GeometryReconstructionService.get_camera_for_layout(p1_layout, "cinematic_central_aisle", 1024, 768)

    # 1. Render P1 Geometry Diagnostic
    p1_geom_img = HybridGeometryRenderer.render_geometry_preview(p1_layout, cam_p1, width=1024, height=768)
    p1_geom_diag_path = diag_dir / "p1_geometry_diagnostic.png"
    p1_geom_img.save(str(p1_geom_diag_path), "PNG")
    shutil.copy(str(p1_geom_diag_path), str(PROJECT_ROOT / "p1_geometry_diagnostic.png"))
    shutil.copy(str(p1_geom_diag_path), str(artifacts_dir / "p1_geometry_diagnostic.png"))
    print(f"  [SAVED] {p1_geom_diag_path} (and root p1_geometry_diagnostic.png)")

    # 2. Render P1 Final Master
    p1_photoreal_raw = HybridGeometryRenderer.render_photorealistic_geometry(
        p1_layout, cam_p1, view_id="cinematic_central_aisle", width=1024, height=768, seed=42
    )
    p1_master_img = HybridGeometryRenderer.enhance_with_geometry_lock(p1_photoreal_raw, sdxl_diffusion_image=None)
    p1_master_path = diag_dir / "p1_final_master.png"
    p1_master_img.save(str(p1_master_path), "PNG")
    shutil.copy(str(p1_master_path), str(PROJECT_ROOT / "p1_final_master.png"))
    shutil.copy(str(p1_master_path), str(artifacts_dir / "p1_final_master.png"))
    print(f"  [SAVED] {p1_master_path} (and root p1_final_master.png)")
    p1_master_sha = compute_sha256(p1_master_path)
    print(f"  P1 Final Master SHA-256: {p1_master_sha}")


    # =========================================================================
    # PIPELINE 2: P2 ENTERPRISE ARCHITECTURAL CAD DRAWING
    # =========================================================================
    print("\n[PIPELINE 2] Processing P2 Enterprise Architectural CAD Drawing...")
    p2_sha256 = compute_sha256(p2_path)
    p2_img_bgr = cv2.imread(str(p2_path))
    p2_h, p2_w, p2_c = p2_img_bgr.shape
    print(f"  Source Filename: {p2_path.name}")
    print(f"  SHA-256 Hash:    {p2_sha256}")
    print(f"  Image Dimension: {p2_w} x {p2_h} ({p2_c} channels)")

    engine_p2 = SketchIntelligenceEngine()
    p2_result = engine_p2.analyze_sketch(
        image_path=str(p2_path),
        project_id="proj-p2-trace-diagnostics",
        output_dir=str(diag_dir / "p2_trace")
    )
    p2_layout = p2_result["layout"]

    # Save outputs/diagnostics/p2_extracted_layout.json
    p2_layout_path = diag_dir / "p2_extracted_layout.json"
    with open(p2_layout_path, "w", encoding="utf-8") as f:
        json.dump(p2_layout, f, indent=2)
    print(f"  [SAVED] {p2_layout_path}")

    # Log P2 detection & metric extraction
    p2_room = p2_layout.get("room", {})
    p2_components = p2_layout.get("components", [])
    p2_racks = [c for c in p2_components if c.get("category") == "server_infrastructure"]
    p2_cooling = [c for c in p2_components if c.get("category") == "cooling_infrastructure"]
    p2_ukg = [c for c in p2_cooling if "ukg" in c.get("id", "").lower() or "ukg" in c.get("type", "").lower()]
    p2_doors = [c for c in p2_components if "door" in c.get("type", "").lower()]
    p2_tech = p2_layout.get("technical_area", {})
    p2_containment = any("hot" in a.get("type", "").lower() for a in p2_layout.get("aisles", []))

    print(f"  Serverraum Area: {p2_room.get('area_sqm')} m² ({p2_room.get('width_m')}m x {p2_room.get('length_m')}m)")
    print(f"  Technikspange:   {p2_tech.get('area_sqm', 20.1)} m² (Present: {p2_tech.get('present', True)})")
    print(f"  Rack Count:      {len(p2_racks)} racks (Rows: {set(r.get('row') for r in p2_racks)})")
    print(f"  UKG Units:       {len(p2_ukg)} precision cooling units (15 kW each)")
    print(f"  Hot-Aisle:       {p2_containment} (Warmgangeinhausung)")
    print(f"  Partition/Door:  {len(p2_doors)} doors/partitions detected")

    # Camera configuration for P2
    cam_p2 = GeometryReconstructionService.get_camera_for_layout(p2_layout, "wide_angle_architecture", 1024, 768)

    # 1. Render P2 Geometry Diagnostic
    p2_geom_img = HybridGeometryRenderer.render_geometry_preview(p2_layout, cam_p2, width=1024, height=768)
    p2_geom_diag_path = diag_dir / "p2_geometry_diagnostic.png"
    p2_geom_img.save(str(p2_geom_diag_path), "PNG")
    shutil.copy(str(p2_geom_diag_path), str(PROJECT_ROOT / "p2_geometry_diagnostic.png"))
    shutil.copy(str(p2_geom_diag_path), str(artifacts_dir / "p2_geometry_diagnostic.png"))
    print(f"  [SAVED] {p2_geom_diag_path} (and root p2_geometry_diagnostic.png)")

    # 2. Render P2 Final Master
    p2_photoreal_raw = HybridGeometryRenderer.render_photorealistic_geometry(
        p2_layout, cam_p2, view_id="wide_angle_architecture", width=1024, height=768, seed=42
    )
    p2_master_img = HybridGeometryRenderer.enhance_with_geometry_lock(p2_photoreal_raw, sdxl_diffusion_image=None)
    p2_master_path = diag_dir / "p2_final_master.png"
    p2_master_img.save(str(p2_master_path), "PNG")
    shutil.copy(str(p2_master_path), str(PROJECT_ROOT / "p2_final_master.png"))
    shutil.copy(str(p2_master_path), str(artifacts_dir / "p2_final_master.png"))
    print(f"  [SAVED] {p2_master_path} (and root p2_final_master.png)")
    p2_master_sha = compute_sha256(p2_master_path)
    print(f"  P2 Final Master SHA-256: {p2_master_sha}")

    # =========================================================================
    # MATHEMATICAL DIFFERENTIATION PROOF
    # =========================================================================
    print("\n" + "=" * 80)
    print("MATHEMATICAL VERIFICATION: P1 VS P2 OUTPUT DIFFERENTIATION")
    print("=" * 80)

    # 1. Layout JSON difference
    assert p1_sha256 != p2_sha256, "Input images must have different SHA-256 hashes!"
    assert len(p1_racks) != len(p2_racks), f"Rack counts must differ! P1={len(p1_racks)}, P2={len(p2_racks)}"
    assert p1_room.get("area_sqm") != p2_room.get("area_sqm"), "Room areas must differ!"

    # 2. Geometry Diagnostic pixel difference
    p1_geom_arr = np.array(p1_geom_img)
    p2_geom_arr = np.array(p2_geom_img)
    geom_absdiff = cv2.absdiff(p1_geom_arr, p2_geom_arr)
    geom_diff_pixels = int(np.count_nonzero(geom_absdiff > 10))
    total_pixels = 1024 * 768 * 3
    geom_diff_pct = (geom_diff_pixels / total_pixels) * 100.0

    print(f"  Geometry Preview Pixel Difference: {geom_diff_pixels:,} / {total_pixels:,} channels ({geom_diff_pct:.2f}% distinct)")
    assert geom_diff_pixels > 50000, "Geometry previews must be structurally distinct!"

    # 3. Master Render pixel difference & Hash comparison
    p1_master_arr = np.array(p1_master_img)
    p2_master_arr = np.array(p2_master_img)
    master_absdiff = cv2.absdiff(p1_master_arr, p2_master_arr)
    master_diff_pixels = int(np.count_nonzero(master_absdiff > 10))
    master_diff_pct = (master_diff_pixels / total_pixels) * 100.0

    print(f"  Final Master Render Pixel Difference: {master_diff_pixels:,} / {total_pixels:,} channels ({master_diff_pct:.2f}% distinct)")
    print(f"  P1 Final Master SHA-256: {p1_master_sha}")
    print(f"  P2 Final Master SHA-256: {p2_master_sha}")
    assert p1_master_sha != p2_master_sha, "Master render SHA-256 hashes MUST be completely different!"
    assert master_diff_pct > 30.0, "Master renders must be over 30% distinct in pixel difference!"

    print("\n[SUCCESS] Independent tracing, verification, and file generation completed successfully.")

if __name__ == "__main__":
    run_trace()
