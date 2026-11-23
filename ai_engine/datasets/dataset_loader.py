"""
RackVision AI — Paired Sketch-to-Data Center Dataset Loader
Loads paired datasets containing:
1. Hand-drawn floor plan sketches (or extracted synthetic Canny edge maps).
2. Corresponding photorealistic architectural rendering / photograph.
3. Descriptive text prompt metadata.
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from PIL import Image
import numpy as np

class PairedDataCenterDataset:
    def __init__(
        self,
        dataset_root: str,
        split: str = "train",
        image_size: int = 512,
        augment: bool = False
    ):
        self.dataset_root = Path(dataset_root)
        self.split = split
        self.image_size = image_size
        self.augment = augment
        self.items: List[Dict[str, str]] = []
        self._load_manifest()

    def _load_manifest(self):
        manifest_path = self.dataset_root / f"{self.split}_manifest.json"
        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                self.items = json.load(f)
        else:
            # Fallback scan for pairs: sketch_XXX.png and target_XXX.png
            sketches_dir = self.dataset_root / self.split / "sketches"
            targets_dir = self.dataset_root / self.split / "targets"
            if sketches_dir.exists() and targets_dir.exists():
                for s_file in sketches_dir.glob("*.png"):
                    t_file = targets_dir / s_file.name
                    if t_file.exists():
                        self.items.append({
                            "sketch_path": str(s_file),
                            "target_path": str(t_file),
                            "prompt": "high-tech enterprise data center with cold aisle containment and server racks"
                        })

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        item = self.items[idx]
        sketch_img = Image.open(item["sketch_path"]).convert("RGB").resize((self.image_size, self.image_size))
        target_img = Image.open(item["target_path"]).convert("RGB").resize((self.image_size, self.image_size))

        # Basic horizontal flip augmentation
        if self.augment and np.random.rand() > 0.5:
            sketch_img = sketch_img.transpose(Image.FLIP_LEFT_RIGHT)
            target_img = target_img.transpose(Image.FLIP_LEFT_RIGHT)

        return {
            "sketch": sketch_img,
            "target": target_img,
            "prompt": item.get("prompt", "modern enterprise data center facility")
        }

from typing import Any
