import React, { useRef, useEffect } from 'react';

export type UniverseMode = 'landing' | 'workspace' | 'studio' | 'simulator' | 'auth' | 'admin';

interface ContinuousUniverseCanvasProps {
  mode?: UniverseMode;
  mousePosRef?: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  phase: number;
  pulseSpeed: number;
  colorType: 0 | 1 | 2; // 0: Teal, 1: Ice Blue, 2: Bronze
}

interface EnergyTrace {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
}

export const ContinuousUniverseCanvas: React.FC<ContinuousUniverseCanvasProps> = ({
  mode = 'workspace',
  mousePosRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<UniverseMode>(mode);
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Reduced motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Palette: Electric Teal (#00D6C9), Ice Blue (#76CFFF), Champagne Bronze (#C6A477)
    const colorTeal = 'rgba(0, 214, 201, ';
    const colorIce = 'rgba(118, 207, 255, ';
    const colorBronze = 'rgba(198, 164, 119, ';

    // Particle setup
    const particleCount = mode === 'landing' ? 240 : mode === 'simulator' ? 70 : 160;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2, // depth factor
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.22 - 0.05, // subtle upward buoyancy
        radius: Math.random() * 1.6 + 0.6,
        baseAlpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        colorType: Math.random() > 0.4 ? (Math.random() > 0.5 ? 0 : 1) : 2,
      });
    }

    // Energy grid traces setup
    const energyTraces: EnergyTrace[] = [];
    for (let i = 0; i < 14; i++) {
      energyTraces.push({
        x: Math.random() * width,
        y: height * 0.4 + Math.random() * (height * 0.6),
        length: Math.random() * 80 + 30,
        speed: Math.random() * 1.5 + 0.8,
        angle: 0,
        alpha: Math.random() * 0.15 + 0.05,
      });
    }

    let isTabVisible = true;
    const handleVisibility = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();
    let globalTime = 0;

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      if (!prefersReducedMotion) globalTime += dt;

      // 1. Clear background to Obsidian (#080B0F)
      ctx.fillStyle = '#080B0F';
      ctx.fillRect(0, 0, width, height);

      // 2. Cinematic Ambient Lighting (Subtle roving radial glows)
      const currentMode = modeRef.current;
      const lightIntensity = currentMode === 'landing' ? 0.06 : currentMode === 'simulator' ? 0.02 : 0.045;

      // Primary Teal Atmospheric Glow
      const l1X = width * 0.35 + Math.sin(globalTime * 0.2) * (width * 0.15);
      const l1Y = height * 0.3 + Math.cos(globalTime * 0.18) * (height * 0.12);
      const rad1 = Math.min(width, height) * 0.55;
      const grad1 = ctx.createRadialGradient(l1X, l1Y, 0, l1X, l1Y, rad1);
      grad1.addColorStop(0, `rgba(0, 214, 201, ${lightIntensity})`);
      grad1.addColorStop(0.6, `rgba(0, 214, 201, ${lightIntensity * 0.3})`);
      grad1.addColorStop(1, 'rgba(8, 11, 15, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Secondary Ice Blue Atmospheric Glow
      const l2X = width * 0.7 + Math.cos(globalTime * 0.15) * (width * 0.15);
      const l2Y = height * 0.65 + Math.sin(globalTime * 0.22) * (height * 0.15);
      const rad2 = Math.min(width, height) * 0.6;
      const grad2 = ctx.createRadialGradient(l2X, l2Y, 0, l2X, l2Y, rad2);
      grad2.addColorStop(0, `rgba(118, 207, 255, ${lightIntensity * 0.75})`);
      grad2.addColorStop(1, 'rgba(8, 11, 15, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // 3. Delicate Luminous Architectural Perspective Grid Lines
      const gridAlpha = currentMode === 'simulator' ? 0.015 : 0.035;
      ctx.lineWidth = 1;
      const horizonY = height * 0.35;
      const gridSpacing = 42;

      // Horizontal lines with perspective compression
      ctx.strokeStyle = `rgba(118, 207, 255, ${gridAlpha})`;
      for (let y = horizonY; y < height; y += gridSpacing) {
        const factor = (y - horizonY) / (height - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical lines radiating down
      const vCols = 16;
      for (let i = 0; i <= vCols; i++) {
        const x = (i / vCols) * width;
        ctx.beginPath();
        ctx.moveTo(width * 0.5 + (x - width * 0.5) * 0.15, horizonY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 4. Moving Energy Traces along Grid
      ctx.lineWidth = 1.5;
      for (let i = 0; i < energyTraces.length; i++) {
        const tr = energyTraces[i];
        if (!prefersReducedMotion) {
          tr.x += tr.speed * 45 * dt;
          if (tr.x > width + 100) {
            tr.x = -100;
            tr.y = horizonY + Math.random() * (height - horizonY);
          }
        }
        ctx.strokeStyle = `rgba(0, 214, 201, ${tr.alpha})`;
        ctx.beginPath();
        ctx.moveTo(tr.x, tr.y);
        ctx.lineTo(tr.x - tr.length, tr.y);
        ctx.stroke();

        // Lead photon spark
        ctx.fillStyle = '#76CFFF';
        ctx.fillRect(tr.x - 1, tr.y - 1, 2, 2);
      }

      // 5. Living Particle Universe Simulation & Inter-Connection Filaments
      const mouse = mousePosRef?.current;
      const connectionDist = 72;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          // Harmonic wave drift
          p.x += (p.vx + Math.sin(globalTime * 0.7 + p.phase) * 0.15) * p.z;
          p.y += (p.vy + Math.cos(globalTime * 0.5 + p.phase) * 0.12) * p.z;

          // Subtle pointer deflection / attraction
          if (mouse && mouse.active) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180 && dist > 1) {
              const force = (1 - dist / 180) * 0.6;
              p.x -= (dx / dist) * force;
              p.y -= (dy / dist) * force;
            }
          }

          // Screen wrap-around
          if (p.x < -10) p.x = width + 10;
          else if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          else if (p.y > height + 10) p.y = -10;
        }

        // Pulse alpha
        const pulse = 0.85 + Math.sin(globalTime * 3 * p.pulseSpeed + p.phase) * 0.25;
        const curAlpha = p.baseAlpha * pulse * p.z;
        const colorPrefix = p.colorType === 0 ? colorTeal : p.colorType === 1 ? colorIce : colorBronze;

        // Draw particle dot
        ctx.fillStyle = `${colorPrefix}${curAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.z, 0, Math.PI * 2);
        ctx.fill();

        // Draw proximity connections to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < connectionDist) {
            const linkAlpha = (1 - cdist / connectionDist) * 0.16 * p.z;
            ctx.strokeStyle = `rgba(0, 214, 201, ${linkAlpha})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 6. Technical Measurement Ticks on Margins
      ctx.fillStyle = 'rgba(168, 179, 188, 0.15)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('NEXUS-V3 // ATMOSPHERIC VECTOR ENGINE', 24, height - 18);
      ctx.fillText(`SYS: ${currentMode.toUpperCase()}`, width - 150, height - 18);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 block w-full h-full select-none"
      aria-hidden="true"
    />
  );
};
