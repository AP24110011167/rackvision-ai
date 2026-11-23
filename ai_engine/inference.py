"""
RackVision AI — Standalone Inference Entrypoint
Allows executing sketch-to-image generation directly via CLI or external scripts.
"""

import argparse
import sys
from pathlib import Path
from PIL import Image

from ai_engine.preprocessing.canny_processor import CannyEdgeProcessor
from ai_engine.controlnet.pipeline_wrapper import ControlNetPipelineWrapper
from ai_engine.evaluation.metrics import ModelEvaluator

def main():
    parser = argparse.ArgumentParser(description="RackVision AI Sketch-to-Design Inference")
    parser.add_argument("--sketch", type=str, required=True, help="Path to input sketch image")
    parser.add_argument("--style", type=str, default="Modern Enterprise Data Center")
    parser.add_argument("--output", type=str, default="generated_datacenter.png")
    parser.add_argument("--low_thresh", type=int, default=50)
    parser.add_argument("--high_thresh", type=int, default=150)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    sketch_path = Path(args.sketch)
    if not sketch_path.exists():
        print(f"Error: Sketch file not found: {sketch_path}")
        sys.exit(1)

    print(f"Loading input sketch: {sketch_path}")
    raw_img = Image.open(sketch_path).convert("RGB")

    # Step 1: Preprocess and extract Canny edges
    processor = CannyEdgeProcessor(low_threshold=args.low_thresh, high_threshold=args.high_thresh)
    import numpy as np
    raw_np = np.array(raw_img)
    _, edges = processor.process_sketch(raw_np)
    edge_img = Image.fromarray(edges)

    edge_save_path = sketch_path.stem + "_canny.png"
    edge_img.save(edge_save_path)
    print(f"Extracted Canny edge map saved to: {edge_save_path}")

    # Step 2: Initialize Pipeline
    pipeline = ControlNetPipelineWrapper()
    loaded = pipeline.load_pipeline()

    if loaded:
        print("Running ControlNet Diffusion inference...")
        prompt = f"masterpiece, photorealistic architectural photography of a {args.style}, symmetrical 42U server racks, cold aisle containment, 8k resolution"
        neg_prompt = "blurry, messy cables, low resolution, human faces, distortion"
        results = pipeline.generate(edge_img, prompt, neg_prompt, seed=args.seed)
        results[0].save(args.output)
        print(f"Successfully generated design saved to: {args.output}")

        # Compute edge preservation metrics
        gen_np = np.array(results[0])
        eval_metrics = ModelEvaluator.calculate_edge_preservation_score(edges, gen_np)
        print("Structural Evaluation Metrics:", eval_metrics)
    else:
        print("Note: GPU/Diffusers weights not loaded. Use backend service for procedural synthesis.")

if __name__ == "__main__":
    main()
