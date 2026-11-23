import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedRack() {
  const rackRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (rackRef.current) {
      // Smooth continuous architectural rotation, slower when hovered
      const speed = hovered ? 0.12 : 0.28;
      rackRef.current.rotation.y += delta * speed;
    }
  });

  return (
    <group
      ref={rackRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. OUTER SERVER CABINET ENCLOSURE (Porcelain White Architectural Frame)
          High contrast against the dark background.
          ───────────────────────────────────────────────────────────── */}
      {/* Back Panel (Light Graphite Architectural Steel) */}
      <mesh position={[0, 0, -0.62]}>
        <boxGeometry args={[1.48, 3.58, 0.04]} />
        <meshStandardMaterial
          color="#3A444E"
          roughness={0.25}
          metalness={0.3}
        />
      </mesh>

      {/* Left Outer Side Panel (Crisp Architectural White / Porcelain Ivory) */}
      <mesh position={[-0.72, 0, 0]}>
        <boxGeometry args={[0.04, 3.58, 1.24]} />
        <meshStandardMaterial
          color="#F0F4F8"
          roughness={0.2}
          metalness={0.15}
        />
      </mesh>

      {/* Right Outer Side Panel (Crisp Architectural White / Porcelain Ivory) */}
      <mesh position={[0.72, 0, 0]}>
        <boxGeometry args={[0.04, 3.58, 1.24]} />
        <meshStandardMaterial
          color="#F0F4F8"
          roughness={0.2}
          metalness={0.15}
        />
      </mesh>

      {/* Top Roof Cowling (White Powder-Coated Steel) */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[1.5, 0.08, 1.3]} />
        <meshStandardMaterial
          color="#E2E8F0"
          roughness={0.25}
          metalness={0.2}
        />
      </mesh>

      {/* Base Plinth (Polished Slate Plinth) */}
      <mesh position={[0, -1.8, 0]}>
        <boxGeometry args={[1.5, 0.08, 1.3]} />
        <meshStandardMaterial
          color="#242C35"
          roughness={0.4}
          metalness={0.4}
        />
      </mesh>

      {/* ─────────────────────────────────────────────────────────────
          2. VERTICAL 19-INCH MOUNTING RAILS (Brushed Satin Aluminum)
          ───────────────────────────────────────────────────────────── */}
      <mesh position={[-0.64, 0, 0.58]}>
        <boxGeometry args={[0.04, 3.5, 0.04]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.64, 0, 0.58]}>
        <boxGeometry args={[0.04, 3.5, 0.04]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[-0.64, 0, -0.58]}>
        <boxGeometry args={[0.04, 3.5, 0.04]} />
        <meshStandardMaterial color="#64748B" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.64, 0, -0.58]}>
        <boxGeometry args={[0.04, 3.5, 0.04]} />
        <meshStandardMaterial color="#64748B" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERNAL BLADE SERVER CHASSIS (14 High-Density Enterprise Modules)
          Graphite Chassis + Brushed Aluminum Faceplates + Glowing LEDs
          ───────────────────────────────────────────────────────────── */}
      {Array.from({ length: 14 }).map((_, i) => {
        const yPos = -1.48 + i * 0.228;
        const isCoreSwitch = i === 6 || i === 7;
        const isStorageNode = i < 4;

        return (
          <group key={i} position={[0, yPos, 0]}>
            {/* Chassis main body (Graphite Enterprise Enclosure) */}
            <mesh position={[0, 0, 0.04]}>
              <boxGeometry args={[1.28, 0.19, 1.1]} />
              <meshStandardMaterial
                color={isCoreSwitch ? "#1E252D" : (i % 2 === 0 ? "#2B3540" : "#343E4B")}
                metalness={0.35}
                roughness={0.4}
              />
            </mesh>

            {/* Brushed Aluminum Faceplate Bezel */}
            <mesh position={[0, 0, 0.59]}>
              <boxGeometry args={[1.24, 0.17, 0.02]} />
              <meshStandardMaterial
                color={isCoreSwitch ? "#475569" : "#64748B"}
                metalness={0.65}
                roughness={0.25}
              />
            </mesh>

            {/* Drive Bay Ventilation Slots */}
            <mesh position={[-0.1, 0, 0.605]}>
              <boxGeometry args={[0.68, 0.12, 0.01]} />
              <meshStandardMaterial
                color="#0F172A"
                metalness={0.5}
                roughness={0.5}
              />
            </mesh>

            {/* ── Status Indicator LEDs (Luminous Emissive Colors) ── */}
            {/* Primary Power/Link LED (Cyan / Electric Teal) */}
            <mesh position={[-0.52, 0, 0.615]}>
              <sphereGeometry args={[0.024, 16, 16]} />
              <meshBasicMaterial color="#00F2FE" />
            </mesh>

            {/* Health / IO Activity (Emerald Green) */}
            <mesh position={[-0.45, 0, 0.615]}>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshBasicMaterial color={i % 3 === 0 ? "#10B981" : "#34D399"} />
            </mesh>

            {/* Compute / Storage Activity (Amber / Champagne Copper) */}
            <mesh position={[-0.38, 0, 0.615]}>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshBasicMaterial color={isStorageNode ? "#F59E0B" : (i % 2 === 0 ? "#B87954" : "#00F2FE")} />
            </mesh>

            {/* High-speed optic transceivers on core switches */}
            {isCoreSwitch && (
              <>
                <mesh position={[0.32, 0, 0.615]}>
                  <boxGeometry args={[0.22, 0.045, 0.015]} />
                  <meshBasicMaterial color="#00F2FE" />
                </mesh>
                <mesh position={[0.48, 0, 0.615]}>
                  <sphereGeometry args={[0.024, 16, 16]} />
                  <meshBasicMaterial color="#10B981" />
                </mesh>
              </>
            )}

            {/* Rack-Ear Mounting Hardware (Polished Chrome) */}
            <mesh position={[-0.61, 0, 0.602]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.015, 8]} />
              <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.61, 0, 0.602]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.015, 8]} />
              <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );
      })}

      {/* ─────────────────────────────────────────────────────────────
          4. FRONT PERFORATED GLASS / ACRYLIC DOOR
          Clear transparent pane — zero transmission rendering artifacts.
          ───────────────────────────────────────────────────────────── */}
      <mesh position={[0, 0, 0.65]}>
        <planeGeometry args={[1.36, 3.48]} />
        <meshStandardMaterial
          color="#E0F2FE"
          transparent={true}
          opacity={0.18}
          roughness={0.08}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glass Door Outline Frame (Electric Teal Accent) */}
      <mesh position={[0, 0, 0.655]}>
        <boxGeometry args={[1.38, 3.5, 0.01]} />
        <meshStandardMaterial
          color="#00A99D"
          wireframe={true}
          transparent={true}
          opacity={0.4}
        />
      </mesh>

      {/* Door Handle (Brushed Aluminum Vertical Pull) */}
      <mesh position={[0.62, 0, 0.68]}>
        <cylinderGeometry args={[0.012, 0.012, 0.45, 12]} />
        <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ─────────────────────────────────────────────────────────────
          5. RAISED FLOOR PEDESTAL BASE & ILLUMINATED GROUND HALO
          ───────────────────────────────────────────────────────────── */}
      {/* Subfloor Pedestal Ring */}
      <mesh position={[0, -1.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 1.45, 48]} />
        <meshStandardMaterial
          color="#E2E8F0"
          metalness={0.3}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cyan Ground Glow Projection Ring */}
      <mesh position={[0, -1.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.48, 1.56, 48]} />
        <meshBasicMaterial color="#00F2FE" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export const Hero3DRack: React.FC = () => {
  return (
    <div className="w-full h-[400px] relative bg-gradient-to-b from-[#111C27] to-[#18232F] rounded-2xl border border-[#2A3744] overflow-hidden shadow-2xl">
      <Canvas
        camera={{ position: [2.8, 1.2, 4.0], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,
        }}
      >
        {/* Bright Studio Ambient Illumination */}
        <ambientLight intensity={2.8} color="#FFFFFF" />

        {/* High-Key Architectural Directional Light (Warm Studio Key) */}
        <directionalLight position={[6, 9, 7]} intensity={3.0} color="#FFFFFF" />

        {/* Soft Front Fill Light for Deep Rack Cavity Visibility */}
        <directionalLight position={[0, 1, 6]} intensity={2.2} color="#F1F5F9" />

        {/* Vibrant Cyan Rim Light (Left Architectural Edge Glow) */}
        <directionalLight position={[-7, 4, -4]} intensity={3.5} color="#00F2FE" />

        {/* Warm Champagne Copper Side Fill (Right Dimension) */}
        <pointLight position={[5, -1, 3]} intensity={2.0} color="#B87954" />

        {/* Top Downlight for Server Blade Faceplate Definition */}
        <spotLight
          position={[0, 7, 3]}
          intensity={2.5}
          angle={0.65}
          penumbra={0.5}
          color="#FFFFFF"
        />

        <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.25}>
          <AnimatedRack />
        </Float>

        {/* Interactive Orbit Controls with enabled Rotation & Zoom */}
        <OrbitControls
          enableZoom={true}
          minDistance={2.2}
          maxDistance={6.5}
          autoRotate={false}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={(2.2 * Math.PI) / 3}
        />
      </Canvas>

      {/* Floating Status Telemetry Badge */}
      <div className="absolute top-3 left-3 px-3 py-1.5 bg-[#111C27]/90 backdrop-blur-md rounded-lg border border-[#2A3744] text-[10px] text-[#DEDCD4] font-mono-code flex items-center gap-2 shadow-xs select-none">
        <span className="w-2 h-2 rounded-full bg-[#00F2FE] animate-ping" />
        <span className="text-[#00F2FE] font-bold">DIGITAL TWIN</span>
        <span className="text-[#87939B]">&bull;</span>
        <span>42U ENTERPRISE BLADE CHASSIS</span>
      </div>

      <div className="absolute bottom-3 right-3 px-3 py-1 bg-[#111C27]/90 backdrop-blur-md rounded-lg border border-[#2A3744] text-[10px] text-[#87939B] font-mono-code flex items-center gap-2 select-none">
        <span>DRAG TO ROTATE &bull; SCROLL TO ZOOM</span>
      </div>
    </div>
  );
};
