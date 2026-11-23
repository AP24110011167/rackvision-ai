import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from app.core.config import settings
from app.database.db import get_connection
from ai_engine.sketch_intelligence import SketchIntelligenceEngine

logger = logging.getLogger("rackvision.layout_service")

class LayoutService:
    @staticmethod
    def get_layout(project_id: str) -> Optional[Dict[str, Any]]:
        """Fetches confirmed structured layout JSON for a project."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT layout_json FROM layouts WHERE project_id = ?", (project_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return json.loads(row["layout_json"])
        return None

    @staticmethod
    def save_layout(project_id: str, layout_data: Dict[str, Any], sketch_id: Optional[str] = None, status: str = "confirmed") -> Dict[str, Any]:
        """Saves confirmed structured layout JSON and synchronizes 3D scene & BOM."""
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        layout_id = f"layout-{project_id}"
        layout_str = json.dumps(layout_data)

        cursor.execute("""
        INSERT INTO layouts (id, project_id, sketch_id, layout_json, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_id) DO UPDATE SET
            layout_json = excluded.layout_json,
            sketch_id = excluded.sketch_id,
            status = excluded.status,
            updated_at = excluded.updated_at
        """, (layout_id, project_id, sketch_id, layout_str, status, now))
        conn.commit()
        conn.close()

        # Invalidate existing generated designs for this project so old corridors are NEVER reused
        LayoutService._invalidate_cached_designs(project_id)

        # Synchronize 3D Scene and Materials BOM with confirmed layout
        from app.services.simulator_service import SimulatorService
        from app.services.material_service import MaterialService
        SimulatorService.sync_scene_from_layout(project_id, layout_data)
        MaterialService.sync_materials_from_layout(project_id, layout_data)

        logger.info("Layout confirmed and synchronized for project %s", project_id)
        return layout_data

    @staticmethod
    def process_and_reconstruct(project_id: str, image_path: str, sketch_id: Optional[str] = None) -> Dict[str, Any]:
        """Runs the complete Sketch Intelligence Engine on an image and saves the resulting layout."""
        engine = SketchIntelligenceEngine()
        result = engine.analyze_sketch(
            image_path=image_path,
            project_id=project_id,
            output_dir=str(settings.SKETCHES_DIR)
        )
        layout = result["layout"]
        LayoutService.save_layout(project_id, layout, sketch_id=sketch_id, status="detected")
        return result

    @staticmethod
    def _invalidate_cached_designs(project_id: str):
        """Clears old cached designs when layout changes to enforce different outputs."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM designs WHERE project_id = ?", (project_id,))
        conn.commit()
        conn.close()
