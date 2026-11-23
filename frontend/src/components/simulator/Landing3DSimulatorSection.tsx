import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box, Wind, Thermometer, Layers, Compass, Eye,
  RotateCcw, Sparkles, ArrowRight, CheckCircle2, Shield
} from 'lucide-react';
import { DataCenterCanvas } from './DataCenterCanvas';
import { Scene3DConfig, RackComponent } from '../../types';

interface Landing3DSimulatorSectionProps {
  onExploreStudio: () => void;
}

// Ground truth P2 12-rack data center configuration
const LANDING_SCENE_CONFIG: Scene3DConfig = {
  project_id: 'proj-helios-01',
  room_dims: {
    width: 8.27,
    length: 6.0,
    height: 3.5,
  },
  racks: [
    // Row A (6 cabinets)
    { id: 'rack-a1', name: 'Rack Row-A-01', row: 'Row A', x: -3.5, y: 1.1, z: -1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 10.0, status: 'operational', servers_count: 24 },
    { id: 'rack-a2', name: 'Rack Row-A-02', row: 'Row A', x: -2.1, y: 1.1, z: -1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 12.5, status: 'operational', servers_count: 30 },
    { id: 'rack-a3', name: 'Rack Row-A-03', row: 'Row A', x: -0.7, y: 1.1, z: -1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 14.0, status: 'warning', servers_count: 32 },
    { id: 'rack-a4', name: 'Rack Row-A-04', row: 'Row A', x: 0.7, y: 1.1, z: -1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 8.5, status: 'operational', servers_count: 20 },
    { id: 'rack-a5', name: 'Rack Row-A-05', row: 'Row A', x: 2.1, y: 1.1, z: -1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 11.0, status: 'operational', servers_count: 26 },
    { id: 'rack-a6', name: 'Rack Row-A-06', row: 'Row A', x: 3.5, y: 1.1, z: -1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 9.0, status: 'operational', servers_count: 22 },

    // Row B (6 cabinets)
    { id: 'rack-b1', name: 'Rack Row-B-01', row: 'Row B', x: -3.5, y: 1.1, z: 1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 12.0, status: 'operational', servers_count: 28 },
    { id: 'rack-b2', name: 'Rack Row-B-02', row: 'Row B', x: -2.1, y: 1.1, z: 1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 10.5, status: 'operational', servers_count: 25 },
    { id: 'rack-b3', name: 'Rack Row-B-03', row: 'Row B', x: -0.7, y: 1.1, z: 1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 13.0, status: 'operational', servers_count: 31 },
    { id: 'rack-b4', name: 'Rack Row-B-04', row: 'Row B', x: 0.7, y: 1.1, z: 1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 11.5, status: 'operational', servers_count: 27 },
    { id: 'rack-b5', name: 'Rack Row-B-05', row: 'Row B', x: 2.1, y: 1.1, z: 1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 10.0, status: 'operational', servers_count: 24 },
    { id: 'rack-b6', name: 'Rack Row-B-06', row: 'Row B', x: 3.5, y: 1.1, z: 1.4, width: 0.8, height: 2.2, depth: 1.2, type: '42U Enclosure', power_kw: 8.0, status: 'operational', servers_count: 19 },
  ],
  cooling_units: [
    { id: 'ukg-01', name: 'UKG Unit 01 (Downflow)', x: -4.8, y: 1.0, z: -1.4, width: 1.0, height: 2.0, depth: 1.0, capacity_kw: 15.0 },
    { id: 'ukg-02', name: 'UKG Unit 02 (Downflow)', x: -4.8, y: 1.0, z: 1.4, width: 1.0, height: 2.0, depth: 1.0, capacity_kw: 15.0 },
    { id: 'ukg-03', name: 'UKG Unit 03 (Standby)', x: 4.8, y: 1.0, z: 0.0, width: 1.0, height: 2.0, depth: 1.0, capacity_kw: 15.0 },
  ],
  pdus: [
    { id: 'pdu-01', name: 'Power PDU Feed A', x: 4.8, y: 1.0, z: -1.4, width: 0.8, height: 2.0, depth: 0.8, rating_kva: 160 },
    { id: 'pdu-02', name: 'Power PDU Feed B', x: 4.8, y: 1.0, z: 1.4, width: 0.8, height: 2.0, depth: 0.8, rating_kva: 160 },
  ],
  cable_trays: [
    { id: 'tray-01', x: 0, y: 2.4, z: -1.4, length: 8.0, width: 0.6, orientation: 'x' },
    { id: 'tray-02', x: 0, y: 2.4, z: 1.4, length: 8.0, width: 0.6, orientation: 'x' },
    { id: 'tray-03', x: 0, y: 2.6, z: 0, length: 3.5, width: 0.4, orientation: 'z' },
  ],
};

