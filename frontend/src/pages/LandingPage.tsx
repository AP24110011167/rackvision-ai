import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, ArrowRight, Layers, Cpu, Activity, ShieldCheck,
  CheckCircle2, Box, Eye, Sliders, Server, Zap, BarChart3,
  FileSpreadsheet, Terminal, ChevronRight, Sparkles, Building2,
  HardHat, RefreshCw, Lock, Shield, Thermometer, ExternalLink,
  ChevronDown, Play, Check, FileText, Maximize2, X, Download,
  Wind, Flame, Snowflake, AlertTriangle, CheckSquare, Wrench
} from 'lucide-react';
import { NexusHeroCanvas } from '../components/simulator/NexusHeroCanvas';
import { BeforeAfterSlider } from '../components/design/BeforeAfterSlider';
import { Landing3DSimulatorSection } from '../components/simulator/Landing3DSimulatorSection';

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

  // Pipeline stages for Section 03
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
    <div className="min-h-screen bg-[#080B0F] text-[#F3F1E9] font-sans selection:bg-[#00D6C9]/20 selection:text-[#00D6C9]">
      {/* 1. TOP MINIMAL COMMAND NAVIGATION */}
      <header className="sticky top-0 z-50 bg-[#080B0F]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Wordmark */}
          <div
            className="flex items-center gap-3.5 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-10 h-10 rounded-xl bg-titanium-charcoal border border-electric-teal/30 text-electric-teal flex items-center justify-center shadow-[0_0_20px_rgba(0,214,201,0.2)] group-hover:border-electric-teal transition-colors">
              <Compass className="w-5 h-5 text-electric-teal" />
            </div>
            <div>
              <div className="font-serif text-2xl font-bold tracking-tight text-warm-ivory">
                RackVision<span className="text-electric-teal font-normal italic">.ai</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-silver/70 -mt-1 font-mono font-semibold">
                Project Nexus &bull; Architectural Intelligence
              </div>
            </div>
          </div>

          {/* Editorial Nav Links */}
          <nav className="hidden xl:flex items-center gap-7 text-xs font-mono uppercase tracking-wider text-muted-silver">
            <a href="#hero-studio" className="hover:text-electric-teal transition-colors">01. Hero</a>
            <a href="#transformation" className="hover:text-electric-teal transition-colors">02. Blueprint</a>
            <a href="#intelligence-engine" className="hover:text-electric-teal transition-colors">03. Pipeline</a>
            <a href="#generative-suite" className="hover:text-electric-teal transition-colors">04. Generative</a>
            <a href="#3d-simulator" className="hover:text-electric-teal transition-colors">05. 3D Twin</a>
            <a href="#thermal-cfd" className="hover:text-electric-teal transition-colors">06. CFD</a>
            <a href="#optimization" className="hover:text-electric-teal transition-colors">07. ASHRAE</a>
            <a href="#construction-bom" className="hover:text-electric-teal transition-colors">08. Delivery</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-silver hover:text-electric-teal border border-white/10 rounded-lg px-3 py-2 transition-all hover:border-electric-teal/40 bg-titanium-charcoal/60 cursor-pointer"
                title="Watch Cinematic Intro Again"
              >
                <Play className="w-3 h-3 text-electric-teal" />
                <span>Replay Intro</span>
              </button>
            )}

            <button
              onClick={() => onNavigateToAuth('login')}
              className="text-xs font-mono uppercase tracking-wider text-muted-silver hover:text-warm-ivory px-3 py-2 transition-colors cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={onNavigateToAdmin}
              className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-silver hover:text-electric-teal border border-white/10 rounded-lg px-3 py-2 transition-colors cursor-pointer bg-titanium-charcoal"
              title="Enterprise Administrative Console"
            >
              <Shield className="w-3.5 h-3.5 text-electric-teal" />
              <span>Admin</span>
            </button>

            <button
              onClick={onStartProject}
              className="btn-primary-teal px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 group cursor-pointer shadow-[0_0_15px_rgba(0,214,201,0.25)]"
            >
              <span>Explore Studio</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 01 — CINEMATIC HERO EXPERIENCE
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="hero-studio" className="relative min-h-[92vh] flex flex-col justify-between pt-12 pb-16 px-6 overflow-hidden">
        {/* Floating Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-electric-teal/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
          {/* Subtle Tagline Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-graphite/90 border border-electric-teal/30 text-electric-teal text-xs font-mono tracking-widest uppercase mb-8 shadow-[0_0_20px_rgba(0,214,201,0.15)]"
          >
            <span className="w-2 h-2 rounded-full bg-electric-teal animate-ping" />
            <span>ARCHITECTURAL INTELLIGENCE &bull; MISSION-CRITICAL COMPUTING</span>
          </motion.div>

          {/* Majestic Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-warm-ivory max-w-5xl leading-[1.08] mb-6"
          >
            ENGINEERING THE INTELLIGENCE BEHIND TOMORROW’S DATA CENTERS.
          </motion.h1>

          {/* Supporting Statement */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-silver max-w-3xl leading-relaxed font-light mb-10"
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
              className="btn-primary-teal px-8 py-4 rounded-xl text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-3 cursor-pointer shadow-[0_0_30px_rgba(0,214,201,0.3)] w-full sm:w-auto justify-center"
            >
              <span>EXPLORE THE ENGINEERING STUDIO</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const target = document.getElementById('transformation');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-xl text-xs font-mono font-semibold tracking-wider uppercase flex items-center gap-3 cursor-pointer w-full sm:w-auto justify-center bg-titanium-charcoal/80 hover:bg-titanium-charcoal border border-white/10 hover:border-electric-teal/40 text-warm-ivory transition-all shadow-sm"
            >
              <Play className="w-4 h-4 text-electric-teal" />
              <span>WATCH THE EXPERIENCE</span>
            </button>
          </motion.div>
        </div>

        {/* 3D Data Center Hero Canvas Container */}
        <div className="max-w-7xl mx-auto w-full h-[520px] md:h-[620px] rounded-2xl overflow-hidden border border-white/15 relative shadow-[0_20px_60px_rgba(0,0,0,0.8)] bg-obsidian">
          <NexusHeroCanvas />
        </div>

        {/* Scroll Indicator */}
        <div className="max-w-7xl mx-auto w-full pt-10 flex flex-col items-center">
          <a
            href="#transformation"
            className="flex flex-col items-center gap-2 text-muted-silver/60 hover:text-electric-teal transition-colors font-mono text-xs uppercase tracking-widest group"
          >
            <span>SCROLL TO EXPLORE ARCHITECTURAL JOURNEY</span>
            <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1 group-hover:border-electric-teal">
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1.5 h-2 rounded-full bg-electric-teal"
              />
            </div>
          </a>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 02 — ARCHITECTURAL TRANSFORMATION
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="transformation" className="py-28 px-6 border-t border-white/10 bg-graphite/40 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-electric-teal/10 text-electric-teal text-xs font-mono uppercase tracking-wider mb-4 border border-electric-teal/25">
              <span>SECTION 02 &bull; GROUND-TRUTH RECONSTRUCTION</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-warm-ivory mb-4">
              From Blueprint Sketch to Photorealistic Digital Twin.
            </h2>
            <p className="text-base sm:text-lg text-muted-silver leading-relaxed">
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
              <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <span className="text-xs font-mono text-electric-teal uppercase tracking-wider font-semibold">
                    PHYSICAL FACILITY SPECS
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-controlled-emerald/15 text-controlled-emerald border border-controlled-emerald/30 font-bold">
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-3.5 text-xs font-mono text-muted-silver">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-silver/60">Room Footprint</span>
                    <span className="text-warm-ivory font-semibold">8.27m × 6.0m (49.6 m²)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-silver/60">Server Cabinets</span>
                    <span className="text-electric-teal font-bold">12 Racks (2 Rows of 6, 42U)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-silver/60">Cooling System</span>
                    <span className="text-warm-ivory font-semibold">3× 15 kW UKG Precision CRAC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-silver/60">Containment Geometry</span>
                    <span className="text-ice-blue">1.5m Dedicated Hot Aisle</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-silver/60">Fire Separation</span>
                    <span className="text-warm-ivory">T30 Partition Wall</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-silver/60">Geometric Lock</span>
                    <span className="text-controlled-emerald font-bold">±0.0mm Coordinate Tolerance</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border-l-4 border-l-electric-teal bg-titanium-charcoal/60 border border-white/10">
                <p className="text-xs text-muted-silver leading-relaxed">
                  <strong className="text-warm-ivory">Zero Hallucination Guarantee:</strong> The ControlNet Canny pipeline extracts bounding coordinates from the uploaded blueprint and locks every rack cabinet into fixed 3D space before diffusion sampling begins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 03 — ENGINEERING INTELLIGENCE (THE 7-STAGE PIPELINE)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="intelligence-engine" className="py-28 px-6 border-t border-white/10 bg-[#080B0F] relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-ice-blue/10 text-ice-blue text-xs font-mono uppercase tracking-wider mb-4 border border-ice-blue/25">
              <span>SECTION 03 &bull; COMPUTATIONAL PIPELINE</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-warm-ivory mb-4">
              The 7-Stage Intelligence Pipeline.
            </h2>
            <p className="text-base sm:text-lg text-muted-silver leading-relaxed">
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
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-titanium-charcoal border-electric-teal shadow-[0_0_20px_rgba(0,214,201,0.2)]'
                      : 'bg-graphite/70 border-white/5 hover:border-electric-teal/40 hover:bg-graphite'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-mono ${isActive ? 'text-electric-teal font-bold' : 'text-muted-silver/50'}`}>
                      {st.step}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-electric-teal" style={{ opacity: isActive ? 1 : 0.2 }} />
                  </div>
                  <div className={`text-xs font-semibold tracking-tight truncate ${isActive ? 'text-warm-ivory' : 'text-muted-silver'}`}>
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
              className="p-8 rounded-2xl border border-electric-teal/30 bg-graphite/80 backdrop-blur-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xl"
            >
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-md bg-electric-teal/15 text-electric-teal text-xs font-mono font-bold border border-electric-teal/30">
                    STAGE {pipelineStages[pipelineStage].step}
                  </span>
                  <span className="text-xs font-mono text-muted-silver uppercase tracking-wider">
                    {pipelineStages[pipelineStage].category}
                  </span>
                </div>

                <h3 className="font-serif text-3xl font-bold text-warm-ivory">
                  {pipelineStages[pipelineStage].name}
                </h3>

                <p className="text-sm md:text-base text-muted-silver leading-relaxed">
                  {pipelineStages[pipelineStage].desc}
                </p>

                <div className="p-4 rounded-xl bg-obsidian border border-white/10 font-mono text-xs text-ice-blue space-y-1">
                  <div className="text-[10px] text-muted-silver/60 uppercase tracking-widest">
                    SYSTEM EXECUTION TELEMETRY
                  </div>
                  <div className="text-controlled-emerald font-medium">
                    &gt; {pipelineStages[pipelineStage].telemetry}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-obsidian rounded-xl border border-white/10">
                <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-4 text-[11px] font-mono text-muted-silver/60">
                  <span>PIPELINE ARTIFACT</span>
                  <span className="text-electric-teal">{pipelineStages[pipelineStage].badge}</span>
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
                  className="w-full aspect-video object-cover rounded-xl border border-white/15 shadow-md cursor-pointer hover:scale-[1.02] transition-transform"
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
                <span className="text-[10px] font-mono text-muted-silver/60 mt-3">
                  Click preview image to inspect full-resolution tensor output
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 04 — GENERATIVE AI STUDIO (THE 3-OUTPUT SUITE)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="generative-suite" className="py-28 px-6 border-t border-white/10 bg-graphite/40 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-controlled-emerald/10 text-controlled-emerald text-xs font-mono uppercase tracking-wider mb-4 border border-controlled-emerald/25">
              <span>SECTION 04 &bull; 3-OUTPUT GENERATION ENGINE</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-warm-ivory mb-4">
              Individual Output Visual Identities.
            </h2>
            <p className="text-base sm:text-lg text-muted-silver leading-relaxed">
              RackVision AI delivers three distinct, complementary deliverables for every project: Technical Blueprint Linework, Photorealistic Interior Concept, and the Final Ultra-Realistic Master Render.
            </p>
          </div>

          {/* 3 Output Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setActiveTabOutput('output1')}
              className={`px-5 py-3 rounded-xl border text-xs font-mono uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTabOutput === 'output1'
                  ? 'bg-titanium-charcoal border-electric-teal text-electric-teal shadow-[0_0_20px_rgba(0,214,201,0.2)] font-bold'
                  : 'bg-graphite border-white/10 text-muted-silver hover:border-electric-teal/40'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>OUTPUT 1: TECHNICAL BLUEPRINT</span>
            </button>

            <button
              onClick={() => setActiveTabOutput('output2')}
              className={`px-5 py-3 rounded-xl border text-xs font-mono uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTabOutput === 'output2'
                  ? 'bg-titanium-charcoal border-ice-blue text-ice-blue shadow-[0_0_20px_rgba(118,207,255,0.2)] font-bold'
                  : 'bg-graphite border-white/10 text-muted-silver hover:border-ice-blue/40'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>OUTPUT 2: PHOTOREALISTIC INTERIOR</span>
            </button>

            <button
              onClick={() => setActiveTabOutput('output3')}
              className={`px-5 py-3 rounded-xl border text-xs font-mono uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTabOutput === 'output3'
                  ? 'bg-titanium-charcoal border-controlled-emerald text-controlled-emerald shadow-[0_0_20px_rgba(0,184,148,0.2)] font-bold'
                  : 'bg-graphite border-white/10 text-muted-silver hover:border-controlled-emerald/40'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>OUTPUT 3: FINAL ARCHITECTURAL MASTER</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="p-8 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md shadow-xl">
            {activeTabOutput === 'output1' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <img
                    src="/images/p2_perspective_conditioning_canny.png"
                    alt="Output 1: Technical Architectural Blueprint"
                    className="w-full aspect-[16/10] object-cover rounded-xl border border-electric-teal/30 shadow-2xl cursor-pointer hover:opacity-95 transition-opacity"
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
                  <span className="px-3 py-1 rounded bg-electric-teal/10 text-electric-teal text-xs font-mono border border-electric-teal/30">
                    DELIVERABLE 01
                  </span>
                  <h3 className="font-serif text-3xl font-bold text-warm-ivory">
                    Technical Architectural Blueprint
                  </h3>
                  <p className="text-sm text-muted-silver leading-relaxed">
                    Precise vector and Canny edge delineation of the facility. Accurately renders physical cabinet footprints, 19-inch mounting depths, and clearance corridors to ensure constructability.
                  </p>
                  <div className="p-4 rounded-xl bg-obsidian border border-white/10 text-xs font-mono text-muted-silver space-y-2">
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
                    className="w-full aspect-[16/10] object-cover rounded-xl border border-ice-blue/30 shadow-2xl cursor-pointer hover:opacity-95 transition-opacity"
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
                  <span className="px-3 py-1 rounded bg-ice-blue/10 text-ice-blue text-xs font-mono border border-ice-blue/30">
                    DELIVERABLE 02
                  </span>
                  <h3 className="font-serif text-3xl font-bold text-warm-ivory">
                    Photorealistic Interior Preview
                  </h3>
                  <p className="text-sm text-muted-silver leading-relaxed">
                    First-pass spatial visualization delivering realistic materials, lighting atmosphere, LED activity indicators, and Tate HPL raised access flooring.
                  </p>
                  <div className="p-4 rounded-xl bg-obsidian border border-white/10 text-xs font-mono text-ice-blue space-y-2">
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
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-controlled-emerald uppercase tracking-wider font-semibold">
                      MULTI-VIEW MASTER ANGLES:
                    </span>
                    {(['view_a', 'view_b', 'view_c'] as const).map((vKey) => (
                      <button
                        key={vKey}
                        onClick={() => setActiveViewpoint(vKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all cursor-pointer ${
                          activeViewpoint === vKey
                            ? 'bg-controlled-emerald text-obsidian font-bold shadow-[0_0_15px_rgba(0,184,148,0.3)]'
                            : 'bg-titanium-charcoal text-muted-silver hover:text-white border border-white/10'
                        }`}
                      >
                        {vKey === 'view_a' ? 'View A (Elevated)' : vKey === 'view_b' ? 'View B (Corridor)' : 'View C (Cooling)'}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-mono text-electric-teal">
                    1920×1080 MASTER PBR + SDXL
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8 relative group">
                    <img
                      src={viewpointDeliverables[activeViewpoint].url}
                      alt={viewpointDeliverables[activeViewpoint].title}
                      className="w-full aspect-[16/10] object-cover rounded-xl border border-controlled-emerald/30 shadow-2xl"
                    />
                    <button
                      onClick={() =>
                        setLightboxImage({
                          url: viewpointDeliverables[activeViewpoint].url,
                          title: viewpointDeliverables[activeViewpoint].title,
                          desc: viewpointDeliverables[activeViewpoint].desc,
                        })
                      }
                      className="absolute bottom-4 right-4 px-3 py-2 rounded-lg bg-obsidian/85 backdrop-blur-md border border-controlled-emerald/40 text-controlled-emerald text-xs font-mono flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Inspect 1080p Master</span>
                    </button>
                  </div>

                  <div className="lg:col-span-4 space-y-4">
                    <span className="px-3 py-1 rounded bg-controlled-emerald/15 text-controlled-emerald text-xs font-mono font-bold border border-controlled-emerald/30">
                      {viewpointDeliverables[activeViewpoint].badge}
                    </span>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-warm-ivory">
                      {viewpointDeliverables[activeViewpoint].title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-silver leading-relaxed">
                      {viewpointDeliverables[activeViewpoint].desc}
                    </p>

                    <div className="p-4 rounded-xl bg-obsidian border border-white/10 space-y-2 text-xs font-mono text-muted-silver">
                      <div className="text-[10px] text-muted-silver/60 uppercase tracking-widest pb-1 border-b border-white/10">
                        CAMERA OPTICS & TELEMETRY
                      </div>
                      <div className="text-ice-blue">
                        {viewpointDeliverables[activeViewpoint].lens}
                      </div>
                      <div className="flex justify-between text-muted-silver/90 pt-1">
                        <span>PUE Efficiency:</span>
                        <span className="text-electric-teal font-bold">1.14</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 05 — INTERACTIVE 3D SIMULATOR (DIGITAL TWIN)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="3d-simulator" className="py-28 px-6 border-t border-white/10 bg-[#080B0F] relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-electric-teal/10 text-electric-teal text-xs font-mono uppercase tracking-wider mb-4 border border-electric-teal/25">
              <span>SECTION 05 &bull; INTERACTIVE 3D DIGITAL TWIN</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-warm-ivory mb-4">
              Real-Time WebGL Data Center Simulator.
            </h2>
            <p className="text-base sm:text-lg text-muted-silver leading-relaxed">
              Experience the actual computational 3D engine. Orbit through the dual-row 12-cabinet facility, toggle thermodynamic airflow streams, inspect thermal floor heatmaps, and inspect individual server enclosure capacities.
            </p>
          </div>

          {/* Interactive 3D Canvas Section Component */}
          <Landing3DSimulatorSection onExploreStudio={onExplore} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 06 — CFD AND THERMAL INTELLIGENCE
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="thermal-cfd" className="py-28 px-6 border-t border-white/10 bg-graphite/40 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-champagne-bronze/10 text-champagne-bronze text-xs font-mono uppercase tracking-wider mb-4 border border-champagne-bronze/25">
              <span>SECTION 06 &bull; COMPUTATIONAL FLUID DYNAMICS (CFD)</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-warm-ivory mb-4">
              Thermal Airflow Modeling &amp; Delta-T Gradients.
            </h2>
            <p className="text-base sm:text-lg text-muted-silver leading-relaxed">
              Moving beyond visual effects, RackVision AI models thermodynamics against ASHRAE TC 9.9 thermal envelopes. Cold-aisle air delivery, exhaust plumes, and Delta-T heat balances are quantified prior to procurement.
            </p>
          </div>

          {/* Thermal Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
                <span>SUPPLY AIR TEMP</span>
                <Snowflake className="w-4 h-4 text-electric-teal" />
              </div>
              <div className="text-3xl font-bold text-electric-teal font-serif">18.0°C</div>
              <span className="text-[10px] font-mono text-controlled-emerald">ASHRAE A1 Recommended</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
                <span>HOT RETURN PLENUM</span>
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-bold text-rose-400 font-serif">31.0°C</div>
              <span className="text-[10px] font-mono text-muted-silver/80">Sensible Cooling Factor 0.92</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
                <span>THERMAL DELTA (ΔT)</span>
                <Thermometer className="w-4 h-4 text-champagne-bronze" />
              </div>
              <div className="text-3xl font-bold text-champagne-bronze font-serif">+13.0°C</div>
              <span className="text-[10px] font-mono text-controlled-emerald">Within Optimal 11-14°C Range</span>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
                <span>COOLING COVERAGE</span>
                <Wind className="w-4 h-4 text-controlled-emerald" />
              </div>
              <div className="text-3xl font-bold text-controlled-emerald font-serif">87.5%</div>
              <span className="text-[10px] font-mono text-electric-teal">N+1 CRAC Active Redundancy</span>
            </div>
          </div>

          {/* Interactive Thermal Table & Heatmap Callout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-obsidian space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono">
                <span className="text-electric-teal font-bold uppercase">PHYSICAL RACK TEMPERATURE TELEMETRY</span>
                <span className="text-muted-silver/60">P2 Serverraum (12 Racks)</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {[
                  { name: 'Row-A Cabinets 01–03', temp: '22.5°C', status: 'Normal', power: '36.5 kW', color: 'text-controlled-emerald' },
                  { name: 'Row-A Cabinets 04–06', temp: '25.8°C', status: 'Elevated', power: '28.5 kW', color: 'text-electric-teal' },
                  { name: 'Row-B Cabinets 01–03', temp: '29.1°C', status: 'High', power: '38.0 kW', color: 'text-amber-400' },
                  { name: 'Row-B Cabinets 04–06', temp: '23.4°C', status: 'Normal', power: '29.5 kW', color: 'text-controlled-emerald' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-titanium-charcoal/50 border border-white/5">
                    <span className="text-warm-ivory">{row.name}</span>
                    <span className="text-muted-silver">{row.power}</span>
                    <span className={`font-bold ${row.color}`}>{row.temp}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-muted-silver border border-white/10">
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-serif text-2xl font-bold text-warm-ivory">
                Cold Aisle Containment Verification
              </h3>
              <p className="text-xs sm:text-sm text-muted-silver leading-relaxed">
                By modeling Tate 600×600mm floor plenum velocities alongside overhead T30 boundary barriers, RackVision AI isolates recirculation eddies before they degrade IT equipment longevity.
              </p>
              <div className="p-4 rounded-xl bg-titanium-charcoal/80 border border-white/10 text-xs font-mono space-y-2 text-muted-silver">
                <div>&bull; Airflow Rate: 8.0 m³/s across 3 downflow CRACs</div>
                <div>&bull; Static Pressure: 25 Pa under raised access floor</div>
                <div>&bull; Compliance: Zero hotspot bypass leakage detected</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 07 — ENGINEERING OPTIMIZATION (ASHRAE TC 9.9)
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="optimization" className="py-28 px-6 border-t border-white/10 bg-[#080B0F] relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-electric-teal/10 text-electric-teal text-xs font-mono uppercase tracking-wider mb-4 border border-electric-teal/25">
              <span>SECTION 07 &bull; ALGORITHMIC EFFICIENCY AUDIT</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-warm-ivory mb-4">
              ASHRAE TC 9.9 Optimization Engine.
            </h2>
            <p className="text-base sm:text-lg text-muted-silver leading-relaxed">
              Spatial reasoning algorithms evaluate cabinet clearance, ducting distances, and electrical routing against ANSI/TIA-942 and NFPA 70 standards to yield peak operational PUE.
            </p>
          </div>

          {/* Benchmark Audit Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
                <span>EFFICIENCY RATING</span>
                <Sparkles className="w-4 h-4 text-electric-teal" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-electric-teal font-serif">86</span>
                <span className="text-muted-silver text-xs font-mono">/ 100</span>
              </div>
              <div className="w-full bg-titanium-charcoal border border-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-electric-teal h-full shadow-[0_0_8px_#00D6C9]" style={{ width: '86%' }} />
              </div>
              <span className="text-[11px] font-mono text-electric-teal block">+14% potential gain through containment</span>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
                <span>THERMAL BALANCE</span>
                <Wind className="w-4 h-4 text-controlled-emerald" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-controlled-emerald font-serif">92</span>
                <span className="text-muted-silver text-xs font-mono">/ 100</span>
              </div>
              <div className="w-full bg-titanium-charcoal border border-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-controlled-emerald h-full shadow-[0_0_8px_#00B894]" style={{ width: '92%' }} />
              </div>
              <span className="text-[11px] font-mono text-controlled-emerald block">Delta-T across aisle: 11.2°C nominal</span>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-muted-silver">
                <span>STANDARDS COMPLIANCE</span>
                <ShieldCheck className="w-4 h-4 text-champagne-bronze" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-champagne-bronze font-serif">94</span>
                <span className="text-muted-silver text-xs font-mono">/ 100</span>
              </div>
              <div className="w-full bg-titanium-charcoal border border-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-champagne-bronze h-full shadow-[0_0_8px_#C6A477]" style={{ width: '94%' }} />
              </div>
              <span className="text-[11px] font-mono text-warm-ivory block font-bold">ASHRAE TC 9.9 & TIA-942 Tier III</span>
            </div>
          </div>

          {/* Differential Analysis Card */}
          <div className="p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-5 shadow-xl">
            <h3 className="font-serif text-xl font-bold text-warm-ivory flex items-center gap-2">
              <Sliders className="w-5 h-5 text-electric-teal" />
              Layout Differential Analysis (Current Baseline vs AI-Optimized)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-titanium-charcoal/80 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-muted-silver">Current Baseline PUE</span>
                <div className="text-2xl font-bold text-warm-ivory">1.35</div>
                <span className="text-controlled-emerald font-bold block">Optimized: 1.14 PUE</span>
              </div>

              <div className="bg-titanium-charcoal/80 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-muted-silver">Rack Density</span>
                <div className="text-2xl font-bold text-warm-ivory">12 Cabinets</div>
                <span className="text-electric-teal font-bold block">Max: 16 Cabinets Capacity</span>
              </div>

              <div className="bg-titanium-charcoal/80 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-muted-silver">Annual Power Savings</span>
                <div className="text-2xl font-bold text-electric-teal">114.2k kWh</div>
                <span className="text-muted-silver/80 block">~$11,500 / year Saved</span>
              </div>

              <div className="bg-titanium-charcoal/80 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-muted-silver">Thermal Headroom</span>
                <div className="text-2xl font-bold text-controlled-emerald">+2.4°C Margin</div>
                <span className="text-muted-silver/80 block">N+1 CRAC Redundancy Level</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 08 — MATERIAL PLANNING & CONSTRUCTION ROADMAP
          ───────────────────────────────────────────────────────────────────────────── */}
      <section id="construction-bom" className="py-28 px-6 border-t border-white/10 bg-graphite/40 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-controlled-emerald/10 text-controlled-emerald text-xs font-mono uppercase tracking-wider mb-4 border border-controlled-emerald/25">
              <span>SECTION 08 &bull; DELIVERY &amp; CAPITAL EXPENDITURE</span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-warm-ivory mb-4">
              Automated BOM Costing &amp; 10-Stage Milestone Guide.
            </h2>
            <p className="text-base sm:text-lg text-muted-silver leading-relaxed">
              Eliminate estimation guesswork. The computational engine translates verified 3D geometry into itemized procurement schedules and sequential construction milestones conforming to IEEE and TIA-942 mandates.
            </p>
          </div>

          {/* Delivery Grid: BOM & Construction Plan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
            {/* Left: BOM Summary Card */}
            <div className="lg:col-span-6 p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-mono text-electric-teal font-bold uppercase">BILL OF MATERIALS (BOM)</span>
                <span className="text-xs font-mono text-warm-ivory font-bold">$482,500 Total Capex</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {[
                  { name: 'Server Enclosures (42U Enterprise)', qty: '12 Units', cost: '$48,000', cat: 'Server Infrastructure' },
                  { name: 'Downflow CRAC Units (15 kW)', qty: '3 Units', cost: '$165,000', cat: 'Cooling Infrastructure' },
                  { name: 'PDU Power Conditioners (160 kVA)', qty: '2 Feeds', cost: '$84,000', cat: 'Electrical Infrastructure' },
                  { name: 'Tate HPL Conductive Tiles', qty: '49.6 m²', cost: '$32,500', cat: 'Physical Infrastructure' },
                  { name: 'Overhead Cable Runners & Fiber', qty: '480 m', cost: '$28,000', cat: 'Network Infrastructure' },
                  { name: 'T30 Fire Barrier & Containment', qty: '1 Set', cost: '$25,000', cat: 'Life Safety' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-titanium-charcoal/60 border border-white/5">
                    <div>
                      <div className="text-warm-ivory font-bold">{item.name}</div>
                      <div className="text-[10px] text-muted-silver/60">{item.cat}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-electric-teal font-bold">{item.cost}</div>
                      <div className="text-[10px] text-muted-silver">{item.qty}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 10-Stage Milestone Roadmap */}
            <div className="lg:col-span-6 p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-mono text-controlled-emerald font-bold uppercase">10-STAGE MILESTONE TIMETABLE</span>
                <span className="text-xs font-mono text-muted-silver">124 Calendar Days Total</span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                {[
                  { stage: 'Stage 01', title: 'Concrete Slab Leveling & Moisture Seal', days: '14 Days', status: 'Completed' },
                  { stage: 'Stage 02', title: 'Tate HPL Raised Flooring Grid Installation', days: '10 Days', status: 'Completed' },
                  { stage: 'Stage 03', title: 'PDU Electrical Distribution & Dual Busway', days: '18 Days', status: 'In Progress' },
                  { stage: 'Stage 04', title: 'CRAC Unit Positioning & Chilled Water Ducting', days: '16 Days', status: 'Pending' },
                  { stage: 'Stage 05', title: '42U Server Cabinet Anchoring & Grounding', days: '8 Days', status: 'Pending' },
                  { stage: 'Stage 06', title: 'Overhead Basket Tray & Fiber Trunk Runs', days: '12 Days', status: 'Pending' },
                  { stage: 'Stage 07', title: 'Cold-Aisle Ceiling Containment Enclosure', days: '6 Days', status: 'Pending' },
                  { stage: 'Stage 08', title: 'NFPA 2001 Clean Agent Fire Suppression', days: '10 Days', status: 'Pending' },
                  { stage: 'Stage 09', title: 'Load Banking & Full-Thermal Stress Run', days: '14 Days', status: 'Pending' },
                  { stage: 'Stage 10', title: 'Third-Party Commissioning & Client Handover', days: '16 Days', status: 'Pending' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-titanium-charcoal/40 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-electric-teal font-bold">
                        {s.stage}
                      </span>
                      <span className="text-warm-ivory text-[11px] truncate max-w-[220px] sm:max-w-xs">{s.title}</span>
                    </div>
                    <span className="text-muted-silver/80 text-[10px]">{s.days}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          SECTION 09 — FINAL CINEMATIC EXPERIENCE & CTA
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-white/10 bg-[#080B0F] relative overflow-hidden">
        {/* Ambient Volumetric Glow */}
        <div className="absolute inset-0 bg-radial from-electric-teal/10 via-[#080B0F]/80 to-[#080B0F] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-graphite border border-electric-teal/30 text-electric-teal text-xs font-mono tracking-widest uppercase mb-8 shadow-[0_0_20px_rgba(0,214,201,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ARCHITECTURAL INTELLIGENCE FOR TOMORROW</span>
          </div>

          <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-warm-ivory mb-6 leading-tight">
            ENGINEERING THE FUTURE OF ARCHITECTURAL COMPUTING.
          </h2>

          <p className="text-lg md:text-xl text-muted-silver max-w-2xl leading-relaxed mb-10 font-light">
            Empower your infrastructure engineering team with zero-hallucination architectural synthesis, instant CFD modeling, and automated BOM planning.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onStartProject}
              className="btn-primary-teal px-8 py-4 rounded-xl text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-3 cursor-pointer shadow-[0_0_30px_rgba(0,214,201,0.35)] w-full sm:w-auto justify-center"
            >
              <span>START YOUR PROJECT</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToAuth('register')}
              className="px-8 py-4 rounded-xl text-xs font-mono font-semibold tracking-wider uppercase flex items-center gap-3 cursor-pointer w-full sm:w-auto justify-center bg-titanium-charcoal/80 hover:bg-titanium-charcoal border border-white/10 hover:border-electric-teal/40 text-warm-ivory transition-all shadow-sm"
            >
              <span>EXPLORE THE PLATFORM</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-white/10 bg-[#05070A] py-12 px-6 text-muted-silver/60 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Compass className="w-4 h-4 text-electric-teal" />
            <span className="text-warm-ivory font-bold">RACKVISION AI &bull; PROJECT NEXUS</span>
            <span>&bull;</span>
            <span>ENTERPRISE ARCHITECTURAL INTELLIGENCE</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onNavigateToAdmin} className="hover:text-electric-teal transition-colors cursor-pointer">
              Admin Portal
            </button>
            <button onClick={() => onNavigateToAuth('login')} className="hover:text-electric-teal transition-colors cursor-pointer">
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
            className="fixed inset-0 z-50 bg-obsidian/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="relative max-w-6xl w-full flex flex-col items-center bg-graphite rounded-2xl border border-electric-teal/30 overflow-hidden shadow-2xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3 px-2">
                <div>
                  <h4 className="font-serif text-lg text-warm-ivory font-bold">
                    {lightboxImage.title}
                  </h4>
                  <p className="text-xs text-muted-silver font-mono">
                    {lightboxImage.desc}
                  </p>
                </div>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg bg-obsidian border border-white/20 text-muted-silver hover:text-electric-teal transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
