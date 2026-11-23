import React from 'react';
import { Hero3DRack } from '../components/simulator/Hero3DRack';
import { BeforeAfterSlider } from '../components/design/BeforeAfterSlider';
import {
  Compass, ArrowRight, PenTool, Box, ClipboardList,
  HardHat, Cpu, Layers, ShieldCheck, Zap, ChevronRight,
  Sparkles, Activity, FileSpreadsheet, Building2, Sliders,
  Thermometer, CheckCircle2, Shield, Eye
} from 'lucide-react';

interface OverviewPageProps {
  onNavigate: (tabId: string) => void;
  sampleSketchUrl: string;
  sampleDesignUrl: string;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  sampleSketchUrl,
  sampleDesignUrl,
}) => {
  // Stored user or default architect
  const storedUserRaw = typeof window !== 'undefined' ? localStorage.getItem('rv_user') : null;
  const user = storedUserRaw ? JSON.parse(storedUserRaw) : { name: 'Elena Rostova', role: 'Lead Architect', organization: 'Helios Data Systems' };

  return (
    <div className="space-y-10 pb-16 font-sans-ui text-[#F4F7F8]">
      {/* 1. EXECUTIVE BRIEFING HERO */}
      <section className="nexus-panel rounded-2xl p-8 md:p-12 border border-[#C9D3DB]/15 bg-[#101720] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-[#00E5CC]/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00E5CC]/10 border border-[#00E5CC]/25 text-xs font-mono-code text-[#00E5CC]">
              <span className="w-2 h-2 rounded-full bg-[#00E5CC] animate-pulse"></span>
              <span className="font-semibold tracking-wide uppercase">EXECUTIVE ARCHITECTURAL DOSSIER &bull; PROJECT NEXUS</span>
            </div>

            <div>
              <h1 className="font-editorial text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#F4F7F8] leading-[1.12]">
                Welcome back,{' '}
                <span className="italic font-normal text-[#00E5CC]">
                  {user.name.split(' ')[0]}
                </span>
              </h1>
              <p className="text-[#C9D3DB] text-base md:text-lg leading-relaxed max-w-2xl mt-3 font-light">
                Helios Cloud Hyperscale DC-1 is synchronized across all computational design engines: Computer Vision layout extraction, Hybrid PBR + SDXL ControlNet diffusion, Three.js 3D spatial simulation, and ASHRAE TC 9.9 thermal analytics.
              </p>
            </div>

            {/* Studio CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('generate')}
                className="btn-nexus-teal flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm transition-all shadow-md cursor-pointer group"
              >
                <span>3-Output Generative Studio</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('sketch')}
                className="btn-nexus-outline flex items-center gap-2 px-6 py-3.5 rounded-lg font-medium text-sm transition-all cursor-pointer"
              >
                <PenTool className="w-4 h-4 text-[#00E5CC]" />
                <span>Upload Floor Blueprint</span>
              </button>

              <button
                onClick={() => onNavigate('simulator')}
                className="bg-[#111E2A] hover:bg-[#182635] text-[#F4F7F8] border border-[#C9D3DB]/20 flex items-center gap-2 px-6 py-3.5 rounded-lg font-medium text-sm transition-all cursor-pointer"
              >
                <Box className="w-4 h-4 text-[#00E5CC]" />
                <span>3D Digital Twin</span>
              </button>
            </div>

            {/* Architectural Telemetry Cards */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#C9D3DB]/12 text-xs font-mono-code">
              <div className="p-3.5 rounded-xl bg-[#07090D] border border-[#C9D3DB]/15">
                <div className="text-[#00E5CC] font-bold text-xl font-editorial">100%</div>
                <div className="text-[#C9D3DB]/60 text-[11px] mt-0.5">Geometry Compliance</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#07090D] border border-[#C9D3DB]/15">
                <div className="text-[#F4F7F8] font-bold text-xl font-editorial">12 Racks</div>
                <div className="text-[#C9D3DB]/60 text-[11px] mt-0.5">42U Cabinets (2×6)</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#07090D] border border-[#C9D3DB]/15">
                <div className="text-[#00B894] font-bold text-xl font-editorial">1.14 PUE</div>
                <div className="text-[#C9D3DB]/60 text-[11px] mt-0.5">ASHRAE Efficiency</div>
              </div>
            </div>
          </div>

          {/* Right: 3D Interactive Rack Viewport */}
          <div className="lg:col-span-5 relative bg-[#07090D] rounded-xl border border-[#C9D3DB]/15 overflow-hidden p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#C9D3DB]/10 mb-3 text-xs font-mono-code text-[#C9D3DB]">
              <span className="flex items-center gap-1.5 font-semibold text-[#00E5CC]">
                <span className="w-2 h-2 rounded-full bg-[#00E5CC] animate-pulse" />
                INTERACTIVE 3D 42U CABINET
              </span>
              <span className="text-[#00B894] font-bold">60 FPS WEBGL</span>
            </div>
            <Hero3DRack />
            <div className="text-[10px] font-mono-code text-[#C9D3DB]/50 text-center mt-2">
              Drag to orbit &bull; Scroll to zoom &bull; Real-time Three.js Shader Engine
            </div>
          </div>
        </div>
      </section>

      {/* 2. RECENT ARCHITECTURAL OUTPUTS PREVIEW */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono-code text-[#00E5CC] uppercase tracking-widest font-semibold">
              Master Visualizations
            </div>
            <h2 className="font-editorial text-2xl md:text-3xl font-bold text-[#F4F7F8] mt-0.5">
              Recent Architectural Outputs & Viewpoints
            </h2>
          </div>
          <button
            onClick={() => onNavigate('generate')}
            className="flex items-center gap-1.5 text-xs font-mono-code text-[#00E5CC] hover:underline font-semibold cursor-pointer"
          >
            <span>Launch Generative Studio</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'View A: Elevated Three-Quarter Overview',
              subtitle: '49.6 m² White Space & Technikspange',
              img: '/images/p2_view_a_elevated_overview_master.png',
              engine: '1080p Master Render',
              badge: 'CAD Lock: 100%'
            },
            {
              title: 'View B: Server Room Perspective',
              subtitle: 'Two Rows of 6 Racks with Hot Aisle Containment',
              img: '/images/p2_view_b_server_room_master.png',
              engine: '1080p Master Render',
              badge: 'Tate HPL Floor'
            },
            {
              title: 'View C: Technical-Area Cooling Perspective',
              subtitle: 'Three 15 kW UKG Precision Units & T30 Door',
              img: '/images/p2_view_c_technical_area_master.png',
              engine: '1080p Master Render',
              badge: 'ASHRAE TC 9.9'
            }
          ].map((card, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate('generate')}
              className="nexus-panel rounded-xl overflow-hidden border border-[#C9D3DB]/15 bg-[#101720] hover:border-[#00E5CC] transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
            >
              <div className="aspect-[16/10] bg-[#07090D] relative overflow-hidden">
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/p2_output3_master_render.png';
                  }}
                />
                <div className="absolute top-3 left-3 bg-[#07090D]/85 backdrop-blur text-[#F4F7F8] text-[10px] font-mono-code px-2.5 py-1 rounded-md border border-[#C9D3DB]/20 font-semibold">
                  {card.engine}
                </div>
                <div className="absolute bottom-3 right-3 bg-[#00E5CC] text-[#07090D] text-[10px] font-mono-code px-2 py-0.5 rounded font-bold shadow-xs">
                  {card.badge}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-editorial text-lg font-bold text-[#F4F7F8] group-hover:text-[#00E5CC] transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-[#C9D3DB]/70 mt-1 font-light">
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. ARCHITECTURAL TRANSFORMATION SHOWCASE */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono-code text-[#00E5CC] uppercase tracking-widest font-semibold">
              Spatial Conditioning Fidelity
            </div>
            <h2 className="font-editorial text-2xl md:text-3xl font-bold text-[#F4F7F8] mt-0.5">
              Floor Plan Sketch to Master Render Comparison
            </h2>
          </div>
          <button
            onClick={() => onNavigate('generate')}
            className="flex items-center gap-1.5 text-xs font-mono-code text-[#00E5CC] hover:underline font-semibold cursor-pointer"
          >
            <span>Explore 3-Output Studio</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="nexus-panel rounded-xl overflow-hidden border border-[#C9D3DB]/15 p-3 bg-[#101720] shadow-xl">
          <BeforeAfterSlider
            beforeImage={sampleSketchUrl || '/images/p2_perspective_conditioning_canny.png'}
            afterImage={sampleDesignUrl || '/images/p2_output3_master_render.png'}
            beforeLabel="Input Floor Plan / 3D CAD Conditioning Map"
            afterLabel="Output 3: Photorealistic Master Render (1080p)"
          />
        </div>
      </section>

      {/* 4. MODULAR ENGINEERING CAPABILITIES */}
      <section className="space-y-4">
        <div>
          <span className="text-xs font-mono-code text-[#00E5CC] uppercase tracking-widest font-semibold">
            Modular Intelligence
          </span>
          <h2 className="font-editorial text-2xl md:text-3xl font-bold text-[#F4F7F8] mt-0.5">
            Mission-Critical Facility Workspaces
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: 'sketch',
              title: 'Sketch Studio & OpenCV Canny',
              desc: 'Interactive image preprocessing, contrast tuning, and bilateral edge detection for drawing ingestion.',
              icon: PenTool,
              badge: 'CV Intake'
            },
            {
              id: 'intelligence',
              title: 'Sketch Intelligence Engine',
              desc: 'Automated optical character recognition and boundary extraction conforming to Structured Layout Schema 1.0.',
              icon: Layers,
              badge: 'Geometry Lock'
            },
            {
              id: 'copilot',
              title: 'AI Design Copilot',
              desc: 'LLM-powered architectural assistant advising on ASHRAE standards, PUE optimization, and space allocation.',
              icon: Sparkles,
              badge: 'Advisor'
            },
            {
              id: 'simulator',
              title: '3D Spatial Twin (WebGL)',
              desc: 'Real-time Three.js digital twin with interactive rack selection, cooling units, and cable trays.',
              icon: Box,
              badge: 'Digital Twin'
            },
            {
              id: 'thermal',
              title: 'Thermal CFD Simulation',
              desc: 'Computational fluid dynamics visualization simulating inlet/exhaust airflow and temperature contours.',
              icon: Thermometer,
              badge: 'CFD Heatmap'
            },
            {
              id: 'materials',
              title: 'BOM Material Cost Ledger',
              desc: 'Automated bill-of-materials ledger computing enterprise equipment costs and lead times.',
              icon: ClipboardList,
              badge: 'BOM Ledger'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigate(item.id)}
                className="nexus-glass p-6 rounded-xl border border-[#C9D3DB]/15 hover:border-[#00E5CC] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#101720] border border-[#00E5CC]/30 text-[#00E5CC] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[#00E5CC]/10 text-[#00E5CC] border border-[#00E5CC]/25">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-editorial text-lg font-bold text-[#F4F7F8] group-hover:text-[#00E5CC] transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#C9D3DB]/70 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#C9D3DB]/10 flex items-center justify-between text-xs font-mono-code text-[#00E5CC]">
                  <span>Launch Workspace</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
