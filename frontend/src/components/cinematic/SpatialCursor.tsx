import React, { useEffect, useRef, useState } from 'react';

interface SpatialCursorProps {
  mousePosRef?: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
}

export const SpatialCursor: React.FC<SpatialCursorProps> = ({ mousePosRef }) => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch-only device
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (mousePosRef) {
        mousePosRef.current = { x: e.clientX, y: e.clientY, active: true };
      }

      // Check if hovering interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer, .interactive-hover')
        );
        setIsHoveringInteractive(isInteractive);
      }
    };

    const handleMouseLeave = () => {
      if (mousePosRef) {
        mousePosRef.current.active = false;
      }
      targetX = -100;
      targetY = -100;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Smooth animation loop for trailing ring
    const render = () => {
      // Lerp ring towards target
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
        dotRef.current.style.opacity = targetX < 0 ? '0' : '1';
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        ringRef.current.style.opacity = currentX < 0 ? '0' : '1';
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mousePosRef]);

  if (isTouchDevice) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-300">
      {/* Central Sharp Reticle Dot */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-electric-teal shadow-[0_0_8px_#00D6C9] will-change-transform"
      />

      {/* Trailing Precision Ring */}
      <div
        ref={ringRef}
        className={`absolute top-0 left-0 transition-all duration-200 ease-out will-change-transform ${
          isHoveringInteractive
            ? '-ml-5 -mt-5 w-10 h-10 rounded-full border border-champagne-bronze/60 bg-champagne-bronze/10 shadow-[0_0_14px_rgba(198,164,119,0.3)] scale-110'
            : '-ml-3.5 -mt-3.5 w-7 h-7 rounded-full border border-electric-teal/30 bg-transparent shadow-[0_0_8px_rgba(0,214,201,0.15)] scale-100'
        }`}
      >
        {/* Subtle engineering crosshair ticks on hover */}
        {isHoveringInteractive && (
          <>
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-[1px] h-1.5 bg-champagne-bronze/80" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[1px] h-1.5 bg-champagne-bronze/80" />
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-[1px] w-1.5 bg-champagne-bronze/80" />
            <span className="absolute -right-1 top-1/2 -translate-y-1/2 h-[1px] w-1.5 bg-champagne-bronze/80" />
          </>
        )}
      </div>
    </div>
  );
};
