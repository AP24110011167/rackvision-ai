import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

// Realistic Server Cabinet with glass door, perforated metal, and cyan LEDs
function ServerCabinet({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Outer Cabinet Frame (Deep Graphite Anthracite #101720) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.0, 3.2, 1.2]} />
        <meshStandardMaterial
          color="#101720"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Internal Server Blades (12 blade slots) */}
      {Array.from({ length: 10 }).map((_, i) => {
        const y = -1.2 + i * 0.26;
        const isSwitch = i === 5;
        return (
          <group key={i} position={[0, y, 0.05]}>
            {/* Server Chassis Body */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.88, 0.22, 1.05]} />
              <meshStandardMaterial
                color={isSwitch ? '#16222F' : '#1A232E'}
                metalness={0.8}
                roughness={0.25}
              />
            </mesh>

            {/* Front Bezel & Activity LEDs */}
            <mesh position={[0, 0, 0.535]}>
              <boxGeometry args={[0.84, 0.2, 0.02]} />
              <meshStandardMaterial
                color="#0D131A"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>

            {/* Server Status LEDs (Cyan #62DDF5 & Electric Teal #00E5CC) */}
            <mesh position={[-0.32, 0, 0.55]}>
              <boxGeometry args={[0.04, 0.04, 0.01]} />
              <meshBasicMaterial color={i % 3 === 0 ? '#00E5CC' : '#62DDF5'} />
            </mesh>
            <mesh position={[-0.24, 0, 0.55]}>
              <boxGeometry args={[0.03, 0.03, 0.01]} />
              <meshBasicMaterial color="#00E5CC" />
            </mesh>
            <mesh position={[0.3, 0, 0.55]}>
              <boxGeometry args={[0.1, 0.03, 0.01]} />
              <meshBasicMaterial color="#00B894" />
            </mesh>
          </group>
        );
      })}

      {/* Glass Server Cabinet Front Door (Translucent Smoked Glass with Luminous Edge) */}
      <mesh position={[0, 0, 0.61]}>
        <boxGeometry args={[0.96, 3.12, 0.03]} />
        <meshPhysicalMaterial
          color="#111E2A"
          transparent
          opacity={0.45}
          roughness={0.1}
          metalness={0.2}
          transmission={0.6}
          ior={1.45}
        />
      </mesh>

      {/* Vertical LED Edge Strip */}
      <mesh position={[-0.48, 0, 0.62]}>
        <boxGeometry args={[0.02, 3.1, 0.01]} />
        <meshBasicMaterial color={hovered ? '#62DDF5' : '#00E5CC'} />
      </mesh>
    </group>
  );
}

// Overhead Cable Trays & Cooling Infrastructure
function InfrastructurePipes() {
  return (
    <group position={[0, 2.1, 0]}>
      {/* Longitudinal Yellow/Teal Cable Tray Runners */}
      <mesh position={[-1.8, 0, 0]}>
        <boxGeometry args={[0.4, 0.06, 12]} />
        <meshStandardMaterial color="#2B3847" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.8, 0, 0]}>
        <boxGeometry args={[0.4, 0.06, 12]} />
        <meshStandardMaterial color="#2B3847" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Overhead Containment Ceiling Plenum (Smoked Acrylic) */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[3.2, 0.04, 11]} />
        <meshPhysicalMaterial
          color="#00E5CC"
          transparent
          opacity={0.2}
          transmission={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Perimeter Downflow Cooling Duct */}
      <mesh position={[3.6, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 12, 16]} />
        <meshStandardMaterial color="#3A4857" metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[-3.6, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 12, 16]} />
        <meshStandardMaterial color="#3A4857" metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

// Raised Access Flooring with Reflective Grid
function RaisedFlooring() {
  return (
    <group position={[0, -1.65, 0]}>
      {/* Base Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#07090D"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Floor Tile Grid Lines */}
      <gridHelper args={[20, 20, '#00E5CC', '#111E2A']} position={[0, 0.01, 0]} />

      {/* Cold Aisle Perforated Floor Inflow Grates (Cyan Glow Beneath) */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 9.6]} />
        <meshStandardMaterial
          color="#0B131C"
          emissive="#00E5CC"
          emissiveIntensity={0.25}
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// Camera interaction controller with subtle pointer parallax
function ParallaxSceneGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Subtle pointer parallax rotation
    const targetX = (state.pointer.y * Math.PI) * 0.04;
    const targetY = (state.pointer.x * Math.PI) * 0.06;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.05);
  });

  return <group ref={groupRef}>{children}</group>;
}

export const NexusHeroCanvas: React.FC = () => {
  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [0, 0.6, 6.2], fov: 48 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Cinematic Atmospheric Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 1.8, 0]} intensity={2.5} color="#00E5CC" distance={8} />
        <pointLight position={[-4, 2, 3]} intensity={1.8} color="#62DDF5" distance={10} />
        <pointLight position={[4, 2, -3]} intensity={1.5} color="#00B894" distance={10} />
        <directionalLight position={[0, 5, 5]} intensity={1.2} color="#F4F7F8" />

        <ParallaxSceneGroup>
          {/* Dual symmetrical rows of 42U server cabinets along the central aisle */}
          {/* Left Row */}
          {[-3.6, -1.8, 0, 1.8, 3.6].map((z, idx) => (
            <ServerCabinet
              key={`left-${idx}`}
              position={[-1.7, 0, z]}
              rotationY={Math.PI / 2}
            />
          ))}

          {/* Right Row */}
          {[-3.6, -1.8, 0, 1.8, 3.6].map((z, idx) => (
            <ServerCabinet
              key={`right-${idx}`}
              position={[1.7, 0, z]}
              rotationY={-Math.PI / 2}
            />
          ))}

          {/* Infrastructure */}
          <InfrastructurePipes />
          <RaisedFlooring />
        </ParallaxSceneGroup>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 + 0.05}
          minPolarAngle={Math.PI / 3}
          maxAzimuthAngle={Math.PI / 6}
          minAzimuthAngle={-Math.PI / 6}
        />
      </Canvas>

      {/* Floating Precision Engineering Annotations */}
      <div className="absolute top-8 left-8 z-20 hidden md:flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#101720]/80 backdrop-blur-md border border-[#00E5CC]/30 text-[#00E5CC] text-[11px] font-mono-code shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#00E5CC] animate-ping" />
          <span>LIVE 3D RECONSTRUCTION &bull; 1080P MASTER</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#101720]/80 backdrop-blur-md border border-[#C9D3DB]/20 text-[#C9D3DB] text-[11px] font-mono-code">
          <span>COMPUTATIONAL DESIGN ENGINE &bull; ACTIVE</span>
        </div>
      </div>

      <div className="absolute top-8 right-8 z-20 hidden md:flex flex-col gap-2 items-end pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#101720]/80 backdrop-blur-md border border-[#62DDF5]/30 text-[#62DDF5] text-[11px] font-mono-code shadow-xs">
          <span>SDXL + CONTROLNET CANNY &bull; LOCKED</span>
          <span className="w-2 h-2 rounded-full bg-[#62DDF5] animate-pulse" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#101720]/80 backdrop-blur-md border border-[#00B894]/30 text-[#00B894] text-[11px] font-mono-code">
          <span>THERMAL INTELLIGENCE &bull; ASHRAE A1 COMPLIANT</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#101720]/90 backdrop-blur-md border border-[#C9D3DB]/20 text-[#C9D3DB] text-xs font-mono-code shadow-lg pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00E5CC]" />
        <span>ARCHITECTURAL PRECISION &bull; ZERO HALLUCINATION COORDINATES</span>
      </div>
    </div>
  );
};
