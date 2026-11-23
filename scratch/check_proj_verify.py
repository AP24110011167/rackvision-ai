import sqlite3
import json

conn = sqlite3.connect("backend/outputs/rackvision.db")
c = conn.cursor()

c.execute("SELECT * FROM projects WHERE id = 'proj-verify-all-3'")
print("Project:", c.fetchone())

c.execute("SELECT * FROM sketches WHERE id = 'sketch-6995d2ec'")
print("Sketch:", c.fetchone())

c.execute("SELECT * FROM layouts WHERE project_id = 'proj-verify-all-3'")
row = c.fetchone()
if row:
    print("Layout version:", row[2])
    print("Layout data preview:", str(row[3])[:300])

conn.close()
