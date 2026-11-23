import sqlite3

conn = sqlite3.connect("backend/outputs/rackvision.db")
c = conn.cursor()

c.execute("SELECT id, project_id, output_type, mode, model_identifier, image_url, generation_status, created_at FROM designs WHERE project_id = 'p2_architectural_master'")
print("Designs for p2_architectural_master:")
for row in c.fetchall():
    print(row)

c.execute("SELECT id, project_id, design_id, model_identifier, image_url, generation_status, inference_time_seconds, created_at FROM final_master_renders WHERE project_id = 'p2_architectural_master'")
print("\nFinal master renders for p2_architectural_master:")
for row in c.fetchall():
    print(row)

conn.close()
