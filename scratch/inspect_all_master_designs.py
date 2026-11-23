import os
import sqlite3
from PIL import Image
import numpy as np

conn = sqlite3.connect("backend/outputs/rackvision.db")
c = conn.cursor()

designs_dir = "backend/outputs/designs"
for fname in os.listdir(designs_dir):
    if fname.startswith("design-master-") and fname.endswith(".png"):
        fpath = os.path.join(designs_dir, fname)
        did = fname.replace("_var_1.png", "")
        c.execute("SELECT project_id, output_type, mode, model_identifier, created_at, generation_status FROM designs WHERE id = ?", (did,))
        row = c.fetchone()
        img = Image.open(fpath)
        arr = np.array(img)
        print(f"File: {fname} ({os.path.getsize(fpath)} bytes)")
        print(f"  Dimensions: {img.size}, Mode: {img.mode}, Mean: {np.mean(arr):.1f}, Std: {np.std(arr):.1f}")
        print(f"  DB Record: {row}")
        print("-" * 60)

conn.close()
