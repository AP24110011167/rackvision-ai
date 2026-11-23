import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, ArrowRight, Layers, Cpu, Activity, ShieldCheck,
  CheckCircle2, Box, Eye, Sliders, Server, Zap, BarChart3,
  FileSpreadsheet, Terminal, ChevronRight, Sparkles, Building2,
  HardHat, RefreshCw, Lock, Shield, Thermometer, ExternalLink,
  ChevronDown, Play, Check, FileText, Maximize2, X, Download
} from 'lucide-react';
import { NexusHeroCanvas } from '../components/simulator/NexusHeroCanvas';
import { BeforeAfterSlider } from '../components/design/BeforeAfterSlider';

interface LandingPageProps {
  onStartProject: () => void;
  onExplore: () => void;
  onNavigateToAuth: (view: 'login' | 'register') => void;
  onNavigateToAdmin: () => void;
  onReplayIntro?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartProject,
  onExplore,
  onNavigateToAuth,
  onNavigateToAdmin,
  onReplayIntro,
}) => {
  // Navigation & Interactive states
  const [activeTabOutput, setActiveTabOutput] = useState<'output1' | 'output2' | 'output3'>('output3');
  const [activeViewpoint, setActiveViewpoint] = useState<'view_a' | 'view_b' | 'view_c'>('view_a');
  const [pipelineStage, setPipelineStage] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; desc: string } | null>(null);

  // Deliverables data for Output 3 Viewpoints
  const viewpointDeliverables = {
    view_a: {
      url: '/images/p2_view_a_elevated_overview_master.png',
      badge: 'VIEW A &bull; ELEVATED 3/4 OVERVIEW',
      title: 'Full Facility Architecture &bull; 49.6 m² Serverraum + Technikspange',
      lens: '16mm Equiv &bull; 82° FOV &bull; 1080p Master PBR + SDXL',
      desc: 'High vantage perspective capturing 49.6 m² white space, dual rows of 6 enterprise 42U cabinets, and dedicated technical utility plant separated by a T30 partition wall.',
      telemetry: { accuracy: '100.0%', racks: '12 (2×6)', cooling: '3× 15kW UKG', pue: '1.14' }
    },
    view_b: {
      url: '/images/p2_view_b_server_room_master.png',
      badge: 'VIEW B &bull; SERVER ROOM PERSPECTIVE',
      title: 'Symmetrical Server-Room Corridor &bull; Cold-Aisle Containment',
      lens: '35mm Equiv &bull; 76° FOV &bull; 1080p Master PBR + SDXL',
      desc: 'Eye-level cold-aisle perspective along two rows of 6 enterprise 42U cabinets with perforated mesh doors (RAL 7021), Tate HPL floor tiles, and overhead cable routing.',
      telemetry: { accuracy: '100.0%', containment: '1.5m Cold Aisle', leds: 'Dual Cyan/Teal', pue: '1.14' }
    },
    view_c: {
      url: '/images/p2_view_c_technical_area_master.png',
      badge: 'VIEW C &bull; MEP INFRASTRUCTURE',
      title: 'Technical Utility Plant &bull; 3× 15 kW UKG Precision Cooling',
      lens: '28mm Equiv &bull; 74° FOV &bull; 1080p Master PBR + SDXL',
      desc: 'Dedicated plant showing three 15 kW UKG precision downflow cooling units, dual-path power conditioning, and interconnecting T30 fire protection door.',
      telemetry: { accuracy: '100.0%', cooling: '45 kW Total', redundancy: 'N+1 CRAC', pue: '1.14' }
    }
  };

  // Pipeline stages for Section B
  const pipelineStages = [
    {
      id: 'cv',
      step: '01',
      name: 'Computer Vision Ingestion',
      category: 'Perception Layer',
      desc: 'Ingests architectural raster sketches, blueprints, and CAD exports. Normalizes geometric distortion, perspective tilt, and sensor noise.',
      telemetry: 'Tensor [1, 3, 1024, 1024] • ResNet-50 Feature Backbone • Latency 14ms',
      badge: 'OPENCV + CV2',
    },
    {
      id: 'canny',
      step: '02',
      name: 'OpenCV Canny Edge Detection',
      category: 'Boundary Extraction',
      desc: 'Computes spatial image gradients using dual thresholding (L:50, H:150) to isolate wall envelopes, rack outlines, and clearance boundaries.',
      telemetry: 'Gradient Sobel 3×3 • Dual Hysteresis Filter • Zero Edge Bleed',
      badge: 'ADAPTIVE CANNY',
    },
    {
      id: 'ocr',
      step: '03',
      name: 'OCR & Sketch Intelligence',
      category: 'Semantic Extraction',
      desc: 'Extracts dimension callouts (e.g. 8.27m × 6.0m), room labels (Serverraum, Technikspange), and equipment designations via Tesseract & Regex.',
      telemetry: 'Accuracy: 99.4% • 49.6 m² Dimension Lock • Coordinate Mapping',
      badge: 'OCR INTELLIGENCE',
    },
    {
      id: 'layout',
      step: '04',
      name: 'Layout Conditioning Engine',
      category: 'Spatial Alignment',
      desc: 'Converts unstructured detections into Schema v1.0 layout JSON: 12 racks (2×6), 3 UKG cooling units, 1.5m hot aisle, and T30 partition wall.',
      telemetry: 'Strict Schema v1.0 • 0 Tolerance Hallucination • Ground Truth Lock',
      badge: 'LAYOUT ENGINE',
    },
    {
      id: 'sdxl',
      step: '05',
      name: 'SDXL Latent Diffusion',
      category: 'Generative Synthesis',
      desc: 'High-resolution latent diffusion model (SDXL 1.0) generating photorealistic PBR architectural materials, ambient lighting, and reflections.',
      telemetry: 'Base 6.6B Parameters • 35 DPM++ 2M Karras Steps • CFG 7.5',
      badge: 'STABLE DIFFUSION XL',
    },
    {
      id: 'controlnet',
      step: '06',
      name: 'ControlNet Canny Guidance',
      category: 'Structural Enforcement',
      desc: 'Controls latent diffusion sampling by enforcing zero-hallucination geometric compliance with 3D metric wireframes and edge contours.',
      telemetry: 'Weight: 1.0 • Conditioning Scale: 0.85 • Coordinate Lock: 100.0%',
      badge: 'CONTROLNET CANNY',
    },
    {
      id: 'pbr',
      step: '07',
      name: 'Photorealistic Master Render',
      category: 'Final Delivery',
      desc: 'Outputs 1920×1080 master architectural photography with physically accurate lighting, metallic reflections, and volumetric depth.',
      telemetry: '1920×1080 FHD • Real-ESRGAN Upscaled • Multi-View Delivery',
      badge: 'MASTER ARCHITECTURE',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090D] text-[#F4F7F8] font-sans-ui selection:bg-[#00E5CC] selection:text-[#07090D]">
      {/* 1. TOP MINIMAL COMMAND NAVIGATION */}
      <header className="sticky top-0 z-50 bg-[#07090D]/90 backdrop-blur-xl border-b border-[#C9D3DB]/12">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Wordmark */}
          <div
            className="flex items-center gap-3.5 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-lg bg-[#101720] border border-[#00E5CC]/30 text-[#00E5CC] flex items-center justify-center shadow-[0_0_20px_rgba(0,229,204,0.15)] group-hover:border-[#00E5CC] transition-colors">
              <Compass className="w-5 h-5 text-[#00E5CC]" />
            </div>
            <div>
              <div className="font-editorial text-2xl font-bold tracking-tight text-[#F4F7F8]">
                RackVision<span className="text-[#00E5CC] font-normal italic">.ai</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#C9D3DB]/60 -mt-1 font-mono-code font-semibold">
                Project Nexus &bull; Architectural Intelligence
              </div>
            </div>
          </div>

          {/* Editorial Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#C9D3DB]">
            <a href="#hero-studio" className="hover:text-[#00E5CC] transition-colors">3D Data Center</a>
            <a href="#transformation" className="hover:text-[#00E5CC] transition-colors">Transformation</a>
            <a href="#intelligence-engine" className="hover:text-[#00E5CC] transition-colors">Pipeline Engine</a>
            <a href="#generative-suite" className="hover:text-[#00E5CC] transition-colors">3-Output Suite</a>
            <a href="#engineering-analytics" className="hover:text-[#00E5CC] transition-colors">Engineering & CFD</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="hidden xl:flex items-center gap-1.5 text-xs font-mono-code text-[#C9D3DB] hover:text-[#00E5CC] border border-[#C9D3DB]/20 rounded-lg px-3 py-2 transition-all hover:border-[#00E5CC]/40 bg-[#101720]/60 cursor-pointer"
                title="Watch Cinematic Intro Again"
              >
                <Play className="w-3 h-3 text-[#00E5CC]" />
                <span>Replay Intro</span>
              </button>
            )}

            <button
              onClick={() => onNavigateToAuth('login')}
              className="text-sm font-medium text-[#C9D3DB] hover:text-[#00E5CC] px-3 py-2 transition-colors cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={onNavigateToAdmin}
              className="hidden sm:flex items-center gap-1.5 text-xs font-mono-code text-[#C9D3DB] hover:text-[#00E5CC] border border-[#C9D3DB]/20 rounded-lg px-3 py-2 transition-colors cursor-pointer bg-[#101720]"
              title="Enterprise Administrative Console"
            >
              <Shield className="w-3.5 h-3.5 text-[#00E5CC]" />
              <span>Admin</span>
            </button>

            <button
              onClick={onStartProject}
              className="btn-nexus-teal px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Explore Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO EXPERIENCE */}
      <section id="hero-studio" className="relative min-h-[92vh] flex flex-col justify-between pt-12 pb-16 px-6 overflow-hidden nexus-grid-radial">
        {/* Floating Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#00E5CC]/8 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
          {/* Subtle Tagline Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#101720]/90 border border-[#00E5CC]/30 text-[#00E5CC] text-xs font-mono-code tracking-widest uppercase mb-8 shadow-[0_0_20px_rgba(0,229,204,0.15)]"
          >
            <span className="w-2 h-2 rounded-full bg-[#00E5CC] animate-ping" />
            <span>ARCHITECTURAL INTELLIGENCE &bull; MISSION-CRITICAL COMPUTING</span>
          </motion.div>

          {/* Majestic Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-editorial text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#F4F7F8] max-w-5xl leading-[1.08] mb-6"
          >
            ENGINEERING THE INTELLIGENCE BEHIND TOMORROW’S DATA CENTERS.
          </motion.h1>

          {/* Supporting Statement */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-[#C9D3DB] max-w-3xl leading-relaxed font-light mb-10"
          >
            Transform architectural concepts into intelligent, photorealistic data-center environments through generative AI, computational design and engineering intelligence.
          </motion.p>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-14"
          >
            <button
              onClick={onStartProject}
              className="btn-nexus-teal px-8 py-4 rounded-lg text-sm font-semibold tracking-wider uppercase flex items-center gap-3 cursor-pointer shadow-[0_0_30px_rgba(0,229,204,0.3)] w-full sm:w-auto justify-center"
            >
              <span>EXPLORE THE ENGINEERING STUDIO</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const target = document.getElementById('transformation');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-nexus-outline px-8 py-4 rounded-lg text-sm font-medium tracking-wider uppercase flex items-center gap-3 cursor-pointer w-full sm:w-auto justify-center"
            >
              <Play className="w-4 h-4 text-[#00E5CC]" />
              <span>WATCH THE EXPERIENCE</span>
            </button>
          </motion.div>
        </div>

        {/* 3D Data Center Hero Canvas Container */}
        <div className="max-w-7xl mx-auto w-full h-[520px] md:h-[620px] rounded-2xl overflow-hidden border border-[#C9D3DB]/15 relative shadow-[0_20px_60px_rgba(0,0,0,0.8)] bg-[#07090D]">
          <NexusHeroCanvas />
        </div>

        {/* Scroll Indicator */}
        <div className="max-w-7xl mx-auto w-full pt-10 flex flex-col items-center">
          <a
            href="#transformation"
            className="flex flex-col items-center gap-2 text-[#C9D3DB]/60 hover:text-[#00E5CC] transition-colors font-mono-code text-xs uppercase tracking-widest group"
          >
            <span>SCROLL TO EXPLORE ARCHITECTURAL JOURNEY</span>
            <div className="w-5 h-8 rounded-full border border-[#C9D3DB]/30 flex items-start justify-center p-1 group-hover:border-[#00E5CC]">
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1.5 h-2 rounded-full bg-[#00E5CC]"
              />
            </div>
          </a>
        </div>
      </section>

      {/* 3. SECTION A — THE TRANSFORMATION */}
      <section id="transformation" className="py-28 px-6 border-t border-[#C9D3DB]/12 bg-[#0B0F15] relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#00E5CC]/10 text-[#00E5CC] text-xs font-mono-code uppercase tracking-wider mb-4 border border-[#00E5CC]/25">
              <span>SECTION A &bull; GROUND-TRUTH RECONSTRUCTION</span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-[#F4F7F8] mb-4">
              From Blueprint Sketch to Photorealistic Digital Twin.
            </h2>
            <p className="text-base sm:text-lg text-[#C9D3DB] leading-relaxed">
              Every data center generation is anchored directly to physical geometry. Inspect the exact CAD coordinate lock comparing the architectural layout plan with the synthesized 1080p master render.
            </p>
          </div>

          {/* Interactive Before & After Slider */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <BeforeAfterSlider
                beforeImage="/images/p2_perspective_conditioning_canny.png"
                afterImage="/images/p2_view_a_elevated_overview_master.png"
                beforeLabel="Input CAD Edge Wireframe (OpenCV Canny)"
                afterLabel="PBR + SDXL Master Architectural Render"
                onExpand={() =>
                  setLightboxImage({
                    url: '/images/p2_view_a_elevated_overview_master.png',
                    title: 'Output 3: Master Architectural Render',
                    desc: '49.6 m² Serverraum with dual rows of 6 enterprise 42U racks, hot aisle containment, and Technikspange plant.',
                  })
                }
              />
            </div>

            {/* Architectural Telemetry Breakdown */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="nexus-glass p-6 rounded-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#C9D3DB]/10 mb-4">
                  <span className="text-xs font-mono-code text-[#00E5CC] uppercase tracking-wider font-semibold">
                    PHYSICAL FACILITY SPECS
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-[#00B894]/15 text-[#00B894] border border-[#00B894]/30">
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-3.5 text-xs font-mono-code text-[#C9D3DB]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9D3DB]/60">Room Footprint</span>
                    <span className="text-[#F4F7F8] font-semibold">8.27m × 6.0m (49.6 m²)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9D3DB]/60">Server Cabinets</span>
                    <span className="text-[#00E5CC] font-bold">12 Racks (2 Rows of 6, 42U)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9D3DB]/60">Cooling System</span>
                    <span className="text-[#F4F7F8] font-semibold">3× 15 kW UKG Precision CRAC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9D3DB]/60">Containment Geometry</span>
                    <span className="text-[#62DDF5]">1.5m Dedicated Hot Aisle</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9D3DB]/60">Fire Separation</span>
                    <span className="text-[#F4F7F8]">T30 Partition Wall</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C9D3DB]/60">Geometric Lock</span>
                    <span className="text-[#00B894] font-bold">±0.0mm Coordinate Tolerance</span>
                  </div>
                </div>
              </div>

              <div className="nexus-panel p-5 rounded-xl border-l-4 border-l-[#00E5CC]">
                <p className="text-xs text-[#C9D3DB] leading-relaxed">
                  <strong className="text-[#F4F7F8]">Zero Hallucination Guarantee:</strong> The ControlNet Canny pipeline extracts bounding coordinates from the uploaded blueprint and locks every rack cabinet into fixed 3D space before diffusion sampling begins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION B — THE INTELLIGENCE ENGINE (PIPELINE) */}
      <section id="intelligence-engine" className="py-28 px-6 border-t border-[#C9D3DB]/12 bg-[#07090D] relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#62DDF5]/10 text-[#62DDF5] text-xs font-mono-code uppercase tracking-wider mb-4 border border-[#62DDF5]/25">
              <span>SECTION B &bull; COMPUTATIONAL PIPELINE</span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-[#F4F7F8] mb-4">
              The 7-Stage Intelligence Pipeline.
            </h2>
            <p className="text-base sm:text-lg text-[#C9D3DB] leading-relaxed">
              Explore the mathematical architecture transforming hand-drawn strokes and CAD drafts into photorealistic engineering twins. Click through each pipeline stage to inspect tensor operations.
            </p>
          </div>

          {/* Interactive Pipeline Navigation Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-8">
            {pipelineStages.map((st, idx) => {
              const isActive = pipelineStage === idx;
              return (
                <button
                  key={st.id}
                  onClick={() => setPipelineStage(idx)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#111E2A] border-[#00E5CC] shadow-[0_0_20px_rgba(0,229,204,0.2)]'
                      : 'bg-[#101720]/70 border-[#C9D3DB]/10 hover:border-[#00E5CC]/40 hover:bg-[#101720]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-mono-code ${isActive ? 'text-[#00E5CC] font-bold' : 'text-[#C9D3DB]/50'}`}>
                      {st.step}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5CC]" style={{ opacity: isActive ? 1 : 0.2 }} />
                  </div>
                  <div className={`text-xs font-semibold tracking-tight truncate ${isActive ? 'text-[#F4F7F8]' : 'text-[#C9D3DB]'}`}>
                    {st.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Detailed Deep Dive Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pipelineStage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="nexus-panel p-8 rounded-2xl border border-[#00E5CC]/30 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded bg-[#00E5CC]/15 text-[#00E5CC] text-xs font-mono-code font-bold border border-[#00E5CC]/30">
                    STAGE {pipelineStages[pipelineStage].step}
                  </span>
                  <span className="text-xs font-mono-code text-[#C9D3DB]/70 uppercase tracking-wider">
                    {pipelineStages[pipelineStage].category}
                  </span>
                </div>

                <h3 className="font-editorial text-3xl font-bold text-[#F4F7F8]">
                  {pipelineStages[pipelineStage].name}
                </h3>

                <p className="text-sm md:text-base text-[#C9D3DB] leading-relaxed">
                  {pipelineStages[pipelineStage].desc}
                </p>

                <div className="p-4 rounded-lg bg-[#07090D] border border-[#C9D3DB]/15 font-mono-code text-xs text-[#62DDF5] space-y-1">
                  <div className="text-[10px] text-[#C9D3DB]/50 uppercase tracking-widest">
                    SYSTEM EXECUTION TELEMETRY
                  </div>
                  <div className="text-emerald-400 font-medium">
                    &gt; {pipelineStages[pipelineStage].telemetry}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#07090D] rounded-xl border border-[#C9D3DB]/10">
                <div className="w-full flex items-center justify-between pb-3 border-b border-[#C9D3DB]/10 mb-4 text-[11px] font-mono-code text-[#C9D3DB]/60">
                  <span>PIPELINE ARTIFACT</span>
                  <span className="text-[#00E5CC]">{pipelineStages[pipelineStage].badge}</span>
                </div>

                <img
                  src={
                    pipelineStage === 0 ? '/images/p2_cad_floor_plan.png' :
                    pipelineStage === 1 ? '/images/p2_perspective_conditioning_canny.png' :
                    pipelineStage === 2 ? '/images/p2_perspective_conditioning_canny.png' :
                    pipelineStage === 3 ? '/images/p2_perspective_conditioning_canny.png' :
                    pipelineStage === 4 ? '/images/p2_view_a_elevated_overview_master.png' :
                    pipelineStage === 5 ? '/images/p2_perspective_conditioning_canny.png' :
                    '/images/p2_view_b_server_room_master.png'
                  }
                  alt={pipelineStages[pipelineStage].name}
                  className="w-full aspect-video object-cover rounded-lg border border-[#C9D3DB]/15 shadow-md cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() =>
                    setLightboxImage({
                      url: pipelineStage === 0 ? '/images/p2_cad_floor_plan.png' :
                           pipelineStage === 1 ? '/images/p2_perspective_conditioning_canny.png' :
                           '/images/p2_view_a_elevated_overview_master.png',
                      title: pipelineStages[pipelineStage].name,
                      desc: pipelineStages[pipelineStage].desc,
                    })
                  }
                />
                <span className="text-[10px] font-mono-code text-[#C9D3DB]/50 mt-3">
                  Click preview image to inspect full-resolution tensor output
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 5. SECTION C — THE THREE-OUTPUT GENERATION SUITE */}
      <section id="generative-suite" className="py-28 px-6 border-t border-[#C9D3DB]/12 bg-[#0B0F15] relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#00B894]/10 text-[#00B894] text-xs font-mono-code uppercase tracking-wider mb-4 border border-[#00B894]/25">
              <span>SECTION C &bull; 3-OUTPUT GENERATION ENGINE</span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-[#F4F7F8] mb-4">
              Individual Output Visual Identities.
            </h2>
            <p className="text-base sm:text-lg text-[#C9D3DB] leading-relaxed">
              RackVision AI delivers three distinct, complementary deliverables for every project: Technical Blueprint Linework, Photorealistic Interior Concept, and the Final Ultra-Realistic Master Render.
            </p>
          </div>

          {/* 3 Output Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setActiveTabOutput('output1')}
              className={`px-5 py-3 rounded-xl border text-xs font-mono-code uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTabOutput === 'output1'
                  ? 'bg-[#111E2A] border-[#00E5CC] text-[#00E5CC] shadow-[0_0_20px_rgba(0,229,204,0.2)] font-bold'
                  : 'bg-[#101720] border-[#C9D3DB]/15 text-[#C9D3DB] hover:border-[#00E5CC]/40'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>OUTPUT 1: TECHNICAL BLUEPRINT</span>
            </button>

            <button
              onClick={() => setActiveTabOutput('output2')}
              className={`px-5 py-3 rounded-xl border text-xs font-mono-code uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTabOutput === 'output2'
                  ? 'bg-[#111E2A] border-[#62DDF5] text-[#62DDF5] shadow-[0_0_20px_rgba(98,221,245,0.2)] font-bold'
                  : 'bg-[#101720] border-[#C9D3DB]/15 text-[#C9D3DB] hover:border-[#62DDF5]/40'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>OUTPUT 2: PHOTOREALISTIC INTERIOR</span>
            </button>

            <button
              onClick={() => setActiveTabOutput('output3')}
              className={`px-5 py-3 rounded-xl border text-xs font-mono-code uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTabOutput === 'output3'
                  ? 'bg-[#111E2A] border-[#00B894] text-[#00B894] shadow-[0_0_20px_rgba(0,184,148,0.2)] font-bold'
                  : 'bg-[#101720] border-[#C9D3DB]/15 text-[#C9D3DB] hover:border-[#00B894]/40'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>OUTPUT 3: FINAL ARCHITECTURAL MASTER</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="nexus-glass p-8 rounded-2xl border border-[#C9D3DB]/15">
            {activeTabOutput === 'output1' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <img
                    src="/images/p2_perspective_conditioning_canny.png"
                    alt="Output 1: Technical Architectural Blueprint"
                    className="w-full aspect-[16/10] object-cover rounded-xl border border-[#00E5CC]/30 shadow-2xl cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() =>
                      setLightboxImage({
                        url: '/images/p2_perspective_conditioning_canny.png',
                        title: 'Output 1: Technical Architectural Blueprint',
                        desc: 'Coordinate-locked CAD line work with 12 rack cabinet footprints, hot aisle containment boundaries, and T30 partition wall.',
                      })
                    }
                  />
                </div>
                <div className="lg:col-span-5 space-y-4">
                  <span className="px-3 py-1 rounded bg-[#00E5CC]/10 text-[#00E5CC] text-xs font-mono-code border border-[#00E5CC]/30">
                    DELIVERABLE 01
                  </span>
                  <h3 className="font-editorial text-3xl font-bold text-[#F4F7F8]">
                    Technical Architectural Blueprint
                  </h3>
                  <p className="text-sm text-[#C9D3DB] leading-relaxed">
                    Precise vector and Canny edge delineation of the facility. Accurately renders physical cabinet footprints, 19-inch mounting depths, and clearance corridors to ensure constructability.
                  </p>
                  <div className="p-4 rounded-lg bg-[#07090D] border border-[#C9D3DB]/10 text-xs font-mono-code text-[#C9D3DB] space-y-2">
                    <div>&bull; Ground-Truth Tolerance: ±0.0 mm</div>
                    <div>&bull; Cabinet Configuration: 12 × 42U Enterprise Enclosures</div>
                    <div>&bull; Clearances: 1.5m Hot Aisle &bull; 1.2m Cold Aisle</div>
                  </div>
                </div>
              </div>
            )}

            {activeTabOutput === 'output2' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <img
                    src="/images/p2_view_b_server_room_master.png"
                    alt="Output 2: Photorealistic Interior Preview"
                    className="w-full aspect-[16/10] object-cover rounded-xl border border-[#62DDF5]/30 shadow-2xl cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() =>
                      setLightboxImage({
                        url: '/images/p2_view_b_server_room_master.png',
                        title: 'Output 2: Photorealistic Interior Preview',
                        desc: '35mm perspective down the cold aisle showing perforated server cabinet mesh, floor tile grates, and overhead cable runners.',
                      })
                    }
                  />
                </div>
                <div className="lg:col-span-5 space-y-4">
                  <span className="px-3 py-1 rounded bg-[#62DDF5]/10 text-[#62DDF5] text-xs font-mono-code border border-[#62DDF5]/30">
                    DELIVERABLE 02
                  </span>
                  <h3 className="font-editorial text-3xl font-bold text-[#F4F7F8]">
                    Photorealistic Interior Preview
                  </h3>
                  <p className="text-sm text-[#C9D3DB] leading-relaxed">
                    First-pass spatial visualization delivering realistic materials, lighting atmosphere, LED activity indicators, and Tate HPL raised access flooring.
                  </p>
                  <div className="p-4 rounded-lg bg-[#07090D] border border-[#C9D3DB]/10 text-xs font-mono-code text-[#62DDF5] space-y-2">
                    <div>&bull; Ambient Lighting: 5000K Neutral Clean White</div>
                    <div>&bull; Rack Enclosures: RAL 7021 Dark Anthracite Steel</div>
                    <div>&bull; Raised Flooring: 600×600mm Conductive Vinyl Tiles</div>
                  </div>
                </div>
              </div>
            )}

            {activeTabOutput === 'output3' && (
              <div className="space-y-6">
                {/* Viewpoint Selector for Output 3 */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#C9D3DB]/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-code text-[#00B894] uppercase tracking-wider font-semibold">
                      MULTI-VIEW MASTER ANGLES:
                    </span>
                    {(['view_a', 'view_b', 'view_c'] as const).map((vKey) => (
                      <button
                        key={vKey}
                        onClick={() => setActiveViewpoint(vKey)}
                        className={`px-3 py-1.5 rounded text-xs font-mono-code uppercase transition-all cursor-pointer ${
                          activeViewpoint === vKey
                            ? 'bg-[#00B894] text-[#07090D] font-bold shadow-[0_0_15px_rgba(0,184,148,0.3)]'
                            : 'bg-[#101720] text-[#C9D3DB] hover:text-white border border-[#C9D3DB]/15'
                        }`}
                      >
                        {vKey === 'view_a' ? 'View A (Elevated)' : vKey === 'view_b' ? 'View B (Corridor)' : 'View C (Cooling)'}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-mono-code text-[#00E5CC]">
                    1920×1080 MASTER PBR + SDXL
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8 relative group">
                    <img
                      src={viewpointDeliverables[activeViewpoint].url}
                      alt={viewpointDeliverables[activeViewpoint].title}
                      className="w-full aspect-[16/10] object-cover rounded-xl border border-[#00B894]/30 shadow-2xl"
                    />
                    <button
                      onClick={() =>
                        setLightboxImage({
                          url: viewpointDeliverables[activeViewpoint].url,
                          title: viewpointDeliverables[activeViewpoint].title,
                          desc: viewpointDeliverables[activeViewpoint].desc,
                        })
                      }
                      className="absolute bottom-4 right-4 px-3 py-2 rounded-lg bg-[#07090D]/80 backdrop-blur-md border border-[#00B894]/40 text-[#00B894] text-xs font-mono-code flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Inspect 1080p Master</span>
                    </button>
                  </div>

                  <div className="lg:col-span-4 space-y-4">
                    <span className="px-3 py-1 rounded bg-[#00B894]/15 text-[#00B894] text-xs font-mono-code font-bold border border-[#00B894]/30">
                      {viewpointDeliverables[activeViewpoint].badge}
                    </span>
                    <h3 className="font-editorial text-2xl md:text-3xl font-bold text-[#F4F7F8]">
                      {viewpointDeliverables[activeViewpoint].title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#C9D3DB] leading-relaxed">
                      {viewpointDeliverables[activeViewpoint].desc}
                    </p>

                    <div className="p-4 rounded-xl bg-[#07090D] border border-[#C9D3DB]/15 space-y-2 text-xs font-mono-code text-[#C9D3DB]">
                      <div className="text-[10px] text-[#C9D3DB]/50 uppercase tracking-widest pb-1 border-b border-[#C9D3DB]/10">
                        CAMERA OPTICS & TELEMETRY
                      </div>
                      <div className="text-[#62DDF5]">
                        {viewpointDeliverables[activeViewpoint].lens}
                      </div>
                      <div className="flex justify-between text-[#C9D3DB]/80 pt-1">
                        <span>PUE Efficiency:</span>
                        <span className="text-[#00E5CC] font-bold">1.14</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. SECTION D — ENGINEERING INTELLIGENCE */}
      <section id="engineering-analytics" className="py-28 px-6 border-t border-[#C9D3DB]/12 bg-[#07090D] relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#00E5CC]/10 text-[#00E5CC] text-xs font-mono-code uppercase tracking-wider mb-4 border border-[#00E5CC]/25">
              <span>SECTION D &bull; ENTERPRISE ENGINEERING RIGOR</span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-[#F4F7F8] mb-4">
              Computational Engineering & Spatial Intelligence.
            </h2>
            <p className="text-base sm:text-lg text-[#C9D3DB] leading-relaxed">
              RackVision AI is built for mission-critical facilities engineers. Moving far beyond 2D concept rendering, every design dynamically calculates ASHRAE CFD thermal compliance, BOM bills of materials, and construction roadmaps.
            </p>
          </div>

          {/* Interactive Engineering Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. 3D Spatial Twin */}
            <div className="nexus-glass p-6 rounded-2xl nexus-glass-hover flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#00E5CC]/15 text-[#00E5CC] flex items-center justify-center mb-4 border border-[#00E5CC]/30">
                  <Box className="w-5 h-5" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#F4F7F8] mb-2">
                  3D Spatial Digital Twin
                </h3>
                <p className="text-xs sm:text-sm text-[#C9D3DB] leading-relaxed mb-6">
                  Interactive WebGL simulation allowing real-time orbit, pan, component inspection, and structural rack moves with synchronized layout persistence.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#07090D] border border-[#C9D3DB]/10 text-[11px] font-mono-code text-[#00E5CC]">
                &gt; REAL-TIME ORBIT &bull; RACK INSPECTION
              </div>
            </div>

            {/* 2. Thermal CFD Analysis */}
            <div className="nexus-glass p-6 rounded-2xl nexus-glass-hover flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#62DDF5]/15 text-[#62DDF5] flex items-center justify-center mb-4 border border-[#62DDF5]/30">
                  <Thermometer className="w-5 h-5" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#F4F7F8] mb-2">
                  Thermal CFD Heatmap
                </h3>
                <p className="text-xs sm:text-sm text-[#C9D3DB] leading-relaxed mb-6">
                  Simulates cold-aisle air delivery, rack exhaust temperatures (ΔT = 13.0°C), and recirculation risks to eliminate hotspot formation before construction.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#07090D] border border-[#C9D3DB]/10 text-[11px] font-mono-code text-[#62DDF5]">
                &gt; ΔT 13.0°C &bull; AIRFLOW PARTICLES
              </div>
            </div>

            {/* 3. ASHRAE Analytics */}
            <div className="nexus-glass p-6 rounded-2xl nexus-glass-hover flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#00B894]/15 text-[#00B894] flex items-center justify-center mb-4 border border-[#00B894]/30">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#F4F7F8] mb-2">
                  ASHRAE TC 9.9 Compliance
                </h3>
                <p className="text-xs sm:text-sm text-[#C9D3DB] leading-relaxed mb-6">
                  Calculates thermal envelopes against Class A1 through A4 standards. Verifies recommended inlet ranges (18°C–27°C) and dew-point envelopes.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#07090D] border border-[#C9D3DB]/10 text-[11px] font-mono-code text-[#00B894]">
                &gt; CLASS A1 COMPLIANT &bull; ZERO DRIFT
              </div>
            </div>

            {/* 4. Material Planner */}
            <div className="nexus-glass p-6 rounded-2xl nexus-glass-hover flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#00E5CC]/15 text-[#00E5CC] flex items-center justify-center mb-4 border border-[#00E5CC]/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#F4F7F8] mb-2">
                  Material BOM Cost Ledger
                </h3>
                <p className="text-xs sm:text-sm text-[#C9D3DB] leading-relaxed mb-6">
                  Instantly counts 42U cabinets, downflow cooling units, Tate floor tiles, and cable trays into itemized cost estimates with live export.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#07090D] border border-[#C9D3DB]/10 text-[11px] font-mono-code text-[#00E5CC]">
                &gt; AUTOMATED BILL OF MATERIALS (BOM)
              </div>
            </div>

            {/* 5. Construction Roadmap */}
            <div className="nexus-glass p-6 rounded-2xl nexus-glass-hover flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#62DDF5]/15 text-[#62DDF5] flex items-center justify-center mb-4 border border-[#62DDF5]/30">
                  <HardHat className="w-5 h-5" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#F4F7F8] mb-2">
                  10-Stage Milestone Guide
                </h3>
                <p className="text-xs sm:text-sm text-[#C9D3DB] leading-relaxed mb-6">
                  Translates approved facility geometry into a sequence of structural milestones from concrete slab leveling to commissioning and load-banking.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#07090D] border border-[#C9D3DB]/10 text-[11px] font-mono-code text-[#62DDF5]">
                &gt; 10-STAGE ENGINEERING ROADMAP
              </div>
            </div>

            {/* 6. Comprehensive PDF Dossier */}
            <div className="nexus-glass p-6 rounded-2xl nexus-glass-hover flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#00B894]/15 text-[#00B894] flex items-center justify-center mb-4 border border-[#00B894]/30">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#F4F7F8] mb-2">
                  Executive PDF Dossier
                </h3>
                <p className="text-xs sm:text-sm text-[#C9D3DB] leading-relaxed mb-6">
                  Generates an enterprise-ready engineering specification document complete with CAD diagrams, 3-output renders, CFD graphs, and BOM breakdown.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#07090D] border border-[#C9D3DB]/10 text-[11px] font-mono-code text-[#00B894]">
                &gt; 1-CLICK ENGINEERING REPORT EXPORT
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SECTION E — FINAL CALL TO ACTION */}
      <section className="py-32 px-6 border-t border-[#C9D3DB]/12 bg-[#07090D] relative overflow-hidden">
        {/* Ambient Volumetric Glow */}
        <div className="absolute inset-0 bg-radial from-[#00E5CC]/10 via-[#07090D]/80 to-[#07090D] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101720] border border-[#00E5CC]/30 text-[#00E5CC] text-xs font-mono-code tracking-widest uppercase mb-8 shadow-[0_0_20px_rgba(0,229,204,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ARCHITECTURAL INTELLIGENCE FOR TOMORROW</span>
          </div>

          <h2 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#F4F7F8] mb-6 leading-tight">
            THE FUTURE IS BUILT WITH INTELLIGENCE.
          </h2>

          <p className="text-lg md:text-xl text-[#C9D3DB] max-w-2xl leading-relaxed mb-10 font-light">
            Empower your infrastructure engineering team with zero-hallucination architectural synthesis, instant CFD modeling, and automated BOM planning.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onStartProject}
              className="btn-nexus-teal px-8 py-4 rounded-lg text-sm font-semibold tracking-wider uppercase flex items-center gap-3 cursor-pointer shadow-[0_0_30px_rgba(0,229,204,0.35)] w-full sm:w-auto justify-center"
            >
              <span>START YOUR PROJECT</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToAuth('register')}
              className="btn-nexus-outline px-8 py-4 rounded-lg text-sm font-medium tracking-wider uppercase flex items-center gap-3 cursor-pointer w-full sm:w-auto justify-center"
            >
              <span>EXPLORE THE PLATFORM</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-[#C9D3DB]/12 bg-[#05070A] py-12 px-6 text-[#C9D3DB]/60 text-xs font-mono-code">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Compass className="w-4 h-4 text-[#00E5CC]" />
            <span className="text-[#F4F7F8] font-bold">RACKVISION AI &bull; PROJECT NEXUS</span>
            <span>&bull;</span>
            <span>ENTERPRISE ARCHITECTURAL INTELLIGENCE</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onNavigateToAdmin} className="hover:text-[#00E5CC] transition-colors cursor-pointer">
              Admin Portal
            </button>
            <button onClick={() => onNavigateToAuth('login')} className="hover:text-[#00E5CC] transition-colors cursor-pointer">
              Client Login
            </button>
            <span>&copy; 2026 RACKVISION AI. ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </footer>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#07090D]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="relative max-w-6xl w-full flex flex-col items-center bg-[#101720] rounded-2xl border border-[#00E5CC]/30 overflow-hidden shadow-2xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-[#C9D3DB]/15 mb-3 px-2">
                <div>
                  <h4 className="font-editorial text-lg text-[#F4F7F8] font-bold">
                    {lightboxImage.title}
                  </h4>
                  <p className="text-xs text-[#C9D3DB]/70 font-mono-code">
                    {lightboxImage.desc}
                  </p>
                </div>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg bg-[#07090D] border border-[#C9D3DB]/20 text-[#C9D3DB] hover:text-[#00E5CC] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
