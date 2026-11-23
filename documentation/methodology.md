# RackVision AI — Engineering Methodology & Scientific Principles

## 1. Computer Vision & Preprocessing
Hand-drawn architectural sketches suffer from non-uniform illumination, pencil stroke pressure variations, and paper texture grain.
RackVision AI applies a structured 4-step computer vision pipeline:

1. **Grayscale & Illumination Equalization**:
   $$I_{\text{gray}} = 0.299 R + 0.587 G + 0.114 B$$
   CLAHE (Contrast Limited Adaptive Histogram Equalization) divides the image into $8 \times 8$ contextual tiles to prevent noise over-amplification in uniform areas.

2. **Denoising with Gaussian Kernel**:
   Gaussian convolution filters high-frequency paper grain while maintaining line continuity:
   $$G(x, y) = \frac{1}{2\pi \sigma^2} e^{-\frac{x^2+y^2}{2\sigma^2}}$$

3. **Canny Edge Detection**:
   - Calculates intensity gradients $G = \sqrt{G_x^2 + G_y^2}$ and orientation $\theta = \arctan(G_y / G_x)$.
   - Performs Non-Maximum Suppression (NMS) to thin edge ridges to 1-pixel width.
   - Applies Hysteresis Thresholding with dual thresholds:
     - Weak edges between $T_{\text{low}}$ and $T_{\text{high}}$ are preserved only if connected to strong edges $> T_{\text{high}}$.

## 2. ControlNet Structural Conditioning
Standard text-to-image diffusion models cannot preserve strict physical floor plans because text prompts lack geometric coordinates.
ControlNet locks the original Stable Diffusion weights and introduces trainable zero-convolution layers that inject structural Canny edge guidance directly into the U-Net encoding and decoding blocks:
$$y = \mathcal{F}(x; \Theta) + \mathcal{Z}(c; \Theta_{z})$$
Where $c$ represents the Canny edge condition map and $\mathcal{Z}$ denotes the zero-initialized convolution operator.

## 3. Data Center Engineering Standards Compliance

### A. ASHRAE TC 9.9 (2021) Thermal Guidelines
- **Recommended Temperature**: 18.0°C to 27.0°C (64.4°F to 80.6°F) at server inlet.
- **Recommended Humidity**: 5.5°C Dew Point to 60% Relative Humidity.
- **Containment Separation**: Cold-aisle or hot-aisle containment is mandated to eliminate recirculation and lower required chiller lift.

### B. Power Usage Effectiveness (PUE)
$$\text{PUE} = \frac{\text{Total Facility Power}}{\text{IT Equipment Power}} = \frac{P_{\text{IT}} + P_{\text{Cooling}} + P_{\text{Electrical Losses}} + P_{\text{Aux}}}{P_{\text{IT}}}$$
In RackVision AI, baseline cold-aisle contained facilities achieve target PUE between 1.20 and 1.25.

### C. ANSI/TIA-942 Tier Topology
- **Tier III Concurrently Maintainable**: Dual electrical paths (A+B feeds), redundant CRAC cooling ($N+1$), and dual-corded server power supplies.
