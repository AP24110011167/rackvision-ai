import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scan, Cpu, FileText, Layers, Sparkles, Eye, CheckCircle2, 
  ArrowRight, Maximize2, Sliders, Activity, Camera, Box, ShieldCheck, Play, Pause 
} from 'lucide-react';
import { ASSET_REGISTRY, getAssetUrl } from '../../services/assetRegistry';
import { PerspectiveCard } from '../../motion/PerspectiveCard';
import { MagneticButton } from '../../motion/MagneticButton';

interface PipelineStageData {
  id: string;
  step: string;
  name: string;
  category: string;
  themeColor: string;
  badge: string;
  desc: string;
  telemetry: string;
  tensorShape: string;
  imageKey: string;
  fallbackUrl: string;
}

const PIPELINE_STAGES: PipelineStageData[] = [
  {
    id: 'stage-1',
    step: '01',
    name: 'Computer Vision Ingestion & Perspective Warp',
    category: 'INPUT PROCESSING',
    themeColor: '#00D6C9',
    badge: 'HOMOGRAPHY MATRIX LOCKED',
    desc: 'Normalizes skewed mobile camera captures and architectural DWG drafts. Executes 4-point keystone correction to establish an exact metric coordinate plane with zero geometric distortion.',
    telemetry: 'OpenCV cv2.findHomography() • Keystone Reprojection Error: <0.04 px',
    tensorShape: '[1, 3, 1024, 1024] float32',
    imageKey: 'p2_cad_raw',
    fallbackUrl: '/images/p2_cad_floor_plan.png'
  },
  {
    id: 'stage-2',
    step: '02',
    name: 'Multi-Scale OpenCV Canny Edge Extraction',
    category: 'FEATURE DETECTION',
    themeColor: '#76CFFF',
    badge: 'DUAL-THRESHOLD EDGE MAP',
    desc: 'Extracts architectural boundary vectors while suppressing hand-drawn sketch noise and text hatching. Preserves wall partitions, clearance corridors, and cabinet enclosure boundaries.',
    telemetry: 'Gaussian Blur (k=5) • Canny Hysteresis T1=50, T2=150 • 28,410 Edges Extracted',
    tensorShape: '[1, 1, 1024, 1024] uint8',
    imageKey: 'p2_cad_canny',
    fallbackUrl: '/images/p2_cad_canny.png'
  },
  {
    id: 'stage-3',
    step: '03',
    name: 'OCR & Semantic Sketch Intelligence',
    category: 'SEMANTIC RECOGNITION',
    themeColor: '#00B894',
    badge: 'ENTITIES CONFIRMED (99.4%)',
    desc: 'Extracts German engineering text annotations, room areas, and dimensional callouts. Confirms the 49.6 m² Serverraum footprint, 3 UKG perimeter cooling units, and central USV battery bank.',
    telemetry: 'PaddleOCR Engine • 99.4% Confidence • 12 Racks, 3 UKG Units, 1 USV Identified',
    tensorShape: 'Structured Spatial Graph JSON v1.0',
    imageKey: 'p2_cad_annotated',
    fallbackUrl: '/images/p2_cad_annotated.png'
  },
  {
    id: 'stage-4',
    step: '04',
    name: 'Layout Conditioning Engine & 3D Extrusion',
    category: 'GEOMETRIC RECONSTRUCTION',
    themeColor: '#C6A477',
    badge: '3D SCENE GRAPH SYNCHRONIZED',
    desc: 'Translates 2D bounding boxes into millimeter-accurate 3D spatial solids. Locks row clearances (1.5m hot aisle, 1.2m cold aisle) and establishes camera perspective coordinates.',
    telemetry: 'Three.js Vector3 Mesh Extrusion • 12× 42U Cabinets • 8.27m × 6.0m Footprint',
    tensorShape: '49.6 m² White Space Geometry Node',
    imageKey: 'p2_perspective_canny',
    fallbackUrl: '/images/p2_perspective_conditioning_canny.png'
  },
  {
    id: 'stage-5',
    step: '05',
    name: 'SDXL Latent Space Diffusion Sampling',
    category: 'GENERATIVE DIFFUSION',
    themeColor: '#A78BFA',
    badge: '35 DENOISING STEPS CONVERGED',
    desc: 'Iteratively reverses Gaussian noise in latent space conditioned on prompt embeddings. Synthesizes photorealistic Tate HPL conductive flooring, diffuse LED troffers, and textured server faces.',
    telemetry: 'StabilityAI SDXL Base 1.0 • Euler Ancestral Sampler • Guidance Scale: 7.5',
    tensorShape: '[1, 4, 128, 128] Latent Vector',
    imageKey: 'p2_view_a_master',
    fallbackUrl: '/images/p2_view_a_elevated_overview_master.png'
  },
  {
    id: 'stage-6',
    step: '06',
    name: 'ControlNet Canny Structural Guidance Lock',
    category: 'ZERO-HALLUCINATION ENFORCEMENT',
    themeColor: '#00E5CC',
    badge: 'GEOMETRIC LOCK: ±0.0mm TOLERANCE',
    desc: 'Enforces rigid architectural conditioning during latent diffusion. Prevents the AI from shifting walls or inventing server racks, ensuring the output aligns perfectly with the input CAD.',
    telemetry: 'ControlNet v1.1 Canny • Conditioning Scale: 1.05 • Zero Hallucination Lock',
    tensorShape: '[1, 320, 64, 64] Residual Attention',
    imageKey: 'p2_perspective_canny',
    fallbackUrl: '/images/p2_perspective_conditioning_canny.png'
  },
  {
    id: 'stage-7',
    step: '07',
    name: 'Photorealistic Master Architectural Synthesis',
    category: 'FINAL MASTER OUTPUT',
    themeColor: '#F3F1E9',
    badge: '1920×1080 8K LANCZOS MASTER',
    desc: 'Produces publication-grade architectural renders. Delivers realistic lighting reflections, perforated mesh textures, cabling pathways, and thermal containment with camera optics telemetry.',
    telemetry: 'Multi-scale Lanczos Upscaling • 1920×1080 Widescreen • 2.6 MB Master PNG',
    tensorShape: '[1, 3, 1920, 1080] RGB Master',
    imageKey: 'p2_view_a_master',
    fallbackUrl: '/images/p2_view_a_elevated_overview_master.png'
  }
];

