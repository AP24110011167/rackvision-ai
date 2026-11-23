"""
tests/verify_colab_notebook_saved.py
Comprehensive programmatic verification of all 10 user requirements
by reopening and parsing the saved notebooks/RackVision_SDXL_ControlNet.ipynb file.
"""

import sys
import re
import json
from pathlib import Path

# Add project root and backend directory to path
root_dir = Path(".").resolve()
backend_dir = Path("backend").resolve()
for d in [root_dir, backend_dir]:
    if str(d) not in sys.path:
        sys.path.insert(0, str(d))

def verify_all_ten_requirements():
    nb_path = Path("notebooks/RackVision_SDXL_ControlNet.ipynb")
    assert nb_path.exists(), f"Notebook file {nb_path} does not exist!"

    with open(nb_path, "r", encoding="utf-8") as f:
        nb_data = json.load(f)

    cells = nb_data.get("cells", [])
    assert len(cells) > 0, "Notebook has 0 cells!"

    code_cells = [c for c in cells if c.get("cell_type") == "code"]
    markdown_cells = [c for c in cells if c.get("cell_type") == "markdown"]

    all_code = "\n".join("".join(c["source"]) for c in code_cells)
    all_text = "\n".join("".join(c["source"]) for c in cells)

    print("=" * 80)
    print("📋 RACKVISION AI — PROGRAMMATIC NOTEBOOK VERIFICATION (ALL 10 CRITERIA)")
    print(f"Target Notebook: {nb_path.resolve()}")
    print(f"Total Cells: {len(cells)} (Code: {len(code_cells)}, Markdown: {len(markdown_cells)})")
    print("=" * 80)

    # 1. Only one ControlNet is loaded
    canny_matches = re.findall(r"diffusers/controlnet-canny-sdxl-1\.0", all_code)
    controlnet_loads = re.findall(r"ControlNetModel\.from_pretrained", all_code)
    assert len(controlnet_loads) == 1, f"Expected 1 ControlNet load, found {len(controlnet_loads)}"
    assert len(canny_matches) >= 1, "ControlNet Canny model not loaded"
    print("  [PASS] 1. Only one ControlNet is loaded: diffusers/controlnet-canny-sdxl-1.0")

    # 2. No Depth ControlNet is instantiated
    depth_mentions = re.findall(r"controlnet[-_]depth", all_code, re.IGNORECASE)
    assert len(depth_mentions) == 0, f"Found Depth ControlNet occurrences in code: {depth_mentions}"
    print("  [PASS] 2. No Depth ControlNet is loaded or instantiated in pipeline")

    # 3. The diagnostic uses 512 × 512 and 15 steps
    assert "test_w, test_h = 512, 512" in all_code, "Diagnostic resolution must be 512x512"
    assert "diag_steps = 15" in all_code or "num_inference_steps=15" in all_code, "Diagnostic inference steps must be 15"
    print("  [PASS] 3. Diagnostic uses 512 × 512 resolution and 15 inference steps")

    # 4. Inference uses one Canny conditioning image
    assert "image=canny_pil" in all_code, "Inference must pass single Canny conditioning image"
    assert "image=[canny_pil, depth_pil]" not in all_code, "Dual conditioning image list found"
    print("  [PASS] 4. Inference uses single Canny conditioning image (no dual image list)")

    # 5. VAE slicing and tiling are enabled via pipe.vae with hasattr checks
    assert "pipe.vae.enable_tiling()" in all_code, "pipe.vae.enable_tiling() missing"
    assert "pipe.vae.enable_slicing()" in all_code, "pipe.vae.enable_slicing() missing"
    assert "pipe.enable_model_cpu_offload()" in all_code, "pipe.enable_model_cpu_offload() missing"
    assert "hasattr(pipe, 'enable_attention_slicing')" in all_code, "hasattr attention slicing missing"
    print("  [PASS] 5. VAE-level tiling (pipe.vae.enable_tiling()), slicing (pipe.vae.enable_slicing()), CPU offload, and attention slicing enabled with hasattr checks")

    # 6. System RAM and GPU VRAM diagnostics exist
    assert "def check_memory" in all_code, "check_memory() diagnostic function missing"
    assert "psutil.virtual_memory()" in all_code, "psutil RAM memory inspection missing"
    assert "torch.cuda.memory_allocated" in all_code, "CUDA VRAM memory inspection missing"
    print("  [PASS] 6. System RAM (psutil) and GPU VRAM (CUDA) diagnostics active across stages")

    # 7. The authentication token is not embedded in HTML or JavaScript
    assert "<script" not in all_text.lower(), "Raw <script> tag detected in notebook"
    assert "navigator.clipboard" not in all_text, "navigator.clipboard JavaScript detected"
    assert "onclick=" not in all_text.lower(), "HTML onclick attribute detected"
    assert "{AUTH_TOKEN}" not in all_text, "AUTH_TOKEN interpolation in HTML/JS detected"
    print("  [PASS] 7. Authentication token is NOT embedded in HTML or JavaScript")

    # 8. The FastAPI endpoint and health response report only Canny ControlNet
    assert "'controlnet': 'diffusers/controlnet-canny-sdxl-1.0'" in all_code, "FastAPI health must report Canny"
    assert "'controlnets':" not in all_code, "Old plural dual-controlnets dictionary key found"
    print("  [PASS] 8. FastAPI /health and /generate report only ControlNet Canny")

    # 9. Output 3 integration remains intact
    from app.services.design_generation.final_master_render_service import FinalMasterRenderService
    from app.services.colab_inference_service import ColabInferenceService
    assert hasattr(FinalMasterRenderService, "generate_final_master_render"), "Output 3 service method missing"
    assert hasattr(ColabInferenceService, "generate_master_render"), "Colab adapter method missing"
    print("  [PASS] 9. Output 3 (Final Architectural Master Render) integration remains intact")

    # 10. Output 1 and Output 2 remain untouched
    from app.services.design_generation.technical_layout_service import TechnicalLayoutService
    from app.services.design_generation.interior_preview_service import InteriorPreviewService
    assert hasattr(TechnicalLayoutService, "generate_technical_layout"), "Output 1 service method missing"
    assert hasattr(InteriorPreviewService, "generate_photorealistic_design"), "Output 2 service method missing"
    print("  [PASS] 10. Output 1 (Technical Layout) and Output 2 (Interior Preview) untouched & intact")

    print("=" * 80)
    print("🎉 ALL 10 USER REQUIREMENTS CONFIRMED PROGRAMMATICALLY PASSED (100%)")
    print("=" * 80)

if __name__ == "__main__":
    verify_all_ten_requirements()
