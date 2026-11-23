import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.database.db import get_connection

logger = logging.getLogger("rackvision.construction")

class ConstructionService:
    @staticmethod
    def get_plan(project_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves 10-stage sequential construction plan for project."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM construction_plans WHERE project_id = ?", (project_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None

        stages = json.loads(row["stages_json"])
        completed_stages = sum(1 for s in stages if s.get("status") == "Completed")
        in_progress_stages = sum(1 for s in stages if s.get("status") == "In Progress")
        overall_progress = round(sum(s.get("progress_percent", 0) for s in stages) / len(stages), 1) if stages else 0

        return {
            "id": row["id"],
            "project_id": row["project_id"],
            "stages": stages,
            "total_duration_days": row["total_duration_days"],
            "target_completion_date": row["target_completion_date"],
            "completed_stages_count": completed_stages,
            "in_progress_stages_count": in_progress_stages,
            "overall_progress_percent": overall_progress,
            "updated_at": row["updated_at"],
            "engineering_disclaimer": "Preliminary sequence generated for architectural planning. Certified mechanical, electrical, structural, and life-safety sign-offs are mandatory before field deployment."
        }

    @staticmethod
    def update_stage_progress(project_id: str, stage_num: int, progress_percent: int, status: str) -> Optional[Dict[str, Any]]:
        """Updates progress and status of an individual construction stage."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM construction_plans WHERE project_id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return None

        stages = json.loads(row["stages_json"])
        for s in stages:
            if s.get("stage_num") == stage_num:
                s["progress_percent"] = max(0, min(100, progress_percent))
                s["status"] = status
                if progress_percent >= 100:
                    s["status"] = "Completed"
                elif progress_percent > 0 and status != "Completed":
                    s["status"] = "In Progress"
                break

        now = datetime.now().isoformat()
        cursor.execute("""
        UPDATE construction_plans
        SET stages_json = ?, updated_at = ?
        WHERE project_id = ?
        """, (json.dumps(stages), now, project_id))
        conn.commit()
        conn.close()

        return ConstructionService.get_plan(project_id)
