# RackVision AI: Intelligent Data Center Design, 3D Visualization & Construction Planning Platform

![RackVision AI Banner](https://img.shields.io/badge/Architecture-Cyberpunk%20Deep%20Space-00F0FF?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20REST-009688?style=for-the-badge)
![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?style=for-the-badge)
![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js%20%2B%20R3F-black?style=for-the-badge)
![AI ControlNet](https://img.shields.io/badge/AI%2FML-ControlNet%20Canny-8B5CF6?style=for-the-badge)

RackVision AI is an end-to-end commercial-grade AI platform that transforms hand-drawn data-center layout sketches into photorealistic architectural visualizations, interactive 3D virtual simulations, bill of materials (BOM), 10-stage sequential construction schedules, and quantitative facility infrastructure analytics.

---

## Key Modules
1. **Overview & Landing Page**: Animated 3D server rack in hero section, feature showcases, and before-after interactive demonstrations.
2. **Project Dashboard**: Multi-project management with space utilization, power, and rack distribution telemetry.
3. **Sketch Studio**: Drag-and-drop sketch upload, OpenCV CLAHE contrast, bilateral filtering, rotation, crop, and Canny edge map previews.
4. **AI Design Generator**: ControlNet Canny + Stable Diffusion 1.5 pipeline with positive/negative prompt crafting, multiple architectural styles, and before/after slider.
5. **Design Gallery**: High-res design variations, seed management, and full-screen inspection.
6. **Interactive 3D Simulator**: Three.js / React Three Fiber scene with animated laminar airflow particles, cold/hot aisles, server status LEDs, first-person walkthrough, and layout editor.
7. **Material Planner (BOM)**: Categorized infrastructure equipment list with quantities, unit prices, specifications, and editing capabilities.
8. **Construction Guide**: 10-stage sequential construction guide with duration days, safety precautions, tools, and inspection checklists.
9. **Data Center Analytics**: IT power demand, sensible cooling capacity, heat dissipation in BTU/hr, annual energy consumption, cable meterage, and PUE breakdown.
10. **Design Optimizer**: ASHRAE TC 9.9 & ANSI/TIA-942 compliance checker with heuristic layout comparison.
11. **Engineering Reports**: One-click downloadable multi-page PDF report generated using ReportLab.
12. **Settings**: GPU detection, model checkpoint path, and demonstration mode toggle.

---

## Quickstart

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm run dev
```

Visit: `http://localhost:5173`
API Docs: `http://127.0.0.1:8000/docs`
