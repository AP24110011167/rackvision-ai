import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap, ScrollTrigger } from '../../motion/motionEngine';
import { BeforeAfterSlider } from '../design/BeforeAfterSlider';
import { 
  Scan, CheckCircle2, Layers, Cpu, Maximize2, Compass, 
  ArrowRight, ShieldCheck, Box, Eye, Sliders 
} from 'lucide-react';

interface ArchitecturalTransformationFilmProps {
  onExpandMaster?: () => void;
}

const TRANSFORMATION_STEPS = [
  { id: 'cad_draw', label: '1. CAD Vector Draw', desc: 'Raw DWG/DXF architectural vectors parsed into physical coordinate plane' },
  { id: 'dimensions', label: '2. Dimension Lock', desc: '8.27m × 6.0m room boundary and 1.5m hot-aisle tolerance locked' },
  { id: 'cv_scan', label: '3. Neural CV Scan', desc: 'Edge convolution detects wall partitions, doors, and technical corridors' },
  { id: 'object_detect', label: '4. Equipment Tagging', desc: '12 Server Racks (2×6), 3 UKG cooling units, and USV tagged at 99.4% confidence' },
  { id: 'spatial_lift', label: '5. 3D Wireframe Lift', desc: 'Planar vectors elevated into 42U spatial volume & ceiling containment' },
  { id: 'pbr_master', label: '6. Master PBR Synthesis', desc: 'SDXL + ControlNet fuses physically based materials and photometric lighting' },
];

