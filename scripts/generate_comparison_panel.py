"""
Generate Side-by-Side P1 vs P2 Comparison Panel for Phase 5 Visual Verification.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DIAG_DIR = PROJECT_ROOT / "outputs" / "diagnostics"
ARTIFACTS_DIR = Path(r"C:\Users\kadal\.gemini\antigravity\brain\1ecb1371-8c6e-48a8-bb3d-7d465c396e68")

p1_diag = Image.open(DIAG_DIR / "p1_geometry_diagnostic.png").resize((640, 480))
p2_diag = Image.open(DIAG_DIR / "p2_geometry_diagnostic.png").resize((640, 480))
p1_master = Image.open(DIAG_DIR / "p1_final_master.png").resize((640, 480))
p2_master = Image.open(DIAG_DIR / "p2_final_master.png").resize((640, 480))

canvas = Image.new("RGB", (1320, 1060), (18, 20, 24))
draw = ImageDraw.Draw(canvas)

# Headers
draw.text((30, 20), "P1 COMPACT DATA CENTER (4.8m x 3.6m | 8 Racks | 2 A/C | Open Aisle)", fill=(100, 200, 255))
draw.text((690, 20), "P2 ENTERPRISE CAD (49.6m² + 19.2m² Plant | 12 Racks | 3 UKG | Containment)", fill=(255, 180, 80))

draw.text((30, 50), "Output 3 Geometry Diagnostic Preview (Wireframe)", fill=(180, 180, 180))
draw.text((690, 50), "Output 3 Geometry Diagnostic Preview (Wireframe)", fill=(180, 180, 180))

canvas.paste(p1_diag, (30, 75))
canvas.paste(p2_diag, (690, 75))

draw.text((30, 575), "Output 3 Final Photorealistic Master Render", fill=(180, 180, 180))
draw.text((690, 575), "Output 3 Final Photorealistic Master Render", fill=(180, 180, 180))

canvas.paste(p1_master, (30, 600))
canvas.paste(p2_master, (690, 600))

out_path = DIAG_DIR / "p1_vs_p2_phase5_comparison.png"
canvas.save(str(out_path), "PNG")
canvas.save(str(PROJECT_ROOT / "p1_vs_p2_comparison.png"), "PNG")
canvas.save(str(ARTIFACTS_DIR / "p1_vs_p2_comparison.png"), "PNG")
print(f"[SAVED] {out_path}")