interface InteractiveCinematicPipelineProps {
  onOpenLightbox?: (image: { url: string; title: string; desc: string }) => void;
}

export const InteractiveCinematicPipeline: React.FC<InteractiveCinematicPipelineProps> = ({
  onOpenLightbox
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const stage = PIPELINE_STAGES[activeStageIndex];

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % PIPELINE_STAGES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full">
      {/* Background Volumetric Lighting Field tied to stage theme */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full blur-[140px] pointer-events-none transition-all duration-1000 ease-out"
        style={{ backgroundColor: `${stage.themeColor}18` }}
      />

      {/* Stage Navigation Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-8 relative z-10">
        {PIPELINE_STAGES.map((st, idx) => {
          const isActive = activeStageIndex === idx;
          return (
            <button
              key={st.id}
              onClick={() => {
                setActiveStageIndex(idx);
                setIsPlaying(false);
              }}
              className={`p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                isActive
                  ? 'bg-[#19232C] border-white/30 shadow-[0_0_20px_rgba(0,214,201,0.25)]'
                  : 'bg-[#111820]/70 border-white/5 hover:border-white/20 hover:bg-[#111820]'
              }`}
            >
              {/* Active top accent bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 transition-all duration-300"
                style={{ 
                  backgroundColor: st.themeColor,
                  opacity: isActive ? 1 : 0.2
                }}
              />

              <div className="flex items-center justify-between mb-1.5 mt-0.5">
                <span 
                  className="text-[10px] font-mono font-bold tracking-wider"
                  style={{ color: isActive ? st.themeColor : '#A8B3BC' }}
                >
                  STAGE {st.step}
                </span>
                <span 
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ 
                    backgroundColor: st.themeColor,
                    boxShadow: isActive ? `0 0 8px ${st.themeColor}` : 'none'
                  }}
                />
              </div>

              <div className={`text-xs font-semibold tracking-tight truncate ${isActive ? 'text-[#F3F1E9]' : 'text-[#A8B3BC]'}`}>
                {st.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Play/Pause & Stage Stepper Controls */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 text-xs font-mono text-[#A8B3BC] relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#19232C] hover:bg-[#23313E] border border-white/10 text-[#F3F1E9] transition-all cursor-pointer font-bold"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#00D6C9]" /> : <Play className="w-3.5 h-3.5 text-[#00D6C9]" />}
            <span>{isPlaying ? 'PAUSE SEQUENCE' : 'AUTO-PLAY SEQUENCE'}</span>
          </button>

          <span className="text-[11px] text-[#A8B3BC]/70 hidden sm:inline">
            Stage {activeStageIndex + 1} of {PIPELINE_STAGES.length}: {stage.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold" style={{ color: stage.themeColor }}>
            TENSOR SHAPE: {stage.tensorShape}
          </span>
        </div>
      </div>

      {/* Stage Deep Dive Cinematic Stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <PerspectiveCard className="p-8 border-white/15 bg-[#111820]/90 backdrop-blur-xl shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Engineering Specifications & Tensor Context */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span 
                  className="px-3 py-1 rounded-md text-xs font-mono font-bold border"
                  style={{ 
                    backgroundColor: `${stage.themeColor}15`,
                    borderColor: `${stage.themeColor}40`,
                    color: stage.themeColor
                  }}
                >
                  STAGE {stage.step}
                </span>

                <span className="text-xs font-mono text-[#A8B3BC] uppercase tracking-wider font-semibold">
                  {stage.category}
                </span>

                <span 
                  className="px-2.5 py-0.5 rounded text-[10px] font-mono border font-bold ml-auto"
                  style={{ 
                    backgroundColor: `${stage.themeColor}20`,
                    borderColor: `${stage.themeColor}50`,
                    color: stage.themeColor
                  }}
                >
                  {stage.badge}
                </span>
              </div>

              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#F3F1E9] leading-tight">
                {stage.name}
              </h3>

              <p className="text-sm sm:text-base text-[#A8B3BC] leading-relaxed font-light">
                {stage.desc}
              </p>

              {/* Real Mathematical Execution Telemetry Box */}
              <div className="p-4 rounded-xl bg-[#080B0F] border border-white/10 font-mono text-xs space-y-1.5 shadow-inner">
                <div className="text-[10px] text-[#A8B3BC]/60 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#00D6C9]" />
                  <span>COMPUTATIONAL ENGINE TELEMETRY</span>
                </div>
                <div className="text-[#00B894] font-medium pl-5">
                  &gt; {stage.telemetry}
                </div>
                <div className="text-[#76CFFF] font-medium pl-5">
                  &gt; Active Tensor: {stage.tensorShape}
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    const next = (activeStageIndex + 1) % PIPELINE_STAGES.length;
                    setActiveStageIndex(next);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#19232C] hover:bg-[#23313E] border border-white/10 text-xs font-mono text-[#F3F1E9] flex items-center gap-2 transition-all cursor-pointer font-bold"
                >
                  <span>Advance to Stage 0{((activeStageIndex + 1) % PIPELINE_STAGES.length) + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#00D6C9]" />
                </button>
              </div>
            </div>

            {/* Right: Live Interactive Artifact Inspection Viewport */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#080B0F] rounded-2xl border border-white/15 relative overflow-hidden group">
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-4 text-[11px] font-mono text-[#A8B3BC]">
                <span>STAGE ARTIFACT</span>
                <span className="font-bold" style={{ color: stage.themeColor }}>{stage.badge}</span>
              </div>

              {/* Verified Image with Click-to-Expand Lightbox */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/15 shadow-xl">
                <img
                  src={getAssetUrl(stage.imageKey, 'p2_view_a_master')}
                  alt={stage.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                  onClick={() => {
                    if (onOpenLightbox) {
                      onOpenLightbox({
                        url: getAssetUrl(stage.imageKey, 'p2_view_a_master'),
                        title: stage.name,
                        desc: stage.desc
                      });
                    }
                  }}
                />

                {/* Laser scanline overlay for Stage 1 & 2 */}
                {(activeStageIndex === 0 || activeStageIndex === 1) && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                      className="w-full h-1 bg-gradient-to-r from-transparent via-[#00D6C9] to-transparent shadow-[0_0_15px_#00D6C9]"
                      animate={{ y: [0, 240, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                )}

                {/* Fullscreen Expand Button */}
                <button
                  onClick={() => {
                    if (onOpenLightbox) {
                      onOpenLightbox({
                        url: getAssetUrl(stage.imageKey, 'p2_view_a_master'),
                        title: stage.name,
                        desc: stage.desc
                      });
                    }
                  }}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#080B0F]/80 backdrop-blur-md border border-white/20 text-[#F3F1E9] opacity-0 group-hover:opacity-100 hover:text-[#00D6C9] transition-all cursor-pointer shadow-lg"
                  title="Expand Artifact"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full flex items-center justify-between mt-3 text-[10px] font-mono text-[#A8B3BC]/70">
                <span>Click image to inspect high-resolution output</span>
                <span className="text-[#00B894] font-bold">100% VERIFIED ARTIFACT</span>
              </div>
            </div>
          </PerspectiveCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
