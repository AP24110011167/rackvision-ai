import json
from pathlib import Path

nb_path = Path("notebooks/RackVision_SDXL_ControlNet.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

for idx, cell in enumerate(nb["cells"]):
    src = "".join(cell.get("source", []))
    if "/generate" in src:
        print(f"=== CELL {idx} ===")
        print(src)
