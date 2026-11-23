import sqlite3
from pathlib import Path
from PIL import Image

for name in ["p2_perspective_conditioning_canny.png", "p2_raw_sdxl_render.png", "p2_output3_master_render.png"]:
    p = Path("outputs") / name
    if p.exists():
        im = Image.open(p)
        print(f"{name}: size={im.size}, mode={im.mode}")

db = Path("backend/outputs/rackvision.db")
conn = sqlite3.connect(str(db))
c = conn.cursor()
c.execute("SELECT id, project_id, output_type, camera_viewpoint, image_url FROM designs WHERE project_id='p2_architectural_master'")
for r in c.fetchall():
    print("DB design:", r)
