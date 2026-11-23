import sqlite3
import json

conn = sqlite3.connect("backend/outputs/rackvision.db")
c = conn.cursor()

c.execute("SELECT * FROM designs WHERE id = 'design-master-f1489d7b'")
row = c.fetchone()
cols = [d[0] for d in c.description]
print("=== design-master-f1489d7b ===")
for k, v in zip(cols, row):
    print(f"{k}: {v}")

c.execute("SELECT * FROM final_master_renders WHERE design_id = 'design-master-f1489d7b'")
fmr_row = c.fetchone()
fmr_cols = [d[0] for d in c.description]
print("\n=== final_master_renders ===")
for k, v in zip(fmr_cols, fmr_row):
    print(f"{k}: {v}")

conn.close()
