import sqlite3
import json

conn = sqlite3.connect("backend/outputs/rackvision.db")
c = conn.cursor()

print("--- TABLES ---")
for row in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall():
    print(row[0])

print("\n--- RECENT DESIGNS ---")
for row in c.execute("SELECT id, project_id, output_type, mode, model_identifier, image_url, generation_status, created_at FROM designs ORDER BY created_at DESC LIMIT 10").fetchall():
    print(row)

print("\n--- FINAL MASTER RENDERS ---")
for row in c.execute("SELECT id, project_id, design_id, model_identifier, image_url, generation_status, inference_time_seconds, created_at FROM final_master_renders ORDER BY created_at DESC LIMIT 10").fetchall():
    print(row)

conn.close()
