import React, { useState } from 'react';
import { Scene3DConfig, RackComponent } from '../types';
import { DataCenterCanvas } from '../components/simulator/DataCenterCanvas';
import {
  Box, Eye, Wind, Layers, Thermometer, Shield,
  Save, RotateCcw, Plus, Trash2, Info, Server, Check
} from 'lucide-react';
import { ComponentInfoPanel } from '../components/simulator/ComponentInfoPanel';

interface SimulatorPageProps {
  sceneConfig: Scene3DConfig;
  onUpdateScene: (updated: Scene3DConfig) => Promise<void>;
  onResetScene: () => Promise<void>;
  onNavigateToConstruction?: () => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  sceneConfig,
  onUpdateScene,
  onResetScene,
  onNavigateToConstruction,
}) => {
  const [selectedRack, setSelectedRack] = useState<RackComponent | null>(null);
  const [inspectedComponentId, setInspectedComponentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'perspective' | 'top' | 'front' | 'side'>('perspective');

  // Simulation Layer Toggles
  const [showAirflow, setShowAirflow] = useState(true);
  const [showCableTrays, setShowCableTrays] = useState(true);
  const [showContainment, setShowContainment] = useState(true);
  const [showThermalHeatmap, setShowThermalHeatmap] = useState(false);

  // Layout Editing States
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [roomWidth, setRoomWidth] = useState(sceneConfig.room_dims.width);
  const [roomLength, setRoomLength] = useState(sceneConfig.room_dims.length);
  const [roomHeight, setRoomHeight] = useState(sceneConfig.room_dims.height);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddRack = () => {
    const newRackId = `rack-${sceneConfig.racks.length + 1}`;
    const newRack: RackComponent = {
      id: newRackId,
      name: `Rack Row-A-${sceneConfig.racks.length + 1}`,
      row: 'Row-A',
      x: (Math.random() - 0.5) * 10,
      y: 1.1,
      z: -3.0,
      width: 0.8,
      height: 2.2,
      depth: 1.0,
      type: 'AI Compute High-Density',
      power_kw: 14.0,
      status: 'Online',
      servers_count: 20,
    };

    const updated = {
      ...sceneConfig,
      racks: [...sceneConfig.racks, newRack],
    };
    onUpdateScene(updated);
  };

  const handleRemoveSelectedRack = () => {
    if (!selectedRack) return;
    const updated = {
      ...sceneConfig,
      racks: sceneConfig.racks.filter((r) => r.id !== selectedRack.id),
    };
    setSelectedRack(null);
    onUpdateScene(updated);
  };

  const handleSaveScene = async () => {
    setIsSaving(true);
    try {
      const updated: Scene3DConfig = {
        ...sceneConfig,
        room_dims: { width: roomWidth, length: roomLength, height: roomHeight },
      };
      await onUpdateScene(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans-ui text-[#F4F7F8]">
      {/* Top Header & Simulation Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#C9D3DB]/12">
        <div>
          <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#00E5CC] font-semibold">
            Spatial Computational Simulation &bull; Project Nexus
          </span>
          <h1 className="font-editorial text-3xl md:text-4xl font-bold tracking-tight text-[#F4F7F8] mt-1">
            Interactive 3D Digital Twin Simulator
          </h1>
          <p className="text-xs text-[#C9D3DB]/70 mt-1 font-light">
            Real-time WebGL physics, laminar airflow vectors, containment structure, and component telemetry.
          </p>
        </div>

        {/* View Mode & Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Camera View Selector */}
          <div className="flex items-center rounded-lg bg-[#101720] border border-[#C9D3DB]/15 p-1 text-xs font-mono-code shadow-xs">
            {[
              { id: 'perspective', label: 'Perspective 3D' },
              { id: 'top', label: 'Plan View' },
              { id: 'front', label: 'Front' },
              { id: 'side', label: 'Aisle' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id as any)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  viewMode === v.id
                    ? 'bg-[#00E5CC] text-[#07090D] font-bold shadow-xs'
                    : 'text-[#C9D3DB]/60 hover:text-[#F4F7F8]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Edit Dimensions Toggle */}
          <button
            onClick={() => setIsEditingLayout(!isEditingLayout)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-mono-code transition-colors cursor-pointer ${
              isEditingLayout
                ? 'bg-[#00E5CC]/20 text-[#00E5CC] border-[#00E5CC]/40 font-bold'
                : 'bg-[#101720] border-[#C9D3DB]/20 text-[#C9D3DB] hover:text-[#F4F7F8]'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-[#00E5CC]" />
            <span>Layout Editor</span>
          </button>

          {/* Reset Scene */}
          <button
            onClick={onResetScene}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#101720] hover:bg-[#111E2A] border border-[#C9D3DB]/20 text-[#C9D3DB] hover:text-[#F4F7F8] text-xs font-mono-code cursor-pointer transition-colors"
            title="Reset to Standard Dual-Row Layout"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#62DDF5]" />
            <span>Reset</span>
          </button>

          {/* Save Scene */}
          <button
            onClick={handleSaveScene}
            disabled={isSaving}
            className="btn-nexus-teal flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs font-mono-code tracking-wider uppercase transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>SAVED!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'SAVING...' : 'SAVE SCENE'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Layout Editor Drawer */}
      {isEditingLayout && (
        <div className="nexus-panel p-5 rounded-2xl border border-[#C9D3DB]/15 bg-[#101720] space-y-4 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#C9D3DB]/10 pb-3">
            <h3 className="font-editorial text-lg font-bold text-[#F4F7F8] flex items-center gap-2">
              <Box className="w-4 h-4 text-[#00E5CC]" />
              Physical Room Geometry & Rack Inventory Controls
            </h3>
            <span className="text-[11px] font-mono-code text-[#00E5CC]">
              User-Defined Dimensions (ASHRAE Standards Compliant)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs font-mono-code">
            <div>
              <label className="block text-[#C9D3DB]/60 mb-1">Room Width (Meters)</label>
              <input
                type="number"
                min="10"
                max="40"
                step="1"
                value={roomWidth}
                onChange={(e) => setRoomWidth(Number(e.target.value))}
                className="w-full bg-[#07090D] border border-[#C9D3DB]/20 rounded-lg px-3 py-1.5 text-[#F4F7F8] focus:outline-none focus:border-[#00E5CC]"
              />
            </div>

            <div>
              <label className="block text-[#C9D3DB]/60 mb-1">Room Length (Meters)</label>
              <input
                type="number"
                min="12"
                max="60"
                step="1"
                value={roomLength}
                onChange={(e) => setRoomLength(Number(e.target.value))}
                className="w-full bg-[#07090D] border border-[#C9D3DB]/20 rounded-lg px-3 py-1.5 text-[#F4F7F8] focus:outline-none focus:border-[#00E5CC]"
              />
            </div>

            <div>
              <label className="block text-[#C9D3DB]/60 mb-1">Clear Height (Meters)</label>
              <input
                type="number"
                min="3.0"
                max="8.0"
                step="0.5"
                value={roomHeight}
                onChange={(e) => setRoomHeight(Number(e.target.value))}
                className="w-full bg-[#07090D] border border-[#C9D3DB]/20 rounded-lg px-3 py-1.5 text-[#F4F7F8] focus:outline-none focus:border-[#00E5CC]"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddRack}
                className="w-full py-2 rounded-lg bg-[#111E2A] hover:bg-[#182635] border border-[#00E5CC]/30 text-[#00E5CC] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#00E5CC]" />
                <span>Add Server Rack</span>
              </button>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRemoveSelectedRack}
                disabled={!selectedRack}
                className="w-full py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/30 text-red-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 3D Simulation Viewport with Overlay Controls */}
      <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-[#C9D3DB]/15 shadow-2xl bg-[#07090D]">
        {/* Layer Visibility Toggles (Top-Left Pill Bar) */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAirflow(!showAirflow)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-code backdrop-blur-md border transition-all cursor-pointer ${
              showAirflow
                ? 'bg-[#101720]/90 border-[#00E5CC] text-[#00E5CC] font-bold shadow-[0_0_15px_rgba(0,229,204,0.2)]'
                : 'bg-[#101720]/60 border-[#C9D3DB]/20 text-[#C9D3DB]/60'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Airflow Particles ({showAirflow ? 'ON' : 'OFF'})</span>
          </button>

          <button
            onClick={() => setShowContainment(!showContainment)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-code backdrop-blur-md border transition-all cursor-pointer ${
              showContainment
                ? 'bg-[#101720]/90 border-[#00B894] text-[#00B894] font-bold shadow-[0_0_15px_rgba(0,184,148,0.2)]'
                : 'bg-[#101720]/60 border-[#C9D3DB]/20 text-[#C9D3DB]/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Containment Canopy</span>
          </button>

          <button
            onClick={() => setShowCableTrays(!showCableTrays)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-code backdrop-blur-md border transition-all cursor-pointer ${
              showCableTrays
                ? 'bg-[#101720]/90 border-[#62DDF5] text-[#62DDF5] font-bold shadow-[0_0_15px_rgba(98,221,245,0.2)]'
                : 'bg-[#101720]/60 border-[#C9D3DB]/20 text-[#C9D3DB]/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cable Trays</span>
          </button>

          <button
            onClick={() => setShowThermalHeatmap(!showThermalHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-code backdrop-blur-md border transition-all cursor-pointer ${
              showThermalHeatmap
                ? 'bg-[#101720]/90 border-red-400 text-red-400 font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                : 'bg-[#101720]/60 border-[#C9D3DB]/20 text-[#C9D3DB]/60'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Thermal Heatmap</span>
          </button>
        </div>

        {/* Selected Component Telemetry Drawer (Right Overlay) */}
        {selectedRack && (
          <div className="absolute top-4 right-4 z-20 w-80 nexus-glass p-5 rounded-2xl border border-[#00E5CC]/30 space-y-4 shadow-2xl animate-in slide-in-from-right duration-200 text-[#F4F7F8]">
            <div className="flex items-center justify-between border-b border-[#C9D3DB]/15 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#00E5CC]" />
                <span className="font-editorial text-base font-bold">{selectedRack.name}</span>
              </div>
              <button
                onClick={() => setSelectedRack(null)}
                className="text-[#C9D3DB]/60 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono-code">
              <div className="flex justify-between">
                <span className="text-[#C9D3DB]/60">Assigned Row:</span>
                <span className="text-[#F4F7F8] font-bold">{selectedRack.row}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9D3DB]/60">Chassis Dimensions:</span>
                <span className="text-[#F4F7F8]">42U (800x1200mm)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9D3DB]/60">Active IT Power Draw:</span>
                <span className="text-[#00E5CC] font-bold">{selectedRack.power_kw} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9D3DB]/60">Thermal Heat Dissipation:</span>
                <span className="text-[#00B894] font-bold">
                  {(selectedRack.power_kw * 3412.14).toLocaleString(undefined, { maximumFractionDigits: 0 })} BTU/hr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9D3DB]/60">Blade Density:</span>
                <span className="text-[#F4F7F8]">{selectedRack.servers_count} Nodes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9D3DB]/60">PDU Feed Path:</span>
                <span className="text-[#62DDF5] font-bold">Dual A+B Redundant</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#C9D3DB]/12 flex flex-col gap-2">
              <button
                onClick={() => setInspectedComponentId(selectedRack.id)}
                className="w-full py-1.5 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#00E5CC] border border-[#00E5CC]/30 text-xs font-mono-code flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-[#00E5CC]" />
                <span>View Component Specs</span>
              </button>
              <button
                onClick={handleRemoveSelectedRack}
                className="w-full py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-mono-code flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Rack</span>
              </button>
            </div>
          </div>
        )}

        {/* 3D Canvas */}
        <DataCenterCanvas
          sceneConfig={{
            ...sceneConfig,
            room_dims: { width: roomWidth, length: roomLength, height: roomHeight },
          }}
          selectedRackId={selectedRack?.id || null}
          onSelectRack={(r) => setSelectedRack(r)}
          onSelectComponent={(id) => {
            if (id) {
              setInspectedComponentId(id);
            }
          }}
          showAirflow={showAirflow}
          showCableTrays={showCableTrays}
          showThermalHeatmap={showThermalHeatmap}
          showContainment={showContainment}
          viewMode={viewMode}
        />

        {/* Component Info Slide-In Panel */}
        <ComponentInfoPanel
          componentId={inspectedComponentId}
          projectId={sceneConfig.project_id || 'proj-helios-01'}
          onClose={() => setInspectedComponentId(null)}
          onViewConstructionGuide={() => {
            setInspectedComponentId(null);
            if (onNavigateToConstruction) onNavigateToConstruction();
          }}
        />

        {/* Bottom Legend */}
        <div className="absolute bottom-4 left-4 z-20 px-4 py-2 bg-[#07090D]/90 backdrop-blur-md rounded-lg border border-[#C9D3DB]/15 text-xs font-mono-code text-[#C9D3DB] flex items-center gap-4 shadow-lg pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E5CC]" />
            <span>Cold Aisle Ingress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5533]" />
            <span>Hot Exhaust Corridor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#62DDF5]" />
            <span>Cable Pathways</span>
          </div>
        </div>
      </div>
    </div>
  );
};
