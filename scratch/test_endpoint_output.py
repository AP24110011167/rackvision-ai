import sys
from pathlib import Path
sys.path.insert(0, str(Path("backend").resolve()))
sys.path.insert(0, str(Path(".").resolve()))

from app.api.endpoints import get_project_design_outputs

res = get_project_design_outputs("p2_architectural_master")
master = res.get("master_render")
print("=== Output 3 for p2_architectural_master ===")
if master:
    print(f"ID: {master.get('id')}")
    print(f"Mode: {master.get('mode')}")
    print(f"Model: {master.get('model_identifier')}")
    print(f"Image URL: {master.get('image_url')}")
    print(f"Status: {master.get('generation_status')}")
    print(f"Racks: {master.get('rack_count')}")
    print(f"Cooling: {master.get('cooling_type')}")
else:
    print("No master render returned!")
