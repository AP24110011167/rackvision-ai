import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeftRight, Sparkles, Layers, Sliders, Maximize2 } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  onExpand?: () => void;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Architectural CAD / Sketch Ground Truth',
  afterLabel = 'AI Photorealistic Synthesis',
  onExpand,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video md:aspect-[16/10] overflow-hidden rounded-xl border border-[#C9D3DB]/20 select-none group shadow-2xl bg-[#07090D]"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background: 3D Photorealistic Synthesis) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/images/p2_view_a_elevated_overview_master.png';
        }}
      />

      {/* Before Image (Clipped Layer: Original Floor Plan / Canny Wireframe) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover max-w-none"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/p2_perspective_conditioning_canny.png';
          }}
          style={{
            width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
            height: '100%',
          }}
        />
        {/* Subtle engineering cyan overlay */}
        <div className="absolute inset-0 bg-[#00E5CC]/5 pointer-events-none" />
      </div>

      {/* Luminous Teal Divider Bar */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#62DDF5] via-[#00E5CC] to-[#00B894] cursor-ew-resize z-20 shadow-[0_0_15px_rgba(0,229,204,0.7)]"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Sleek Central Knob */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#101720] border-2 border-[#00E5CC] flex items-center justify-center text-[#00E5CC] shadow-[0_0_20px_rgba(0,229,204,0.4)] group-hover:scale-110 transition-transform">
          <ArrowLeftRight className="w-4 h-4" />
        </div>
      </div>

      {/* Left Badge: Before / Input */}
      <div className="absolute top-4 left-4 z-30 px-3 py-1.5 bg-[#07090D]/85 backdrop-blur-md rounded-lg border border-[#C9D3DB]/20 text-xs font-mono-code text-[#F4F7F8] flex items-center gap-2 shadow-lg">
        <Layers className="w-3.5 h-3.5 text-[#62DDF5]" />
        <span>{beforeLabel}</span>
      </div>

      {/* Right Badge: After / Master Render */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <div className="px-3 py-1.5 bg-[#101720]/85 backdrop-blur-md rounded-lg border border-[#00E5CC]/30 text-xs font-mono-code text-[#00E5CC] flex items-center gap-2 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#00E5CC]" />
          <span>{afterLabel}</span>
        </div>
        {onExpand && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-1.5 bg-[#101720]/85 backdrop-blur-md rounded-lg border border-[#C9D3DB]/20 text-[#C9D3DB] hover:text-[#00E5CC] transition-colors cursor-pointer"
            title="Expand Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom Coordinate Readout */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-[#07090D]/90 backdrop-blur-md rounded-full text-[11px] font-mono-code text-[#C9D3DB] border border-[#00E5CC]/25 shadow-lg flex items-center gap-2">
        <Sliders className="w-3 h-3 text-[#00E5CC]" />
        <span>CANNY COORD LOCK: {Math.round(sliderPosition)}% SPLIT &bull; ZERO TOLERANCE</span>
      </div>
    </div>
  );
};
