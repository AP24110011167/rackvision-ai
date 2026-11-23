# RackVision AI — Installation & Quickstart Guide

## Prerequisites
- **Node.js**: v18+ (tested on v24.13.1)
- **Python**: 3.10+ (tested on 3.14.2)
- **Hardware**: Any modern PC; GPU (NVIDIA RTX with CUDA) recommended for local neural inference.

## 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run FastAPI Server (starts on http://127.0.0.1:8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- Redoc: `http://127.0.0.1:8000/redoc`

## 2. Frontend Setup

```bash
cd frontend

# Dependencies are already installed in package.json
npm run dev
```

The web application opens at `http://localhost:5173`.

## 3. Training & Custom Datasets (Optional)
To train or fine-tune ControlNet on your paired dataset:
```bash
python ai_engine/training/train_controlnet_lora.py --dataset_dir ./data --epochs 15
```