export const ArchitecturalTransformationFilm: React.FC<ArchitecturalTransformationFilmProps> = ({
  onExpandMaster,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgLinesRef = useRef<SVGSVGElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [scrubProgress, setScrubProgress] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // GSAP ScrollTrigger scrub timeline
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top 75%',
          end: 'bottom 25%',
          scrub: 0.8,
          onUpdate: (self) => {
            const p = self.progress;
            setScrubProgress(p);
            const step = Math.min(
              TRANSFORMATION_STEPS.length - 1,
              Math.floor(p * TRANSFORMATION_STEPS.length)
            );
            setActiveStepIndex(step);
          },
        },
      });

      // Animate SVG blueprint paths
      if (svgLinesRef.current) {
        const paths = svgLinesRef.current.querySelectorAll('.blueprint-path');
        paths.forEach((path) => {
          const length = (path as SVGGeometryElement).getTotalLength?.() || 800;
          gsap.set(path, {
            strokeDasharray: length,
            strokeDashoffset: length,
          });
          tl.to(
            path,
            {
              strokeDashoffset: 0,
              duration: 1,
              ease: 'power2.inOut',
            },
            0
          );
        });
      }
    }, container);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Transformation Step Selector & Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-[#00D6C9] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#00D6C9] font-bold">
              TRANSFORMATION FILM TIMELINE &bull; {Math.round(scrubProgress * 100)}% COMPLETE
            </span>
          </div>
          <span className="text-xs font-mono text-[#A8B3BC]">
            STEP {activeStepIndex + 1} OF {TRANSFORMATION_STEPS.length}: {TRANSFORMATION_STEPS[activeStepIndex].label}
          </span>
        </div>

        {/* Scrubbed Track */}
        <div className="w-full h-1.5 bg-[#19232C] rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-[#00D6C9] via-[#76CFFF] to-[#00B894] relative"
            style={{ width: `${Math.max(10, scrubProgress * 100)}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white shadow-[0_0_10px_#fff]" />
          </motion.div>
        </div>

        {/* Step Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
          {TRANSFORMATION_STEPS.map((st, idx) => {
            const isPassed = scrubProgress >= (idx / TRANSFORMATION_STEPS.length);
            const isCurrent = activeStepIndex === idx;
            return (
              <button
                key={st.id}
                onClick={() => {
                  setActiveStepIndex(idx);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#19232C] border-[#00D6C9] shadow-[0_0_15px_rgba(0,214,201,0.25)]'
                    : isPassed
                    ? 'bg-[#111820]/80 border-[#00D6C9]/30 text-[#F3F1E9]'
                    : 'bg-[#111820]/40 border-white/5 text-[#A8B3BC]/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono ${isCurrent ? 'text-[#00D6C9] font-bold' : 'text-[#A8B3BC]/70'}`}>
                    0{idx + 1}
                  </span>
                  {isPassed && <CheckCircle2 className="w-3 h-3 text-[#00D6C9]" />}
                </div>
                <div className={`text-xs font-medium truncate ${isCurrent ? 'text-[#F3F1E9]' : 'text-[#A8B3BC]'}`}>
                  {st.label.replace(/^\d+\.\s*/, '')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visual Cinematic Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Dynamic Visual Transformation Viewport */}
        <div className="lg:col-span-8">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-[#080B0F] shadow-2xl group">
            {/* Stage 1-4: CAD Vector Blueprint Overlay */}
            {activeStepIndex <= 3 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#07090D] p-6">
                <svg
                  ref={svgLinesRef}
                  viewBox="0 0 827 600"
                  className="w-full h-full max-h-[460px] drop-shadow-[0_0_20px_rgba(0,214,201,0.2)]"
                >
                  {/* Grid background */}
                  <defs>
                    <pattern id="film-cad-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(168,179,188,0.08)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="827" height="600" fill="url(#film-cad-grid)" />

                  {/* Outer Room Walls (8.27m x 6.0m) */}
                  <rect
                    x="20"
                    y="20"
                    width="787"
                    height="560"
                    fill="none"
                    stroke="#76CFFF"
                    strokeWidth="3"
                    className="blueprint-path"
                  />

                  {/* Technikspange Partition Wall (T30) */}
                  <line
                    x1="620"
                    y1="20"
                    x2="620"
                    y2="580"
                    stroke="#C6A477"
                    strokeWidth="2.5"
                    strokeDasharray="6,4"
                    className="blueprint-path"
                  />

                  {/* Row 1 Server Racks (6 racks) */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <rect
                      key={`r1-${i}`}
                      x={100 + i * 80}
                      y="140"
                      width="60"
                      height="100"
                      fill={activeStepIndex >= 3 ? 'rgba(0,214,201,0.15)' : 'none'}
                      stroke="#00D6C9"
                      strokeWidth="2"
                      className="blueprint-path transition-colors duration-500"
                    />
                  ))}

                  {/* Row 2 Server Racks (6 racks) */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <rect
                      key={`r2-${i}`}
                      x={100 + i * 80}
                      y="360"
                      width="60"
                      height="100"
                      fill={activeStepIndex >= 3 ? 'rgba(0,214,201,0.15)' : 'none'}
                      stroke="#00D6C9"
                      strokeWidth="2"
                      className="blueprint-path transition-colors duration-500"
                    />
                  ))}

                  {/* 3 UKG Precision Cooling Units */}
                  {[0, 1, 2].map((i) => (
                    <rect
                      key={`ukg-${i}`}
                      x="660"
                      y={120 + i * 140}
                      width="100"
                      height="90"
                      fill={activeStepIndex >= 3 ? 'rgba(0,184,148,0.2)' : 'none'}
                      stroke="#00B894"
                      strokeWidth="2"
                      className="blueprint-path transition-colors duration-500"
                    />
                  ))}

                  {/* Dimension Annotations (Step 2+) */}
                  {activeStepIndex >= 1 && (
                    <g className="transition-opacity duration-500">
                      <text x="400" y="595" fill="#76CFFF" fontSize="14" fontFamily="monospace" textAnchor="middle">
                        ↔ 8.27m ROOM LENGTH (SERVERRAUM)
                      </text>
                      <text x="10" y="300" fill="#76CFFF" fontSize="14" fontFamily="monospace" transform="rotate(-90, 10, 300)" textAnchor="middle">
                        ↕ 6.0m ROOM WIDTH
                      </text>
                      <text x="340" y="305" fill="#C6A477" fontSize="12" fontFamily="monospace" textAnchor="middle">
                        HOT AISLE: 1.50m
                      </text>
                    </g>
                  )}

                  {/* CV Detection Tags (Step 3+) */}
                  {activeStepIndex >= 3 && (
                    <g className="transition-opacity duration-500">
                      <rect x="90" y="100" width="490" height="30" fill="rgba(0,214,201,0.2)" stroke="#00D6C9" strokeWidth="1" rx="4" />
                      <text x="335" y="120" fill="#00D6C9" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        AI CONFIRMED: 12 RACKS (2 ROWS OF 6, 42U) &bull; CONF: 99.4%
                      </text>

                      <rect x="650" y="80" width="120" height="25" fill="rgba(0,184,148,0.2)" stroke="#00B894" strokeWidth="1" rx="4" />
                      <text x="710" y="97" fill="#00B894" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        3× UKG UNITS
                      </text>
                    </g>
                  )}
                </svg>

                {/* Animated Horizontal Laser CV Scanline (Step 2 & 3) */}
                {(activeStepIndex === 2 || activeStepIndex === 3) && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                      className="w-full h-1 bg-gradient-to-r from-transparent via-[#00D6C9] to-transparent shadow-[0_0_20px_#00D6C9]"
                      animate={{ y: [0, 460, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Stage 4-6: Photorealistic Master Render & Interactive Before/After */}
            {activeStepIndex >= 4 && (
              <BeforeAfterSlider
                beforeImage="/images/p2_perspective_conditioning_canny.png"
                afterImage="/images/p2_view_a_elevated_overview_master.png"
                beforeLabel="Input CAD Wireframe (ControlNet Canny Lock)"
                afterLabel="PBR + SDXL Photorealistic Master Render"
                onExpand={onExpandMaster}
              />
            )}

            {/* Live Camera Optics HUD Overlay */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-[#080B0F]/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#00D6C9] font-bold">
                GROUND-TRUTH: P2 SERVERRAUM
              </span>
              <span className="px-2.5 py-1 rounded bg-[#080B0F]/85 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#A8B3BC]">
                49.6 m² &bull; 120 kW IT LOAD
              </span>
            </div>
          </div>
        </div>

        {/* Right: Technical Specification & Stage Insights */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-6 rounded-2xl border border-white/10 bg-[#111820]/90 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-xs font-mono text-[#00D6C9] uppercase tracking-wider font-semibold">
                STAGE {activeStepIndex + 1} SPECIFICATION
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00B894]/15 text-[#00B894] border border-[#00B894]/30 font-bold">
                PHYSICALLY VERIFIED
              </span>
            </div>

            <h3 className="font-serif text-xl font-bold text-[#F3F1E9] mb-2">
              {TRANSFORMATION_STEPS[activeStepIndex].label}
            </h3>

            <p className="text-xs text-[#A8B3BC] leading-relaxed mb-6 font-light">
              {TRANSFORMATION_STEPS[activeStepIndex].desc}
            </p>

            <div className="space-y-3 text-xs font-mono text-[#A8B3BC] border-t border-white/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-[#A8B3BC]/60">Physical Footprint</span>
                <span className="text-[#F3F1E9] font-semibold">8.27m × 6.0m (49.6 m²)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A8B3BC]/60">Server Cabinets</span>
                <span className="text-[#00D6C9] font-bold">12 Racks (2 Rows of 6, 42U)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A8B3BC]/60">Cooling Plant</span>
                <span className="text-[#F3F1E9] font-semibold">3× 15 kW UKG Precision CRAC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A8B3BC]/60">Hot Aisle Depth</span>
                <span className="text-[#76CFFF]">1.50m Dedicated Plenum</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A8B3BC]/60">Geometric Lock</span>
                <span className="text-[#00B894] font-bold">±0.0mm Coordinate Tolerance</span>
              </div>
            </div>
          </div>

          {/* Zero Hallucination Guarantee Badge */}
          <div className="p-4 rounded-xl border-l-4 border-l-[#00D6C9] bg-[#19232C]/70 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#00D6C9]" />
              <span className="text-xs font-bold text-[#F3F1E9]">Zero Hallucination Guarantee</span>
            </div>
            <p className="text-[11px] text-[#A8B3BC] leading-relaxed">
              Every equipment bounding coordinate is permanently fixed into Three.js 3D space and OpenCV edge matrices before SDXL diffusion sampling starts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
