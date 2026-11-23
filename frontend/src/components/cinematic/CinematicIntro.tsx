import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, SkipForward } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

// Thousands of GPU-accelerated morphing particles
function CosmicMorphingParticles({
  phase,
  onPhaseChange,
}: {
  phase: number;
  onPhaseChange: (p: number) => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 3500;

  // Generate target coordinates:
  // Target 0: Cosmic Computational Spiral
  // Target 1: Architectural Data-Center Structure (Server Racks & Raised Floor Grid)
  const [positions, spiralPositions, rackPositions, colors] = useMemo(() => {
    const curPos = new Float32Array(count * 3);
    const spiral = new Float32Array(count * 3);
    const racks = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    // 1. Cosmic Spiral
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 14;
      const r = 0.5 + Math.pow(i / count, 0.75) * 6.5;
      const x = Math.cos(t) * r + (Math.random() - 0.5) * 0.4;
      const y = (i / count - 0.5) * 7.0 + (Math.random() - 0.5) * 0.3;
      const z = Math.sin(t) * r + (Math.random() - 0.5) * 0.4;

      spiral[i * 3] = x;
      spiral[i * 3 + 1] = y;
      spiral[i * 3 + 2] = z;

      // Start current at spiral
      curPos[i * 3] = x;
      curPos[i * 3 + 1] = y;
      curPos[i * 3 + 2] = z;

      // Color: Electric Teal (#00E5CC) to Ice Cyan (#62DDF5) with subtle Emerald (#00B894)
      const ratio = i / count;
      if (ratio < 0.5) {
        // Teal -> Cyan
        col[i * 3] = THREE.MathUtils.lerp(0.0, 0.38, ratio * 2);
        col[i * 3 + 1] = THREE.MathUtils.lerp(0.9, 0.87, ratio * 2);
        col[i * 3 + 2] = THREE.MathUtils.lerp(0.8, 0.96, ratio * 2);
      } else {
        // Cyan -> Emerald/Teal
        col[i * 3] = THREE.MathUtils.lerp(0.38, 0.0, (ratio - 0.5) * 2);
        col[i * 3 + 1] = THREE.MathUtils.lerp(0.87, 0.72, (ratio - 0.5) * 2);
        col[i * 3 + 2] = THREE.MathUtils.lerp(0.96, 0.58, (ratio - 0.5) * 2);
      }
    }

    // 2. Data Center Geometric Structure (Two symmetrical rows of 6 server cabinets + floor grid)
    for (let i = 0; i < count; i++) {
      if (i < 2400) {
        // Server rack cabinets geometry
        // 12 racks: 2 rows of 6
        const rackIdx = Math.floor(i / 200); // 0..11
        const row = rackIdx < 6 ? -1 : 1;
        const colIdx = rackIdx % 6;

        const rackCenterX = (colIdx - 2.5) * 1.8;
        const rackCenterZ = row * 2.2;

        // Bounding box of a rack: 0.9w, 2.8h, 1.1d
        const rx = rackCenterX + (Math.random() - 0.5) * 0.9;
        const ry = (Math.random() - 0.5) * 2.8;
        const rz = rackCenterZ + (Math.random() - 0.5) * 1.1;

        racks[i * 3] = rx;
        racks[i * 3 + 1] = ry;
        racks[i * 3 + 2] = rz;
      } else {
        // Raised access floor grid & overhead cable tray matrix
        const isCeiling = i % 2 === 0;
        const gx = (Math.random() - 0.5) * 14.0;
        const gz = (Math.random() - 0.5) * 10.0;
        const gy = isCeiling ? 2.0 + Math.random() * 0.4 : -1.8 - Math.random() * 0.2;

        racks[i * 3] = gx;
        racks[i * 3 + 1] = gy;
        racks[i * 3 + 2] = gz;
      }
    }

    return [curPos, spiral, racks, col];
  }, [count]);

  const morphProgress = useRef(0);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    // Slowly rotate scene
    pointsRef.current.rotation.y += delta * 0.15;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const curArray = posAttr.array as Float32Array;

    // Phase transition
    if (phase >= 1 && morphProgress.current < 1) {
      morphProgress.current = Math.min(1, morphProgress.current + delta * 0.4);
    }

    const t = morphProgress.current;
    // Smooth step interpolation
    const easeT = t * t * (3 - 2 * t);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      curArray[idx] = THREE.MathUtils.lerp(spiralPositions[idx], rackPositions[idx], easeT);
      curArray[idx + 1] = THREE.MathUtils.lerp(spiralPositions[idx + 1], rackPositions[idx + 1], easeT);
      curArray[idx + 2] = THREE.MathUtils.lerp(spiralPositions[idx + 2], rackPositions[idx + 2], easeT);
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<number>(0); // 0: spiral, 1: morph to datacenter, 2: brand reveal
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    // Stage 1: Transition to morphing after 2.2 seconds
    const timer1 = setTimeout(() => {
      setPhase(1);
    }, 2200);

    // Stage 2: Reveal identity after 4.5 seconds
    const timer2 = setTimeout(() => {
      setPhase(2);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleFinish = () => {
    sessionStorage.setItem('rv_intro_seen', 'true');
    setIntroVisible(false);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  return (
    <AnimatePresence>
      {introVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] bg-[#07090D] flex flex-col items-center justify-center select-none overflow-hidden"
        >
          {/* Subtle Ambient Vignette & Volumetric Lighting */}
          <div className="absolute inset-0 bg-radial from-transparent via-[#07090D]/60 to-[#07090D] pointer-events-none z-10" />

          {/* Three.js Particle Canvas */}
          <div className="absolute inset-0 z-0">
            <Canvas
              camera={{ position: [0, 0, 8.5], fov: 50 }}
              gl={{ antialias: true, alpha: true }}
            >
              <ambientLight intensity={0.2} />
              <pointLight position={[5, 5, 5]} intensity={1.5} color="#00E5CC" />
              <pointLight position={[-5, -5, -5]} intensity={1.0} color="#62DDF5" />
              <CosmicMorphingParticles phase={phase} onPhaseChange={setPhase} />
            </Canvas>
          </div>

          {/* Skip Intro Control */}
          <button
            onClick={handleFinish}
            className="absolute top-8 right-8 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-[#101720]/80 backdrop-blur-md border border-[#C9D3DB]/20 text-[#C9D3DB] hover:text-[#00E5CC] hover:border-[#00E5CC]/40 transition-all text-xs font-mono-code tracking-wider uppercase group cursor-pointer"
          >
            <span>Skip Experience</span>
            <SkipForward className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Atmospheric Brand Reveal Overlay */}
          <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl pointer-events-none">
            {/* Phase 0 & 1 subtle computational telemetry */}
            {phase < 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#101720]/70 border border-[#00E5CC]/20 text-[#00E5CC] text-xs font-mono-code mb-4 tracking-widest uppercase"
              >
                <span className="w-2 h-2 rounded-full bg-[#00E5CC] animate-ping" />
                {phase === 0 ? 'SYNTHESIZING COMPUTATIONAL INTELLIGENCE' : 'STRUCTURING MISSION-CRITICAL TOPOLOGY'}
              </motion.div>
            )}

            {/* Phase 2: Grand Identity Reveal */}
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center pointer-events-auto"
              >
                <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00E5CC]/10 border border-[#00E5CC]/30 text-[#00E5CC] text-xs font-mono-code tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(0,229,204,0.2)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PROJECT NEXUS &bull; ARCHITECTURAL INTELLIGENCE</span>
                </div>

                <h1 className="font-editorial text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-[#F4F7F8] mb-4">
                  RACKVISION<span className="text-[#00E5CC] italic font-normal">.AI</span>
                </h1>

                <p className="text-lg md:text-xl font-light text-[#C9D3DB] max-w-2xl mx-auto leading-relaxed mb-8 tracking-wide">
                  The Next Generation of Architectural Intelligence for Mission-Critical Data Centers.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={handleFinish}
                    className="btn-nexus-teal px-8 py-3.5 rounded-lg text-sm font-semibold tracking-wider uppercase flex items-center gap-3 cursor-pointer group shadow-[0_0_30px_rgba(0,229,204,0.35)]"
                  >
                    <span>Enter Engineering Platform</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Precision Telemetry Bar */}
          <div className="absolute bottom-6 left-8 right-8 z-20 flex items-center justify-between text-[11px] font-mono-code text-[#C9D3DB]/60 border-t border-[#C9D3DB]/10 pt-4 pointer-events-none">
            <div className="flex items-center gap-4">
              <span>SYSTEM: NEXUS-AI-V3</span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="hidden sm:inline">RENDERER: WEBGL-THREEJS</span>
            </div>
            <div className="flex items-center gap-2 text-[#00E5CC]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5CC] animate-pulse" />
              <span>3,500 GPU PARTICLES SYNCHRONIZED</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
