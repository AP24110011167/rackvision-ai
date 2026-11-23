# RackVision AI — System Architecture Specification

## 1. System Overview
RackVision AI is an end-to-end cyber-physical software platform that converts architectural sketches into photorealistic data-center concepts, generates interactive 3D simulations, outputs engineering bill of materials (BOM), designs 10-stage construction sequences, and computes quantitative facility analytics according to international standards (ASHRAE TC 9.9, ANSI/TIA-942, NFPA 70/75).

```
                      +-----------------------------------+
                      |   React 19 + TypeScript + Vite    |
                      |   Tailwind CSS + Framer Motion    |
                      +-----------------+-----------------+
                                        | (REST / JSON)
                                        v
                      +-----------------------------------+
                      |      FastAPI REST API Gateway     |
                      +-----------------+-----------------+
                                        |
       +-----------------+--------------+---------------+-----------------+
       |                 |                              |                 |
       v                 v                              v                 v
+--------------+  +--------------+              +--------------+  +--------------+
| OpenCV Canny |  | ControlNet   |              | Three.js R3F |  |  ReportLab   |
| Preprocessor |  | + SD 1.5     |              | 3D Simulator |  | PDF Exporter |
+--------------+  +--------------+              +--------------+  +--------------+
       |                 |                              |                 |
       +-----------------+--------------+---------------+-----------------+
                                        |
                                        v
                      +-----------------------------------+
                      |    SQLite Persistent Database     |
                      | (Projects, Scenes, BOM, Stages)   |
                      +-----------------------------------+
```

## 2. Component Breakdown

### A. Frontend Layer (`/frontend`)
- **Framework**: React 19 with TypeScript and Vite.
- **Styling**: Cyberpunk Deep Space theme (`#0A0B10` background, `#00F0FF` electric cyan, `#8B5CF6` deep violet, glassmorphism).
- **3D Graphics Engine**: Three.js, React Three Fiber (`@react-three/fiber`), and `@react-three/drei`.
- **Motion & UI Dynamics**: Framer Motion for 60fps micro-interactions, page transitions, and status pulses.
- **Data Visualizations**: Recharts for facility power loads, PUE breakdown, and space density charts.

### B. Backend Services Layer (`/backend`)
- **Web API**: FastAPI with Pydantic v2 schemas and CORS middleware.
- **Image Processing**: OpenCV (`cv2`) for CLAHE contrast normalization, bilateral filtering, rotation, and Canny edge operator.
- **Report Generation**: ReportLab Platypus engine producing multi-page PDF technical specifications.
- **Storage**: SQLite3 with normalized tables for projects, sketches, designs, 3D layouts, materials, and construction schedules.

### C. AI & Machine Learning Pipeline (`/ai_engine`)
- **Latent Conditioning**: ControlNet Canny model (`lllyasviel/control_v11p_sd15_canny`) preserving strict wall, aisle, and rack boundary geometry.
- **Diffusion Backbone**: Stable Diffusion v1.5 with architectural prompt embeddings.
- **Evaluation Engine**: Automated SSIM, PSNR, and Canny edge alignment metrics.
- **Training Harness**: PyTorch script for fine-tuning ControlNet or LoRA on custom sketch-photo datasets.
