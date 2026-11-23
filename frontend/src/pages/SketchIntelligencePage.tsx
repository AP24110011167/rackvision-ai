import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan, Layers, Box, Cpu, Wind, Zap, Network, DoorOpen,
  CheckCircle2, RefreshCw, Edit3, Trash2, Plus, ArrowRight,
  Info, Maximize2, Sliders, Sparkles, FileText, Crosshair
} from 'lucide-react';
import { api } from '../services/api';
import { Project, SketchData, StructuredLayout, LayoutComponent, SketchIntelligenceResult } from '../types';

interface SketchIntelligencePageProps {
  project: Project | null;
  sketch: SketchData | null;
  onNavigateTab: (tabId: string) => void;
  onRefreshLayout?: () => void;
}

export const SketchIntelligencePage: React.FC<SketchIntelligencePageProps> = ({
  project,
  sketch,
  onNavigateTab,
  onRefreshLayout,
}) => {
  const [intelResult, setIntelResult] = useState<SketchIntelligenceResult | null>(null);
  const [layout, setLayout] = useState<StructuredLayout | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'overlay' | 'original' | 'preprocessed' | 'binary' | 'canny'>('overlay');
  const [selectedComponent, setSelectedComponent] = useState<LayoutComponent | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // New component form state
  const [newCompName, setNewCompName] = useState('Server Rack New');
  const [newCompCategory, setNewCompCategory] = useState<'server_infrastructure' | 'cooling_infrastructure' | 'electrical_infrastructure' | 'network_infrastructure' | 'physical_infrastructure'>('server_infrastructure');
  const [newCompWidth, setNewCompWidth] = useState(0.8);
  const [newCompDepth, setNewCompDepth] = useState(1.0);
  const [newCompHeight, setNewCompHeight] = useState(2.2);

  useEffect(() => {
    if (!project) return;
    loadIntelligence();
  }, [project?.id]);

  const loadIntelligence = async () => {
    if (!project) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const existingLayout = await api.getProjectLayout(project.id).catch(() => null);
      if (existingLayout) {
        setLayout(existingLayout);
        if (existingLayout.components && existingLayout.components.length > 0) {
          setSelectedComponent(existingLayout.components[0]);
        }
      } else {
        const res = await api.reconstructLayout(project.id);
        setIntelResult(res);
        setLayout(res.layout);
        if (res.layout?.components?.length > 0) {
          setSelectedComponent(res.layout.components[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load sketch intelligence:', err);
      setStatusMessage({ type: 'error', text: 'Failed to reconstruct layout: ' + (err.message || 'Unknown error') });
    } finally {
      setLoading(false);
    }
  };

  const handleReRunEngine = async () => {
    if (!project) return;
    setAnalyzing(true);
    setStatusMessage({ type: 'info', text: 'Executing Sketch Intelligence CV & OCR pipeline...' });
    try {
      const res = await api.reconstructLayout(project.id);
      setIntelResult(res);
      setLayout(res.layout);
      if (res.layout?.components?.length > 0) {
        setSelectedComponent(res.layout.components[0]);
      }
      setStatusMessage({
        type: 'success',
        text: `Extracted ${res.layout.components.length} components (${res.layout.equipment_summary.server_racks} racks, ${res.layout.equipment_summary.cooling_units} cooling) with high confidence!`,
      });
      if (onRefreshLayout) onRefreshLayout();
    } catch (err: any) {
      console.error('Analysis error:', err);
      setStatusMessage({ type: 'error', text: 'Engine run failed: ' + err.message });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmExtraction = async () => {
    if (!project || !layout) return;
    setConfirming(true);
    try {
      await api.confirmLayout(project.id, layout);
      setStatusMessage({
        type: 'success',
        text: 'Layout confirmed! 3D scene, BOM, and AI prompts are now fully synchronized.',
      });
      if (onRefreshLayout) onRefreshLayout();
      setTimeout(() => {
        onNavigateTab('generate');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to confirm layout:', err);
      setStatusMessage({ type: 'error', text: 'Confirmation failed: ' + err.message });
    } finally {
      setConfirming(false);
    }
  };

  const handleDeleteComponent = (id: string) => {
    if (!layout) return;
    const updatedComps = layout.components.filter((c) => c.id !== id);
    const rackCount = updatedComps.filter((c) => c.category === 'server_infrastructure').length;
    const coolingCount = updatedComps.filter((c) => c.category === 'cooling_infrastructure').length;
    const electCount = updatedComps.filter((c) => c.category === 'electrical_infrastructure').length;
    const netCount = updatedComps.filter((c) => c.category === 'network_infrastructure').length;
    const doorCount = updatedComps.filter((c) => c.category === 'physical_infrastructure' && c.type.includes('door')).length;

    const updatedLayout: StructuredLayout = {
      ...layout,
      components: updatedComps,
      equipment_summary: {
        server_racks: rackCount,
        cooling_units: coolingCount,
        electrical_units: electCount,
        network_units: netCount,
        doors: doorCount,
      },
    };
    setLayout(updatedLayout);
    if (selectedComponent?.id === id) {
      setSelectedComponent(updatedComps[0] || null);
    }
  };

  const handleAddComponent = () => {
    if (!layout) return;
    const newId = `comp_manual_${Date.now().toString(36)}`;
    const newComp: LayoutComponent = {
      id: newId,
      name: newCompName,
      category: newCompCategory,
      type: newCompCategory === 'server_infrastructure' ? 'server_rack' : (newCompCategory === 'cooling_infrastructure' ? 'crac_unit' : 'equipment'),
      location: { x: layout.room.width_m / 2, y: layout.room.length_m / 2, z: 0 },
      dimensions: { width: newCompWidth, depth: newCompDepth, height: newCompHeight },
      orientation_deg: 0,
      confidence: 1.0,
      source_bbox: [100, 100, 180, 180],
      properties: { u_height: 42, power_kw: newCompCategory === 'server_infrastructure' ? 10.0 : 0 },
    };

    const updatedComps = [...layout.components, newComp];
    const rackCount = updatedComps.filter((c) => c.category === 'server_infrastructure').length;
    const coolingCount = updatedComps.filter((c) => c.category === 'cooling_infrastructure').length;
    const electCount = updatedComps.filter((c) => c.category === 'electrical_infrastructure').length;
    const netCount = updatedComps.filter((c) => c.category === 'network_infrastructure').length;
    const doorCount = updatedComps.filter((c) => c.category === 'physical_infrastructure' && c.type.includes('door')).length;

    setLayout({
      ...layout,
      components: updatedComps,
      equipment_summary: {
        server_racks: rackCount,
        cooling_units: coolingCount,
        electrical_units: electCount,
        network_units: netCount,
        doors: doorCount,
      },
    });
    setSelectedComponent(newComp);
    setShowAddModal(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'server_infrastructure':
        return {
          border: 'border-electric-teal',
          bg: 'bg-electric-teal/10',
          text: 'text-electric-teal',
          badge: 'bg-electric-teal/15 text-electric-teal border border-electric-teal/30',
          hex: '#00D6C9'
        };
      case 'cooling_infrastructure':
        return {
          border: 'border-controlled-emerald',
          bg: 'bg-controlled-emerald/10',
          text: 'text-controlled-emerald',
          badge: 'bg-controlled-emerald/15 text-controlled-emerald border border-controlled-emerald/30',
          hex: '#00B894'
        };
      case 'electrical_infrastructure':
        return {
          border: 'border-champagne-bronze',
          bg: 'bg-champagne-bronze/10',
          text: 'text-champagne-bronze',
          badge: 'bg-champagne-bronze/15 text-champagne-bronze border border-champagne-bronze/30',
          hex: '#C6A477'
        };
      case 'network_infrastructure':
        return {
          border: 'border-ice-blue',
          bg: 'bg-ice-blue/10',
          text: 'text-ice-blue',
          badge: 'bg-ice-blue/15 text-ice-blue border border-ice-blue/30',
          hex: '#76CFFF'
        };
      case 'physical_infrastructure':
      default:
        return {
          border: 'border-muted-silver',
          bg: 'bg-muted-silver/10',
          text: 'text-muted-silver',
          badge: 'bg-white/10 text-muted-silver border border-white/10',
          hex: '#A8B3BC'
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'server_infrastructure': return <Box className="w-4 h-4 text-electric-teal" />;
      case 'cooling_infrastructure': return <Wind className="w-4 h-4 text-controlled-emerald" />;
      case 'electrical_infrastructure': return <Zap className="w-4 h-4 text-champagne-bronze" />;
      case 'network_infrastructure': return <Network className="w-4 h-4 text-ice-blue" />;
      case 'physical_infrastructure':
      default: return <DoorOpen className="w-4 h-4 text-muted-silver" />;
    }
  };

  const originalUrl = intelResult?.original_url || sketch?.original_url || '';
  const preprocessedUrl = intelResult?.preprocessed_url || sketch?.preprocessed_url || '';
  const binaryUrl = intelResult?.binary_url || sketch?.binary_url || preprocessedUrl;
  const cannyUrl = intelResult?.canny_url || sketch?.canny_url || '';
  const overlayUrl = intelResult?.annotated_overlay_url || sketch?.annotated_overlay_url || preprocessedUrl;

  const currentPreviewUrl =
    activePreviewTab === 'overlay' ? overlayUrl :
    activePreviewTab === 'original' ? originalUrl :
    activePreviewTab === 'preprocessed' ? preprocessedUrl :
    activePreviewTab === 'binary' ? binaryUrl : cannyUrl;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-center p-8 font-sans text-warm-ivory">
        <div className="w-14 h-14 border-4 border-white/10 border-t-electric-teal rounded-full animate-spin mb-4 shadow-[0_0_20px_#00D6C9]" />
        <h3 className="font-serif text-2xl font-bold">Executing Sketch Intelligence Engine</h3>
        <p className="text-xs font-mono text-muted-silver max-w-md mt-2">
          Performing adaptive thresholding, OpenCV geometric symbol detection, OCR dimension parsing, and spatial coordinate reconstruction...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 font-sans text-warm-ivory">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-titanium-charcoal border border-white/10 text-electric-teal flex items-center justify-center shadow-[0_0_15px_rgba(0,214,201,0.2)]">
              <Scan className="w-5 h-5 text-electric-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-warm-ivory">
                  Sketch Intelligence & CV Extraction
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-electric-teal/15 text-electric-teal border border-electric-teal/30 font-bold">
                  CV + OCR ENGINE
                </span>
              </div>
              <p className="text-xs text-muted-silver mt-0.5">
                Physical floor plan extraction, symbol recognition, calibrated room boundaries, and verified topology.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReRunEngine}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-titanium-charcoal/80 hover:bg-titanium-charcoal text-warm-ivory border border-white/10 text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer hover:border-electric-teal/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-electric-teal' : ''}`} />
            <span>{analyzing ? 'Analyzing...' : 'Re-run CV Engine'}</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              isEditing ? 'bg-electric-teal text-obsidian font-bold border-electric-teal shadow-[0_0_15px_rgba(0,214,201,0.3)]' : 'bg-titanium-charcoal/80 border-white/10 text-warm-ivory hover:border-white/20'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Done Editing' : 'Edit Layout'}</span>
          </button>

          <button
            onClick={handleConfirmExtraction}
            disabled={confirming}
            className="btn-primary-teal flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs font-mono uppercase tracking-wider shadow-[0_0_20px_rgba(0,214,201,0.25)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{confirming ? 'Syncing...' : 'Confirm & Proceed'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-xl text-xs font-mono border flex items-center justify-between backdrop-blur-md ${
              statusMessage.type === 'success'
                ? 'bg-controlled-emerald/15 border-controlled-emerald/40 text-controlled-emerald'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-electric-teal/15 border-electric-teal/40 text-electric-teal'
            }`}
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="hover:opacity-75 ml-4 font-bold cursor-pointer">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary KPI Strip */}
      {layout && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-graphite/80 border border-white/10 flex flex-col justify-between backdrop-blur-md">
            <span className="text-[10px] font-mono text-muted-silver uppercase font-semibold">Dimensions</span>
            <div className="text-base font-bold text-warm-ivory mt-1 font-serif">
              {layout.room.width_m.toFixed(1)}m × {layout.room.length_m.toFixed(1)}m
            </div>
            <span className="text-[10px] text-electric-teal font-mono mt-0.5">{layout.room.area_sqm.toFixed(1)} m² Floor</span>
          </div>

          <div className="p-4 rounded-xl bg-graphite/80 border border-electric-teal/30 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-electric-teal uppercase font-bold">Server Racks</span>
              <Box className="w-3.5 h-3.5 text-electric-teal" />
            </div>
            <div className="text-2xl font-bold text-electric-teal font-serif mt-1">
              {layout.equipment_summary.server_racks}
            </div>
            <span className="text-[10px] text-muted-silver/80 font-mono mt-0.5">Identified 42U</span>
          </div>

          <div className="p-4 rounded-xl bg-graphite/80 border border-controlled-emerald/30 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-controlled-emerald uppercase font-bold">Cooling Units</span>
              <Wind className="w-3.5 h-3.5 text-controlled-emerald" />
            </div>
            <div className="text-2xl font-bold text-controlled-emerald font-serif mt-1">
              {layout.equipment_summary.cooling_units}
            </div>
            <span className="text-[10px] text-muted-silver/80 font-mono mt-0.5">CRAC / InRow</span>
          </div>

          <div className="p-4 rounded-xl bg-graphite/80 border border-champagne-bronze/30 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-champagne-bronze uppercase font-bold">Power / UPS</span>
              <Zap className="w-3.5 h-3.5 text-champagne-bronze" />
            </div>
            <div className="text-2xl font-bold text-champagne-bronze font-serif mt-1">
              {layout.equipment_summary.electrical_units}
            </div>
            <span className="text-[10px] text-muted-silver/80 font-mono mt-0.5">Distribution Blocks</span>
          </div>

          <div className="p-4 rounded-xl bg-graphite/80 border border-ice-blue/30 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-ice-blue uppercase font-bold">Network Racks</span>
              <Network className="w-3.5 h-3.5 text-ice-blue" />
            </div>
            <div className="text-2xl font-bold text-ice-blue font-serif mt-1">
              {layout.equipment_summary.network_units}
            </div>
            <span className="text-[10px] text-muted-silver/80 font-mono mt-0.5">MMR / Trunks</span>
          </div>

          <div className="p-4 rounded-xl bg-graphite/80 border border-white/10 flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-silver uppercase font-bold">Access Points</span>
              <DoorOpen className="w-3.5 h-3.5 text-muted-silver" />
            </div>
            <div className="text-2xl font-bold text-warm-ivory font-serif mt-1">
              {layout.equipment_summary.doors}
            </div>
            <span className="text-[10px] text-muted-silver/80 font-mono mt-0.5">Perimeter Entry</span>
          </div>
        </div>
      )}

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Map Previews & Annotated Floor Plan (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md shadow-md">
            {/* View Tabs */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
                {[
                  { id: 'overlay', label: 'CV Bounding Overlay' },
                  { id: 'original', label: 'Original' },
                  { id: 'preprocessed', label: 'Preprocessed' },
                  { id: 'binary', label: 'Binary Map' },
                  { id: 'canny', label: 'Canny Edges' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePreviewTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activePreviewTab === tab.id
                        ? 'bg-electric-teal text-obsidian font-bold shadow-[0_0_10px_rgba(0,214,201,0.3)]'
                        : 'text-muted-silver hover:text-warm-ivory hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-controlled-emerald font-bold">
                <span className="w-2 h-2 rounded-full bg-controlled-emerald animate-pulse" />
                <span>{layout?.confidence_overall ? `${Math.round(layout.confidence_overall * 100)}% Confidence` : 'Verified'}</span>
              </div>
            </div>

            {/* Interactive Image Display */}
            <div className="relative mt-4 aspect-video bg-obsidian rounded-xl overflow-hidden border border-white/10 flex items-center justify-center group">
              {currentPreviewUrl ? (
                <img
                  src={currentPreviewUrl}
                  alt="Sketch Process Preview"
                  className="w-full h-full object-contain select-none"
                />
              ) : (
                <div className="text-center p-8 text-muted-silver/60 font-mono text-xs">
                  No sketch preview available. Please upload a sketch first.
                </div>
              )}

              <div className="absolute top-3 left-3 bg-obsidian/90 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 text-[10px] font-mono text-warm-ivory">
                TELEMETRY VIEW: {activePreviewTab.toUpperCase()} &bull; RACKVISION INTELLIGENCE
              </div>

              {/* Corner reticles */}
              <div className="pointer-events-none absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-electric-teal/50" />
              <div className="pointer-events-none absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-electric-teal/50" />
              <div className="pointer-events-none absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-electric-teal/50" />
              <div className="pointer-events-none absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-electric-teal/50" />
            </div>

            {/* Category Color Legend */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-muted-silver text-[10px]">DETECTION CLASSES:</span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-electric-teal shadow-[0_0_6px_#00D6C9]" />
                  <span className="text-warm-ivory text-[11px]">Server Racks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-controlled-emerald shadow-[0_0_6px_#00B894]" />
                  <span className="text-warm-ivory text-[11px]">Cooling (CRAC)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-champagne-bronze shadow-[0_0_6px_#C6A477]" />
                  <span className="text-warm-ivory text-[11px]">Power (UPS)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-ice-blue shadow-[0_0_6px_#76CFFF]" />
                  <span className="text-warm-ivory text-[11px]">Network</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-muted-silver" />
                  <span className="text-warm-ivory text-[11px]">Doors/Walls</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2D Schematic Floor Plan (Architectural SVG Render) */}
          {layout && (
            <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-electric-teal" />
                  <h3 className="text-xs font-bold text-warm-ivory tracking-wide font-mono uppercase">
                    2D Reconstructed CAD Floor Schematic
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-muted-silver">
                  Scale: {layout.calibration?.pixels_per_meter ? `${Math.round(layout.calibration.pixels_per_meter)} px/m` : 'Calibrated'}
                </span>
              </div>

              {/* 2D Top-down Schematic Box */}
              <div className="relative w-full h-80 bg-obsidian rounded-xl border border-white/10 p-4 overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid meet">
                  {/* Subtle Grid Pattern */}
                  <defs>
                    <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="600" height="360" fill="url(#cadGrid)" />

                  {/* Outer Room Boundaries */}
                  <rect
                    x="40"
                    y="30"
                    width="520"
                    height="290"
                    fill="rgba(17, 24, 32, 0.85)"
                    stroke="rgba(0, 214, 201, 0.4)"
                    strokeWidth="1.5"
                    rx="4"
                  />

                  {/* Room Dimension Labels */}
                  <text x="300" y="22" fill="#00D6C9" fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                    WIDTH: {layout.room.width_m.toFixed(1)} METERS
                  </text>
                  <text x="25" y="175" fill="#00D6C9" fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold" transform="rotate(-90 25, 175)">
                    LENGTH: {layout.room.length_m.toFixed(1)} METERS
                  </text>
                  <text x="300" y="340" fill="#A8B3BC" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    TOTAL AREA: {layout.room.area_sqm.toFixed(1)} m² &bull; RECONSTRUCTED COORDINATE SPACE
                  </text>

                  {/* Render Aisles */}
                  {layout.aisles.map((aisle, idx) => (
                    <g key={idx}>
                      <rect
                        x="230"
                        y="60"
                        width="140"
                        height="230"
                        fill="#00D6C9"
                        fillOpacity="0.06"
                        stroke="#00D6C9"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text x="300" y="180" fill="#00D6C9" fontSize="10" textAnchor="middle" fontFamily="monospace" opacity="0.8">
                        {aisle.type.toUpperCase()} ({aisle.width_m.toFixed(1)}m)
                      </text>
                    </g>
                  ))}

                  {/* Render Components in 2D Space */}
                  {layout.components.map((comp) => {
                    const isSelected = selectedComponent?.id === comp.id;
                    const scaleX = 460 / layout.room.width_m;
                    const scaleY = 240 / layout.room.length_m;
                    const svgX = 60 + comp.location.x * scaleX;
                    const svgY = 50 + comp.location.y * scaleY;
                    const svgW = Math.max(22, comp.dimensions.width * scaleX);
                    const svgH = Math.max(16, comp.dimensions.depth * scaleY);

                    let fillColor = '#00D6C9';
                    let strokeColor = '#00D6C9';
                    if (comp.category === 'cooling_infrastructure') {
                      fillColor = '#00B894';
                      strokeColor = '#00B894';
                    } else if (comp.category === 'electrical_infrastructure') {
                      fillColor = '#C6A477';
                      strokeColor = '#C6A477';
                    } else if (comp.category === 'network_infrastructure') {
                      fillColor = '#76CFFF';
                      strokeColor = '#76CFFF';
                    } else if (comp.category === 'physical_infrastructure') {
                      fillColor = '#A8B3BC';
                      strokeColor = '#A8B3BC';
                    }

                    return (
                      <g
                        key={comp.id}
                        onClick={() => setSelectedComponent(comp)}
                        className="cursor-pointer transition-transform hover:opacity-90"
                      >
                        <rect
                          x={svgX - svgW / 2}
                          y={svgY - svgH / 2}
                          width={svgW}
                          height={svgH}
                          fill={fillColor}
                          fillOpacity={isSelected ? 0.9 : 0.45}
                          stroke={isSelected ? '#F3F1E9' : strokeColor}
                          strokeWidth={isSelected ? 2 : 1}
                          rx="2"
                        />
                        <text
                          x={svgX}
                          y={svgY + 3}
                          fill="#080B0F"
                          fontSize="7"
                          textAnchor="middle"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {comp.name.replace('Server Rack ', 'R-').substring(0, 7)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Component Details & Component Inventory Table (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Component Inspector Card */}
          {selectedComponent && (
            <div className={`p-5 rounded-2xl border bg-graphite/80 backdrop-blur-md shadow-md ${getCategoryColor(selectedComponent.category).border}`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  {getCategoryIcon(selectedComponent.category)}
                  <div>
                    <h3 className="font-serif text-lg font-bold text-warm-ivory">{selectedComponent.name}</h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${getCategoryColor(selectedComponent.category).badge}`}>
                      {selectedComponent.category.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-muted-silver block">CONFIDENCE</span>
                  <span className="text-sm font-bold text-controlled-emerald font-mono">
                    {Math.round(selectedComponent.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Component Specifications */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-titanium-charcoal/80 border border-white/5">
                  <span className="text-muted-silver block text-[10px]">COORDINATES (X, Y)</span>
                  <span className="text-warm-ivory font-bold">{selectedComponent.location.x.toFixed(2)}m, {selectedComponent.location.y.toFixed(2)}m</span>
                </div>
                <div className="p-3 rounded-xl bg-titanium-charcoal/80 border border-white/5">
                  <span className="text-muted-silver block text-[10px]">DIMENSIONS (W × D × H)</span>
                  <span className="text-warm-ivory font-bold">
                    {selectedComponent.dimensions.width.toFixed(2)} × {selectedComponent.dimensions.depth.toFixed(2)} × {selectedComponent.dimensions.height.toFixed(2)}m
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-titanium-charcoal/80 border border-white/5">
                  <span className="text-muted-silver block text-[10px]">BOUNDING BOX (PIXELS)</span>
                  <span className="text-electric-teal font-mono text-[11px]">
                    [{selectedComponent.source_bbox.join(', ')}]
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-titanium-charcoal/80 border border-white/5">
                  <span className="text-muted-silver block text-[10px]">POWER / RATING</span>
                  <span className="text-controlled-emerald font-bold">
                    {selectedComponent.properties?.power_kw ? `${selectedComponent.properties.power_kw} kW` : (selectedComponent.properties?.capacity_kw ? `${selectedComponent.properties.capacity_kw} kW Cooling` : 'N/A')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {isEditing && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => handleDeleteComponent(selectedComponent.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-mono transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove False Positive</span>
                  </button>
                  <span className="text-[10px] text-muted-silver/60 font-mono">ID: {selectedComponent.id}</span>
                </div>
              )}
            </div>
          )}

          {/* Component Inventory Table */}
          <div className="p-5 rounded-2xl border border-white/10 bg-graphite/80 backdrop-blur-md shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-electric-teal" />
                <h3 className="text-xs font-bold text-warm-ivory tracking-wide font-mono uppercase">
                  Detected Components ({layout?.components.length || 0})
                </h3>
              </div>

              {isEditing && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-electric-teal hover:bg-electric-teal/90 text-obsidian font-bold text-xs font-mono transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Object</span>
                </button>
              )}
            </div>

            {/* Scrollable Table */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {layout?.components.map((comp) => {
                const isSelected = selectedComponent?.id === comp.id;
                const colors = getCategoryColor(comp.category);

                return (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedComponent(comp)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? `bg-titanium-charcoal/90 ${colors.border} shadow-[0_0_12px_rgba(0,214,201,0.15)]`
                        : 'bg-titanium-charcoal/40 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(comp.category)}
                      <div>
                        <div className="text-xs font-bold text-warm-ivory font-mono">{comp.name}</div>
                        <div className="text-[10px] text-muted-silver font-mono">
                          {comp.dimensions.width.toFixed(1)}m × {comp.dimensions.depth.toFixed(1)}m &bull; ({comp.location.x.toFixed(1)}m, {comp.location.y.toFixed(1)}m)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-controlled-emerald font-bold">
                        {Math.round(comp.confidence * 100)}%
                      </span>
                      {isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComponent(comp.id);
                          }}
                          className="p-1 rounded text-muted-silver hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Component Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-graphite border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-warm-ivory flex items-center gap-2">
              <Plus className="w-5 h-5 text-electric-teal" />
              <span>Add Missing Architectural Object</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-silver font-mono block mb-1">Component Name</label>
                <input
                  type="text"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  className="w-full bg-titanium-charcoal border border-white/10 rounded-lg p-2.5 text-warm-ivory focus:outline-none focus:border-electric-teal"
                />
              </div>

              <div>
                <label className="text-muted-silver font-mono block mb-1">Category</label>
                <select
                  value={newCompCategory}
                  onChange={(e: any) => setNewCompCategory(e.target.value)}
                  className="w-full bg-titanium-charcoal border border-white/10 rounded-lg p-2.5 text-warm-ivory focus:outline-none focus:border-electric-teal cursor-pointer"
                >
                  <option value="server_infrastructure">Server Rack / Infrastructure</option>
                  <option value="cooling_infrastructure">Cooling (CRAC / UKG / A/C)</option>
                  <option value="electrical_infrastructure">Electrical / USV (UPS)</option>
                  <option value="network_infrastructure">Network / Patch Rack</option>
                  <option value="physical_infrastructure">Door / Wall Partition</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-muted-silver font-mono block mb-1">Width (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCompWidth}
                    onChange={(e) => setNewCompWidth(parseFloat(e.target.value) || 0.8)}
                    className="w-full bg-titanium-charcoal border border-white/10 rounded-lg p-2.5 text-warm-ivory"
                  />
                </div>
                <div>
                  <label className="text-muted-silver font-mono block mb-1">Depth (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCompDepth}
                    onChange={(e) => setNewCompDepth(parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-titanium-charcoal border border-white/10 rounded-lg p-2.5 text-warm-ivory"
                  />
                </div>
                <div>
                  <label className="text-muted-silver font-mono block mb-1">Height (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCompHeight}
                    onChange={(e) => setNewCompHeight(parseFloat(e.target.value) || 2.2)}
                    className="w-full bg-titanium-charcoal border border-white/10 rounded-lg p-2.5 text-warm-ivory"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-white/10 text-muted-silver text-xs font-mono hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComponent}
                className="px-4 py-2 rounded-lg bg-electric-teal hover:bg-electric-teal/90 text-obsidian font-bold text-xs font-mono uppercase tracking-wider cursor-pointer shadow-[0_0_12px_rgba(0,214,201,0.3)]"
              >
                Add Component
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
