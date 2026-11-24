import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { RackComponent, CoolingUnit, PDUComponent, CableTray, Scene3DConfig } from '../../types';

interface DataCenterCanvasProps {
  sceneConfig: Scene3DConfig;
  selectedRackId: string | null;
  onSelectRack: (rack: RackComponent | null) => void;
  onSelectComponent?: (id: string) => void;
  showAirflow: boolean;
  showCableTrays: boolean;
  showThermalHeatmap: boolean;
  showContainment: boolean;
  viewMode: 'perspective' | 'top' | 'front' | 'side';
}

// Animated Airflow Particles (Cold Inflow & Hot Exhaust)
function AirflowSimulation({ count = 320, show }: { count?: number; show: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const isCold = i % 2 === 0;
      // Cold aisle particles originate in center aisle (z near 0)
      if (isCold) {
        pos[i * 3] = (Math.random() - 0.5) * 14;     // x
        pos[i * 3 + 1] = Math.random() * 0.4;       // y near floor
        pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5; // z in cold aisle
        vel[i * 3] = (Math.random() - 0.5) * 0.01;
        vel[i * 3 + 1] = 0.018 + Math.random() * 0.02; // moving upward
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
        // Electric Teal / Cyan (#00E5CC)
        col[i * 3] = 0.0;
        col[i * 3 + 1] = 0.9;
        col[i * 3 + 2] = 0.8;
      } else {
        // Hot exhaust particles originate behind racks (|z| > 2.8)
        const sign = Math.random() > 0.5 ? 1 : -1;
        pos[i * 3] = (Math.random() - 0.5) * 14;
        pos[i * 3 + 1] = 0.8 + Math.random() * 1.5;
        pos[i * 3 + 2] = sign * (3.2 + Math.random() * 1.8);
        vel[i * 3] = (Math.random() - 0.5) * 0.01;
        vel[i * 3 + 1] = 0.022 + Math.random() * 0.025; // rising fast
        vel[i * 3 + 2] = sign * (0.01 + Math.random() * 0.01);
        // Orange / Red heat
        col[i * 3] = 1.0;
        col[i * 3 + 1] = 0.35;
        col[i * 3 + 2] = 0.15;
      }
    }
    return [pos, vel, col];
  }, [count]);

  useFrame(() => {
    if (!pointsRef.current || !show) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += velocities[i * 3 + 1];
      // Reset if reached ceiling
      if (posArr[i * 3 + 1] > 4.2) {
        posArr[i * 3 + 1] = 0.1;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (!show) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.11}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Server Rack Component with clickable selection & LED animation
function ServerRackItem({
  rack,
  isSelected,
  onSelect,
  showHeatmap
}: {
  rack: RackComponent;
  isSelected: boolean;
  onSelect: () => void;
  showHeatmap: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isHighDensity = rack.power_kw > 10.0;

  // Temperature color in heatmap mode vs physical anthracite steel
  const rackColor = showHeatmap
    ? (isHighDensity ? '#EF4444' : '#00E5CC')
    : (isSelected ? '#00E5CC' : '#151E28');

  return (
    <group
      position={[rack.x, rack.y, rack.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* 1. Outer Cabinet Frame (High contrast Anthracite Architectural Steel) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[rack.width, rack.height, rack.depth]} />
        <meshStandardMaterial
          color={rackColor}
          metalness={0.75}
          roughness={0.25}
          wireframe={isSelected}
        />
      </mesh>

      {/* 2. Internal Server Blade Chassis Units (Visible clearly through frame) */}
      {Array.from({ length: 6 }).map((_, i) => {
        const yOff = -0.7 + i * 0.28;
        return (
          <group key={i} position={[0, yOff, rack.depth / 2 + 0.015]}>
            {/* Chassis Faceplate */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[rack.width * 0.88, 0.22]} />
              <meshStandardMaterial
                color={i === 3 ? '#1C2936' : '#223242'}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Left Cyan Status LED */}
            <mesh position={[-rack.width * 0.35, 0, 0.01]}>
              <planeGeometry args={[0.03, 0.03]} />
              <meshBasicMaterial color={isSelected ? '#62DDF5' : '#00E5CC'} />
            </mesh>

            {/* Right Emerald Activity LED */}
            <mesh position={[-rack.width * 0.22, 0, 0.01]}>
              <planeGeometry args={[0.02, 0.02]} />
              <meshBasicMaterial color={isHighDensity ? '#FFB800' : '#00B894'} />
            </mesh>
          </group>
        );
      })}

      {/* 3. Translucent Perforated Front Door */}
      <mesh position={[0, 0, rack.depth / 2 + 0.03]}>
        <planeGeometry args={[rack.width * 0.92, rack.height * 0.95]} />
        <meshPhysicalMaterial
          color="#0B131C"
          transparent
          opacity={0.35}
          roughness={0.1}
          metalness={0.3}
          transmission={0.65}
        />
      </mesh>

      {/* 4. Selection Highlight Luminous Ring */}
      {isSelected && (
        <group position={[0, -rack.height / 2 + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.6, 0.75, 32]} />
            <meshBasicMaterial color="#00E5CC" side={THREE.DoubleSide} />
          </mesh>
          <pointLight color="#00E5CC" intensity={1.5} distance={2.5} />
        </group>
      )}

      {/* 5. Rack Name Label */}
      <Text
        position={[0, rack.height / 2 + 0.25, 0]}
        fontSize={0.2}
        color={isSelected ? '#00E5CC' : '#C9D3DB'}
        anchorX="center"
        anchorY="middle"
      >
        {rack.name}
      </Text>
    </group>
  );
}

// CRAC Precision Cooling Unit
function CRACUnitItem({ unit, onSelect }: { unit: CoolingUnit; onSelect?: () => void }) {
  return (
    <group
      position={[unit.x, unit.y, unit.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh>
        <boxGeometry args={[unit.width, unit.height, unit.depth]} />
        <meshStandardMaterial color="#1E2C3D" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Front Ventilation Grille */}
      <mesh position={[0, -0.3, unit.depth / 2 + 0.02]}>
        <planeGeometry args={[unit.width * 0.85, unit.height * 0.5]} />
        <meshStandardMaterial color="#0B121A" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Cyan active cooling status bar */}
      <mesh position={[0, 0.8, unit.depth / 2 + 0.03]}>
        <planeGeometry args={[unit.width * 0.7, 0.08]} />
        <meshBasicMaterial color="#00E5CC" />
      </mesh>
      <Text
        position={[0, unit.height / 2 + 0.3, 0]}
        fontSize={0.22}
        color="#62DDF5"
        anchorX="center"
        anchorY="middle"
      >
        {unit.name} ({unit.capacity_kw}kW)
      </Text>
    </group>
  );
}

// PDU Transformer Item
function PDUItemComponent({ pdu, onSelect }: { pdu: PDUComponent; onSelect?: () => void }) {
  return (
    <group
      position={[pdu.x, pdu.y, pdu.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh>
        <boxGeometry args={[pdu.width, pdu.height, pdu.depth]} />
        <meshStandardMaterial color="#2B3A4C" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* PDU Power Display Bezel */}
      <mesh position={[0, 0.4, pdu.depth / 2 + 0.02]}>
        <planeGeometry args={[0.5, 0.3]} />
        <meshBasicMaterial color="#00B894" />
      </mesh>
      <Text
        position={[0, pdu.height / 2 + 0.25, 0]}
        fontSize={0.2}
        color="#00B894"
        anchorX="center"
        anchorY="middle"
      >
        {pdu.name} ({pdu.rating_kva}kVA)
      </Text>
    </group>
  );
}

// Camera Controller for View Modes
function CameraManager({ viewMode }: { viewMode: string }) {
  const { camera } = useThree();

  useEffect(() => {
    if (viewMode === 'top') {
      camera.position.set(0, 24, 0.1);
      camera.lookAt(0, 0, 0);
    } else if (viewMode === 'front') {
      camera.position.set(0, 2.5, 18);
      camera.lookAt(0, 2.0, 0);
    } else if (viewMode === 'side') {
      camera.position.set(-18, 2.5, 0);
      camera.lookAt(0, 2.0, 0);
    } else {
      // Perspective
      camera.position.set(12, 10, 16);
      camera.lookAt(0, 1.5, 0);
    }
  }, [viewMode, camera]);

  return null;
}

export const DataCenterCanvas: React.FC<DataCenterCanvasProps> = ({
  sceneConfig,
  selectedRackId,
  onSelectRack,
  onSelectComponent,
  showAirflow,
  showCableTrays,
  showThermalHeatmap,
  showContainment,
  viewMode
}) => {
  const { room_dims, racks, cooling_units, pdus, cable_trays } = sceneConfig;

  return (
    <div className="w-full h-full relative bg-[#07090D] select-none" data-lenis-prevent>
      <Canvas
        camera={{ position: [12, 10, 16], fov: 48 }}
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onClick={() => {
          onSelectRack(null);
          onSelectComponent?.('');
        }}
      >
        <CameraManager viewMode={viewMode} />
        {/* Balanced Realistic Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 15]} intensity={1.8} castShadow />
        <pointLight position={[-10, 6, -10]} intensity={1.6} color="#00E5CC" />
        <pointLight position={[10, 6, 10]} intensity={1.4} color="#62DDF5" />
        <pointLight position={[0, 4, 0]} intensity={1.2} color="#F4F7F8" />

        {/* 1. Raised Floor System (Anthracite tile with cyan reflection) */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[room_dims.width, room_dims.length]} />
          <meshStandardMaterial color="#0B1017" roughness={0.25} metalness={0.7} />
        </mesh>

        {/* Floor Grid (Tile Lines) */}
        <gridHelper
          args={[room_dims.length, 36, '#00E5CC', '#182433']}
          position={[0, 0.01, 0]}
        />

        {/* 2. Room Perimeter Walls (Architectural translucent glass walls) */}
        {/* North Wall */}
        <mesh position={[0, room_dims.height / 2, -room_dims.length / 2]}>
          <boxGeometry args={[room_dims.width, room_dims.height, 0.2]} />
          <meshStandardMaterial color="#101720" transparent opacity={0.4} />
        </mesh>
        {/* South Wall */}
        <mesh position={[0, room_dims.height / 2, room_dims.length / 2]}>
          <boxGeometry args={[room_dims.width, room_dims.height, 0.2]} />
          <meshStandardMaterial color="#101720" transparent opacity={0.4} />
        </mesh>
        {/* West Wall */}
        <mesh position={[-room_dims.width / 2, room_dims.height / 2, 0]}>
          <boxGeometry args={[0.2, room_dims.height, room_dims.length]} />
          <meshStandardMaterial color="#101720" transparent opacity={0.4} />
        </mesh>
        {/* East Wall */}
        <mesh position={[room_dims.width / 2, room_dims.height / 2, 0]}>
          <boxGeometry args={[0.2, room_dims.height, room_dims.length]} />
          <meshStandardMaterial color="#101720" transparent opacity={0.4} />
        </mesh>

        {/* 3. Server Racks */}
        {racks.map((rack) => (
          <ServerRackItem
            key={rack.id}
            rack={rack}
            isSelected={selectedRackId === rack.id}
            onSelect={() => {
              onSelectRack(rack);
              onSelectComponent?.(rack.id);
            }}
            showHeatmap={showThermalHeatmap}
          />
        ))}

        {/* 4. Cooling Units (CRAC) */}
        {cooling_units.map((unit) => (
          <CRACUnitItem
            key={unit.id}
            unit={unit}
            onSelect={() => onSelectComponent?.(unit.id)}
          />
        ))}

        {/* 5. PDUs */}
        {pdus.map((pdu) => (
          <PDUItemComponent
            key={pdu.id}
            pdu={pdu}
            onSelect={() => onSelectComponent?.(pdu.id)}
          />
        ))}

        {/* 6. Overhead Cable Trays */}
        {showCableTrays && cable_trays.map((tray) => (
          <group key={tray.id} position={[tray.x, tray.y, tray.z]}>
            <mesh>
              <boxGeometry
                args={
                  tray.orientation === 'cross'
                    ? [tray.length, 0.08, tray.width]
                    : [tray.width, 0.08, tray.length]
                }
              />
              <meshStandardMaterial color="#62DDF5" wireframe={true} />
            </mesh>
          </group>
        ))}

        {/* 7. Cold Aisle Containment Roof & End Panels */}
        {showContainment && (
          <group position={[0, 2.3, 0]}>
            {/* Ceiling translucent panel between Row A and Row B */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[14.5, 4.0]} />
              <meshPhysicalMaterial
                color="#00E5CC"
                transparent
                opacity={0.2}
                roughness={0.1}
                transmission={0.8}
              />
            </mesh>
            {/* Sliding End Doors */}
            <mesh position={[-7.4, -0.6, 0]}>
              <boxGeometry args={[0.08, 2.0, 4.0]} />
              <meshPhysicalMaterial
                color="#00E5CC"
                transparent
                opacity={0.3}
                roughness={0.1}
              />
            </mesh>
            <mesh position={[7.4, -0.6, 0]}>
              <boxGeometry args={[0.08, 2.0, 4.0]} />
              <meshPhysicalMaterial
                color="#00E5CC"
                transparent
                opacity={0.3}
                roughness={0.1}
              />
            </mesh>
          </group>
        )}

        {/* 8. Airflow Particles */}
        <AirflowSimulation show={showAirflow} count={300} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.02}
          minDistance={3}
          maxDistance={45}
        />
      </Canvas>
    </div>
  );
};
