import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SketchData } from '../types';
import {
  UploadCloud, Sliders, RotateCw, RefreshCw, Sparkles,
  Layers, ArrowRight, SlidersHorizontal, FileImage,
  ZoomIn, ZoomOut, Maximize2, SplitSquareVertical, Eye,
  CheckCircle2, Compass, Crosshair, Cpu, Activity
} from 'lucide-react';

interface SketchStudioPageProps {
  activeProjectId: string;
  sketch: SketchData | null;
  onUpload: (file: File) => Promise<void>;
  onPreprocess: (params: any) => Promise<void>;
  onProceedToGenerate: () => void;
  onProceedToIntelligence?: () => void;
}

export const SketchStudioPage: React.FC<SketchStudioPageProps> = ({
  activeProjectId,
  sketch,
  onUpload,
  onPreprocess,
  onProceedToGenerate,
  onProceedToIntelligence,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [laserActive, setLaserActive] = useState(true);

  // Preprocessing Interactive Parameters
  const [grayscale, setGrayscale] = useState(sketch?.params?.grayscale ?? true);
  const [blurRadius, setBlurRadius] = useState(sketch?.params?.blur_radius ?? 3);
  const [contrastAlpha, setContrastAlpha] = useState(sketch?.params?.contrast_alpha ?? 1.3);
  const [brightnessBeta, setBrightnessBeta] = useState(sketch?.params?.brightness_beta ?? 10);
  const [cannyLow, setCannyLow] = useState(sketch?.params?.canny_low_thresh ?? 50);
  const [cannyHigh, setCannyHigh] = useState(sketch?.params?.canny_high_thresh ?? 150);
  const [invert, setInvert] = useState(sketch?.params?.invert ?? false);
  const [rotation, setRotation] = useState(sketch?.params?.rotation ?? 0);

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await onUpload(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await onUpload(file);
    }
  };

  const applyPreprocessing = async () => {
    setIsProcessing(true);
    try {
      await onPreprocess({
        grayscale,
        blur_radius: blurRadius,
        contrast_alpha: contrastAlpha,
        brightness_beta: brightnessBeta,
        canny_low_thresh: cannyLow,
        canny_high_thresh: cannyHigh,
        invert,
        rotation,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const rotateImage = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-warm-ivory">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-electric-teal font-semibold flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              Optical CV Inspection
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-electric-teal/10 border border-electric-teal/30 text-electric-teal">
              ControlNet Ready
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-warm-ivory mt-1">
            Sketch Studio & OpenCV Filtering
          </h1>
          <p className="text-xs text-muted-silver mt-1 max-w-2xl">
            Bilateral hysteresis filtering and boundary normalization for SDXL ControlNet structural conditioning and spatial reconstruction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-titanium-charcoal/80 hover:bg-titanium-charcoal text-warm-ivory text-xs font-mono border border-white/10 hover:border-electric-teal/40 transition-all cursor-pointer shadow-xs"
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-electric-teal" />
            <span>{showComparison ? 'Exit Split View' : 'Compare Split View'}</span>
          </button>

          <button
            onClick={onProceedToIntelligence || onProceedToGenerate}
            className="btn-primary-teal flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,214,201,0.25)] hover:shadow-[0_0_25px_rgba(0,214,201,0.4)] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Extract Geometry & Layout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Upload & Scanner Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all overflow-hidden group ${
          isDragging
            ? 'border-electric-teal bg-electric-teal/10 shadow-[0_0_30px_rgba(0,214,201,0.2)]'
            : 'border-white/15 hover:border-electric-teal/50 bg-graphite/60 backdrop-blur-md'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Ambient Laser Beam Scanner overlay in upload zone */}
        <div className="pointer-events-none absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity">
          <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-electric-teal to-transparent animate-pulse" />
        </div>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-titanium-charcoal/80 border border-white/10 flex items-center justify-center text-electric-teal mb-4 shadow-[0_0_20px_rgba(0,214,201,0.15)] group-hover:scale-105 transition-transform">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-xl font-bold text-warm-ivory mb-1">
          Drop hand-drawn floor sketch, or <span className="text-electric-teal underline font-semibold">browse file</span>
        </h3>
        <p className="text-xs text-muted-silver max-w-md mx-auto">
          Supports PNG, JPG, JPEG, WEBP. Architectural floor concepts, whiteboard schematics, or CAD exports.
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-mono text-muted-silver/60">
          <span>PIXEL BOUNDS: UNCONSTRAINED</span>
          <span>&bull;</span>
          <span>HYSTERESIS: ADAPTIVE</span>
          <span>&bull;</span>
          <span>OPENCV 4.8</span>
        </div>
      </div>

      {/* BEFORE / AFTER COMPARISON SLIDER VIEW (IF TOGGLED) */}
      <AnimatePresence>
        {showComparison && sketch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-5 border border-white/10 bg-graphite/80 backdrop-blur-md space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono text-electric-teal font-bold flex items-center gap-2 uppercase">
                <Eye className="w-4 h-4" />
                Interactive Telemetry: Input Blueprint vs Canny Edge Map
              </span>
              <span className="text-xs font-mono text-muted-silver">Drag divider to inspect edge alignment</span>
            </div>

            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden border border-white/15 bg-obsidian select-none">
              {/* Background: Canny Edges */}
              <img
                src={sketch.canny_url || '/images/p2_perspective_conditioning_canny.png'}
                alt="Canny Edges"
                className="absolute inset-0 w-full h-full object-contain"
              />
              <div className="absolute top-3 right-3 bg-obsidian/90 text-electric-teal text-[11px] font-mono px-3 py-1 rounded-md border border-electric-teal/30 font-bold backdrop-blur-md">
                OpenCV Canny Edge Map (ControlNet Input)
              </div>

              {/* Foreground: Original drawing */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <div className="w-full h-full bg-graphite/95 relative border-r-2 border-electric-teal flex items-center justify-center">
                  <img
                    src={sketch.original_url}
                    alt="Original Sketch"
                    className="w-full h-full object-contain"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                  <div className="absolute top-3 left-3 bg-obsidian/90 text-warm-ivory text-[11px] font-mono px-3 py-1 rounded-md border border-white/10 font-bold backdrop-blur-md">
                    Raw Input Drawing
                  </div>
                </div>
              </div>

              {/* Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-electric-teal cursor-ew-resize flex items-center justify-center z-20 shadow-[0_0_12px_#00D6C9]"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-electric-teal text-obsidian flex items-center justify-center shadow-lg border-2 border-obsidian font-bold">
                  <Sliders className="w-4 h-4 rotate-90" />
                </div>
              </div>

              <input
                type="range"
                min="5"
                max="95"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                aria-label="Comparison slider"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-WAY PREVIEW DISPLAY WITH LASER SCAN BEAM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Preview 1: Original Sketch */}
        <div className="nexus-panel rounded-2xl p-5 border border-white/10 bg-graphite/80 backdrop-blur-md space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-warm-ivory font-bold flex items-center gap-1.5">
              <FileImage className="w-3.5 h-3.5 text-electric-teal" />
              1. ORIGINAL BLUEPRINT
            </span>
            <span className="text-[10px] font-mono text-muted-silver px-2 py-0.5 rounded bg-white/5 border border-white/10">
              Input
            </span>
          </div>

          <div className="w-full aspect-[4/3] bg-obsidian/80 rounded-xl overflow-hidden border border-white/10 relative flex items-center justify-center group-hover:border-electric-teal/30 transition-colors">
            {sketch?.original_url ? (
              <>
                <img
                  src={sketch.original_url}
                  alt="Original Sketch"
                  className="w-full h-full object-contain transition-transform duration-300"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoomLevel})`,
                  }}
                />

                {/* Animated Horizontal Laser Scanner Line */}
                {laserActive && (
                  <motion.div
                    className="pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-electric-teal to-transparent shadow-[0_0_12px_#00D6C9]"
                    animate={{
                      top: ['5%', '95%', '5%'],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </>
            ) : (
              <div className="text-xs text-muted-silver/60 font-mono">No blueprint loaded</div>
            )}

            {/* Corner Crosshair HUD marks */}
            <div className="pointer-events-none absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-electric-teal/40" />
            <div className="pointer-events-none absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-electric-teal/40" />
            <div className="pointer-events-none absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-electric-teal/40" />
            <div className="pointer-events-none absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-electric-teal/40" />
          </div>
        </div>

        {/* Preview 2: Processed Sketch */}
        <div className="nexus-panel rounded-2xl p-5 border border-white/10 bg-graphite/80 backdrop-blur-md space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-warm-ivory font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-champagne-bronze" />
              2. BILATERAL FILTERED
            </span>
            <span className="text-[10px] font-mono text-champagne-bronze px-2 py-0.5 rounded bg-champagne-bronze/10 border border-champagne-bronze/30 font-semibold">
              CLAHE / Contrast
            </span>
          </div>

          <div className="w-full aspect-[4/3] bg-obsidian/80 rounded-xl overflow-hidden border border-white/10 relative flex items-center justify-center group-hover:border-champagne-bronze/30 transition-colors">
            {sketch?.preprocessed_url ? (
              <img
                src={sketch.preprocessed_url}
                alt="Preprocessed Sketch"
                className="w-full h-full object-contain"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            ) : (
              <div className="text-xs text-muted-silver/60 font-mono">Awaiting filter execution...</div>
            )}

            {/* Corner Crosshair HUD marks */}
            <div className="pointer-events-none absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-champagne-bronze/40" />
            <div className="pointer-events-none absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-champagne-bronze/40" />
            <div className="pointer-events-none absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-champagne-bronze/40" />
            <div className="pointer-events-none absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-champagne-bronze/40" />
          </div>
        </div>

        {/* Preview 3: Canny Edge Map */}
        <div className="nexus-panel rounded-2xl p-5 border border-electric-teal/30 bg-graphite/80 backdrop-blur-md space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-electric-teal font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-electric-teal" />
              3. CANNY EDGE MAP
            </span>
            <span className="text-[10px] font-mono text-electric-teal px-2 py-0.5 rounded bg-electric-teal/10 border border-electric-teal/30 font-bold">
              ControlNet Input
            </span>
          </div>

          <div className="w-full aspect-[4/3] bg-obsidian rounded-xl overflow-hidden border border-electric-teal/20 relative flex items-center justify-center group-hover:border-electric-teal/50 transition-colors">
            {sketch?.canny_url ? (
              <img
                src={sketch.canny_url}
                alt="Canny Edge Map"
                className="w-full h-full object-contain"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            ) : (
              <div className="text-xs text-muted-silver/60 font-mono">Extracting edge contours...</div>
            )}

            {/* Corner Crosshair HUD marks */}
            <div className="pointer-events-none absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-electric-teal" />
            <div className="pointer-events-none absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-electric-teal" />
            <div className="pointer-events-none absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-electric-teal" />
            <div className="pointer-events-none absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-electric-teal" />
          </div>
        </div>
      </div>

      {/* INTERACTIVE CONTROLS TOOLBAR */}
      <div className="nexus-panel p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-warm-ivory flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-electric-teal" />
              OpenCV Edge Preprocessing Parameters
            </h3>
            <p className="text-xs text-muted-silver mt-0.5">
              Tune bilateral hysteresis thresholds and contrast parameters for precision ControlNet line conditioning.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center rounded-lg border border-white/10 bg-titanium-charcoal/80 p-1 gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))))}
                className="p-1.5 rounded text-muted-silver hover:text-warm-ivory hover:bg-white/5 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-2 text-warm-ivory font-bold">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.0, Number((z + 0.2).toFixed(1))))}
                className="p-1.5 rounded text-muted-silver hover:text-warm-ivory hover:bg-white/5 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={rotateImage}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-titanium-charcoal/80 hover:bg-titanium-charcoal text-warm-ivory text-xs font-mono border border-white/10 hover:border-electric-teal/30 cursor-pointer transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-electric-teal" />
              <span>Rotate ({rotation}°)</span>
            </button>

            <button
              onClick={applyPreprocessing}
              disabled={isProcessing}
              className="btn-primary-teal flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs font-mono tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(0,214,201,0.2)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'APPLYING FILTERS...' : 'APPLY FILTERS'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          {/* Canny Low Threshold */}
          <div className="space-y-2 p-3.5 rounded-xl bg-titanium-charcoal/40 border border-white/5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-silver">Canny Low Threshold</span>
              <span className="text-electric-teal font-bold">{cannyLow}</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              value={cannyLow}
              onChange={(e) => setCannyLow(Number(e.target.value))}
              className="w-full accent-electric-teal bg-white/10 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-muted-silver/60 block font-mono">Filters weak edge noise below this threshold</span>
          </div>

          {/* Canny High Threshold */}
          <div className="space-y-2 p-3.5 rounded-xl bg-titanium-charcoal/40 border border-white/5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-silver">Canny High Threshold</span>
              <span className="text-electric-teal font-bold">{cannyHigh}</span>
            </div>
            <input
              type="range"
              min="50"
              max="255"
              value={cannyHigh}
              onChange={(e) => setCannyHigh(Number(e.target.value))}
              className="w-full accent-electric-teal bg-white/10 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-muted-silver/60 block font-mono">Locks definitive wall & rack contours</span>
          </div>

          {/* Contrast Alpha */}
          <div className="space-y-2 p-3.5 rounded-xl bg-titanium-charcoal/40 border border-white/5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-silver">Contrast (Alpha)</span>
              <span className="text-champagne-bronze font-bold">{contrastAlpha}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={contrastAlpha}
              onChange={(e) => setContrastAlpha(Number(e.target.value))}
              className="w-full accent-champagne-bronze bg-white/10 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-muted-silver/60 block font-mono">Enhances faint pencil lines</span>
          </div>

          {/* Gaussian Blur Kernel */}
          <div className="space-y-2 p-3.5 rounded-xl bg-titanium-charcoal/40 border border-white/5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-silver">Denoising (Blur Radius)</span>
              <span className="text-controlled-emerald font-bold">{blurRadius}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="9"
              step="2"
              value={blurRadius}
              onChange={(e) => setBlurRadius(Number(e.target.value))}
              className="w-full accent-controlled-emerald bg-white/10 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-muted-silver/60 block font-mono">Eliminates paper grain artifacts</span>
          </div>
        </div>

        {/* Toggles Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-white/10 text-xs font-mono">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-warm-ivory">
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
                className="rounded accent-electric-teal cursor-pointer"
              />
              <span>Grayscale Normalization</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-warm-ivory">
              <input
                type="checkbox"
                checked={invert}
                onChange={(e) => setInvert(e.target.checked)}
                className="rounded accent-electric-teal cursor-pointer"
              />
              <span>Invert Polarization (Black/White)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-warm-ivory">
              <input
                type="checkbox"
                checked={laserActive}
                onChange={(e) => setLaserActive(e.target.checked)}
                className="rounded accent-electric-teal cursor-pointer"
              />
              <span>Active Laser HUD Beam</span>
            </label>
          </div>

          <div className="text-[10px] text-muted-silver/60 font-mono">
            CALIBRATION: ACTIVE &bull; KERNEL: 3x3 SOBEL
          </div>
        </div>
      </div>
    </div>
  );
};
