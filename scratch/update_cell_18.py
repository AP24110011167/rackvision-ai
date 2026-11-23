import json
import ast
import shutil
from pathlib import Path

# Read the validated cell code
cell_file = Path("scratch/stage_8_cell.py")
with open(cell_file, "r", encoding="utf-8") as f:
    cell_18_code = f.read()

# Validate AST syntax
tree = ast.parse(cell_18_code)
print(f"✓ AST validation succeeded for {cell_file} ({len(tree.body)} AST nodes).")

# Update notebook
nb_path = Path("notebooks/RackVision_SDXL_ControlNet.ipynb")
with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Split into lines preserving newlines
lines = [l + "\n" for l in cell_18_code.split("\n")]
if lines and lines[-1] == "\n":
    lines = lines[:-1]
if lines:
    lines[-1] = lines[-1].rstrip("\n")

nb["cells"][18]["source"] = lines

with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1)

print(f"✓ Successfully updated Cell 18 in {nb_path.resolve()}")

# Copy to brain artifact path
artifact_path = Path(r"C:\Users\kadal\.gemini\antigravity\brain\96023cda-5596-4b27-af16-0c1114b3e185\RackVision_SDXL_ControlNet.ipynb")
if artifact_path.parent.exists():
    shutil.copyfile(nb_path, artifact_path)
    print(f"✓ Copied updated notebook to brain artifact: {artifact_path}")
