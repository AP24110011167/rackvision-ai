import json
from pathlib import Path

nb_path = Path("notebooks/RackVision_SDXL_ControlNet.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

for idx, cell in enumerate(nb["cells"]):
    src = "".join(cell.get("source", []))
    if "@app.post(\"/generate\")" in src:
        lines = src.splitlines()
        for i, l in enumerate(lines):
            if "@app.post" in l:
                print("\n".join(lines[max(0, i-5):min(len(lines), i+60)]))
                break