export const Landing3DSimulatorSection: React.FC<Landing3DSimulatorSectionProps> = ({ onExploreStudio }) => {
  const [selectedRack, setSelectedRack] = useState<RackComponent | null>(LANDING_SCENE_CONFIG.racks[1]);
  const [showAirflow, setShowAirflow] = useState(true);
  const [showThermalHeatmap, setShowThermalHeatmap] = useState(true);
  const [showCableTrays, setShowCableTrays] = useState(true);
  const [showContainment, setShowContainment] = useState(true);
  const [viewMode, setViewMode] = useState<'perspective' | 'top' | 'front' | 'side'>('perspective');

  return (
    <div className="space-y-6">
      {/* Simulator Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-titanium-charcoal/80 border border-white/10 backdrop-blur-md">
        {/* Left: View Mode Buttons */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-muted-silver mr-2 hidden sm:inline">VIEW CAMERA:</span>
          {(['perspective', 'top', 'front', 'side'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg uppercase transition-all cursor-pointer ${
                viewMode === mode
                  ? 'bg-electric-teal text-obsidian font-bold shadow-[0_0_10px_rgba(0,214,201,0.3)]'
                  : 'text-muted-silver hover:text-warm-ivory hover:bg-white/5'
              }`}
            >
              {mode === 'perspective' ? '3D Orbit' : mode === 'top' ? 'Top CAD' : mode === 'front' ? 'Aisle Front' : 'Side Elev'}
            </button>
          ))}
        </div>

        {/* Right: Simulation Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowAirflow(!showAirflow)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              showAirflow
                ? 'bg-electric-teal/15 border-electric-teal text-electric-teal'
                : 'bg-titanium-charcoal border-white/10 text-muted-silver/60'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Airflow Particles</span>
          </button>

          <button
            onClick={() => setShowThermalHeatmap(!showThermalHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              showThermalHeatmap
                ? 'bg-controlled-emerald/15 border-controlled-emerald text-controlled-emerald'
                : 'bg-titanium-charcoal border-white/10 text-muted-silver/60'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Thermal Heatmap</span>
          </button>

          <button
            onClick={() => setShowCableTrays(!showCableTrays)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              showCableTrays
                ? 'bg-champagne-bronze/15 border-champagne-bronze text-champagne-bronze'
                : 'bg-titanium-charcoal border-white/10 text-muted-silver/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cable Trays</span>
          </button>

          <button
            onClick={() => setShowContainment(!showContainment)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              showContainment
                ? 'bg-ice-blue/15 border-ice-blue text-ice-blue'
                : 'bg-titanium-charcoal border-white/10 text-muted-silver/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Containment</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport with Overlay HUD */}
      <div className="relative w-full h-[540px] md:h-[640px] rounded-2xl overflow-hidden border border-white/15 bg-obsidian shadow-2xl">
        <DataCenterCanvas
          sceneConfig={LANDING_SCENE_CONFIG}
          selectedRackId={selectedRack?.id || null}
          onSelectRack={(r) => setSelectedRack(r)}
          showAirflow={showAirflow}
          showCableTrays={showCableTrays}
          showThermalHeatmap={showThermalHeatmap}
          showContainment={showContainment}
          viewMode={viewMode}
        />

        {/* Orbit Interaction Hint Pill */}
        <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 bg-obsidian/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[11px] font-mono text-warm-ivory">
          <Compass className="w-3.5 h-3.5 text-electric-teal animate-spin" />
          <span>DRAG TO ORBIT 360° &bull; SCROLL TO ZOOM &bull; CLICK RACK TO INSPECT</span>
        </div>

        {/* Selected Equipment Telemetry Overlay Card */}
        {selectedRack && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-4 right-4 max-w-xs w-full bg-graphite/90 backdrop-blur-xl p-5 rounded-2xl border border-electric-teal/40 shadow-2xl space-y-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-electric-teal font-bold">{selectedRack.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-controlled-emerald/15 text-controlled-emerald border border-controlled-emerald/30 font-bold">
                OPERATIONAL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-silver block text-[10px]">POWER LOAD</span>
                <span className="text-warm-ivory font-bold">{selectedRack.power_kw} kW</span>
              </div>
              <div>
                <span className="text-muted-silver block text-[10px]">CAPACITY</span>
                <span className="text-warm-ivory font-bold">{selectedRack.servers_count} / 42 U</span>
              </div>
              <div>
                <span className="text-muted-silver block text-[10px]">POSITION (X, Z)</span>
                <span className="text-muted-silver/90">{selectedRack.x.toFixed(1)}m, {selectedRack.z.toFixed(1)}m</span>
              </div>
              <div>
                <span className="text-muted-silver block text-[10px]">THERMAL DELTA</span>
                <span className="text-controlled-emerald font-bold">ΔT +11.8°C</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-muted-silver">
              <span>Ground Truth Sync:</span>
              <span className="text-electric-teal font-bold">100.0% Metric Lock</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Simulator Bottom Action Callout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-graphite/80 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-electric-teal/15 text-electric-teal flex items-center justify-center border border-electric-teal/30">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-warm-ivory font-serif">
              Full Spatial Workspace &amp; 3D Component Editor
            </div>
            <div className="text-xs text-muted-silver font-mono">
              Adjust row spacings, reposition CRAC units, recalculate heatmaps, and edit cable trays in real time.
            </div>
          </div>
        </div>

        <button
          onClick={onExploreStudio}
          className="btn-primary-teal flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold font-mono text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,214,201,0.25)] shrink-0"
        >
          <span>OPEN 3D WORKSPACE</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
