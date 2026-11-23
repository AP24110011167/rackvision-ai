import unittest
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
sys.path.insert(0, str(ROOT_DIR))

from app.database.db import init_db, get_connection
from app.services.sketch_service import SketchService
from app.services.ai_generation_service import AIGenerationService
from app.services.simulator_service import SimulatorService
from app.services.material_service import MaterialService
from app.services.construction_service import ConstructionService
from app.services.analytics_service import AnalyticsService
from app.services.optimizer_service import OptimizerService
from app.services.report_service import ReportService
from ai_engine.evaluation.metrics import ModelEvaluator
import numpy as np

class TestRackVisionServices(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_database_seed(self):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projects WHERE id = 'proj-helios-01'")
        row = cursor.fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertEqual(row["name"], "Helios Cloud Hyperscale DC-1")

    def test_02_sketch_service_and_cv(self):
        sketch_info = SketchService.get_or_create_sketch("proj-helios-01")
        self.assertIn("original_url", sketch_info)
        self.assertIn("canny_url", sketch_info)
        self.assertTrue(os.path.exists(ROOT_DIR / "backend" / sketch_info["original_url"].lstrip("/")))

    def test_03_ai_generation_service(self):
        status = AIGenerationService.check_gpu_and_model_status()
        self.assertIn("recommended_mode", status)

        designs = AIGenerationService.generate_design(
            project_id="proj-helios-01",
            sketch_id=None,
            style="Modern Enterprise Data Center",
            rack_count=20,
            num_variations=1
        )
        self.assertEqual(len(designs), 1)
        self.assertIn("image_url", designs[0])
        self.assertTrue(os.path.exists(ROOT_DIR / "backend" / designs[0]["image_url"].lstrip("/")))

    def test_04_simulator_service(self):
        scene = SimulatorService.get_scene("proj-helios-01")
        self.assertIn("room_dims", scene)
        self.assertIn("racks", scene)
        self.assertEqual(len(scene["racks"]), 20)

        # Update scene
        scene["room_dims"]["width"] = 18.0
        updated = SimulatorService.update_scene("proj-helios-01", scene)
        self.assertEqual(updated["room_dims"]["width"], 18.0)

    def test_05_material_service(self):
        materials = MaterialService.get_materials("proj-helios-01")
        self.assertGreaterEqual(len(materials), 10)

        summary = MaterialService.get_summary("proj-helios-01")
        self.assertGreater(summary["total_estimated_cost_usd"], 500000)
        self.assertIn("disclaimer", summary)

    def test_06_construction_service(self):
        plan = ConstructionService.get_plan("proj-helios-01")
        self.assertIsNotNone(plan)
        self.assertEqual(len(plan["stages"]), 10)

        # Update stage progress
        updated = ConstructionService.update_stage_progress("proj-helios-01", stage_num=4, progress_percent=75, status="In Progress")
        s4 = next(s for s in updated["stages"] if s["stage_num"] == 4)
        self.assertEqual(s4["progress_percent"], 75)

    def test_07_analytics_service(self):
        analytics = AnalyticsService.calculate_metrics("proj-helios-01")
        self.assertGreater(analytics["total_it_power_kw"], 100)
        self.assertGreater(analytics["estimated_pue"], 1.1)
        self.assertIn("cable_requirements_meters", analytics)

    def test_08_optimizer_service(self):
        opt = OptimizerService.analyze_layout("proj-helios-01")
        self.assertGreaterEqual(len(opt["suggestions"]), 4)
        self.assertIn("efficiency_score", opt)
        self.assertIn("ashrae_standard", opt["suggestions"][0])

    def test_09_pdf_report_service(self):
        pdf_path = ReportService.generate_pdf_report("proj-helios-01")
        self.assertTrue(os.path.exists(pdf_path))
        self.assertGreater(os.path.getsize(pdf_path), 5000)

    def test_10_ai_evaluation_metrics(self):
        img_a = np.ones((80, 80, 3), dtype=np.uint8) * 100
        img_b = np.ones((80, 80, 3), dtype=np.uint8) * 105
        psnr = ModelEvaluator.calculate_psnr(img_a, img_b)
        ssim = ModelEvaluator.calculate_ssim(img_a, img_b)
        self.assertGreater(psnr, 25.0)
        self.assertGreater(ssim, 0.95)

if __name__ == "__main__":
    unittest.main()
