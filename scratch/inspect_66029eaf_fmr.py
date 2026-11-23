import sqlite3

conn = sqlite3.connect("backend/outputs/rackvision.db")
c = conn.cursor()

c.execute("SELECT * FROM final_master_renders WHERE design_id = 'design-master-66029eaf'")
row = c.fetchone()
cols = [d[0] for d in c.description]
print("=== final_master_renders design-master-66029eaf ===")
for k, v in zip(cols, row):
    print(f"{k}: {v}")

conn.close()
