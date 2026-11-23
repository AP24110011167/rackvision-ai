import json
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

# Load verified P2 layout
p2_path = Path("outputs/verified_p2_layout.json")
with open(p2_path, "r", encoding="utf-8") as f:
    layout = json.load(f)

from app.services.design_generation.geometry_reconstruction_service import GeometryReconstructionService, PinholeCamera

print("Loaded layout for prototype renderer")
