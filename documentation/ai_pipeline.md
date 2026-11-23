# RackVision AI — AI/ML Neural Pipeline Documentation

## 1. Architectural Pipeline Workflow

```
[Hand-Drawn Sketch] 
       │
       ▼
[OpenCV CLAHE & Bilateral Filter]
       │
       ▼
[Canny Edge Extraction (50/150)]
       │
       ▼
[ControlNet Conditioning Encoder] ──► [Zero-Convolutions]
                                               │
                                               ▼
[Positive Architectural Prompt]   ──► [Stable Diffusion 1.5 U-Net]
[Negative Artifact Prompt]        ──► [UniPC Multistep Latent Denoiser]
                                               │
                                               ▼
                                      [Latent Decoder (VAE)]
                                               │
                                               ▼
                                    [Photorealistic 8K Render]
```

## 2. Model Training & Fine-Tuning Strategy

### A. Pretrained Checkpoints
- Base: `runwayml/stable-diffusion-v1-5`
- ControlNet: `lllyasviel/control_v11p_sd15_canny`

### B. Custom Fine-Tuning with LoRA (Low-Rank Adaptation)
When fine-tuning on a proprietary dataset of data-center architectural blueprints:
1. Freeze the base SD 1.5 weights $\mathbf{W}_0 \in \mathbb{R}^{d \times k}$.
2. Inject low-rank decomposition matrices $\mathbf{B} \in \mathbb{R}^{d \times r}$ and $\mathbf{A} \in \mathbb{R}^{r \times k}$ with rank $r \ll \min(d, k)$:
   $$\mathbf{W} = \mathbf{W}_0 + \frac{\alpha}{r}\mathbf{B}\mathbf{A}$$
3. Optimize loss:
   $$\mathcal{L}_{\text{diff}} = \mathbb{E}_{t, x_0, \epsilon, c} \left[ \| \epsilon - \epsilon_\theta(x_t, t, c, c_{\text{canny}}) \|^2 \right]$$

## 3. Evaluation Metrics & Limitations

1. **SSIM (Structural Similarity Index)**: Measures structural luminance and contrast preservation.
   - *Limitation*: Can be overly penalized by changes in lighting temperature or color palette.
2. **PSNR (Peak Signal-to-Noise Ratio)**: Measures pixel MSE.
   - *Limitation*: High-frequency generative textures (e.g., brushed metal, LED reflection dots) cause low PSNR despite excellent semantic fidelity.
3. **Edge Alignment F1-Score**: Measures the direct spatial overlap of Canny edges extracted from the output compared with the input sketch.
   - *Advantage*: Best suited for assessing strict wall and rack boundary compliance.
