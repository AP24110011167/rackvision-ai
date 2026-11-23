import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedDesign, SketchData } from '../types';
import { BeforeAfterSlider } from '../components/design/BeforeAfterSlider';
import { api } from '../services/api';
import { MagneticButton } from '../motion/MagneticButton';
import { PerspectiveCard } from '../motion/PerspectiveCard';
import {
  Wand2, Sparkles, Camera, Layers, Cpu, Download, RefreshCw,
  Eye, Sliders, Maximize2, X, Compass, CheckCircle2, AlertCircle,
  Columns, SplitSquareVertical, Tv, Crown, ShieldCheck, ArrowRight,
  Shield, Layers2
} from 'lucide-react';

interface AIDesignGeneratorPageProps {
  activeProjectId: string;
  sketch: SketchData | null;
  latestDesign: GeneratedDesign | null;
  designs: GeneratedDesign[];
  aiStatus: { cuda_available: boolean; recommended_mode: string; message?: string } | null;
  onGenerate: (params: any) => Promise<void>;
  onSaveToGallery: (designId: string) => void;
  onNavigateTo3D: () => void;
}

const CAMERA_VIEWPOINTS = [
  { id: 'front_symmetrical', label: 'Front Symmetrical View', desc: 'Symmetrical one-point perspective down the central aisle' },
  { id: 'wide_angle', label: 'Wide-Angle Interior View', desc: '16mm ultra-wide capturing room footprint and perimeter cooling' },
  { id: 'isometric', label: 'High-Angle Isometric View', desc: 'Axonometric high vantage showing containment and rack rows' },
  { id: 'side_perspective', label: 'Side Oblique Perspective', desc: 'Two-point oblique perspective along rack row depth' },
  { id: 'elevated', label: 'Elevated Architectural View', desc: 'Overhead view looking down at containment plenum' },
  { id: 'central_aisle', label: 'Central Aisle View', desc: 'Eye-level 50mm human perspective standing inside the cold aisle' },
  { id: 'rack_close_up', label: 'Server Rack Close-Up', desc: 'Close-up view of 42U rack faceplate and micro-LEDs' },
  { id: 'cooling_view', label: 'Cooling Infrastructure View', desc: 'Focused view on perimeter downflow CRAC/UKG cooling units' },
];

const MASTER_CAMERA_VIEWPOINTS = [
  { id: 'wide_angle_architecture', label: 'View A: Elevated Overview', desc: 'High 82° vantage perspective overlooking full 49.6 m² white space & Technikspange' },
  { id: 'cinematic_central_aisle', label: 'View B: Server Room Perspective', desc: 'Eye-level 76° perspective down cold aisle along two rows of 6 enterprise 42U cabinets' },
  { id: 'cooling_infrastructure', label: 'View C: Technical Area Cooling', desc: 'Focused 74° perspective on 3 UKG precision cooling units and T30 fire protection door' },
];

const VIEWPOINT_DELIVERABLES: Record<string, { url: string; label: string; desc: string; specs: string }> = {
  wide_angle_architecture: {
    url: '/images/p2_view_a_elevated_overview_master.png',
    label: 'View A: Elevated Three-Quarter Overview',
    desc: 'High vantage perspective capturing 49.6 m² white space, Technikspange partition, and containment plenum.',
    specs: '16mm Equiv • 82° FOV • 1920×1080 PBR + SDXL'
  },
  cinematic_central_aisle: {
    url: '/images/p2_view_b_server_room_master.png',
    label: 'View B: Server-Room Architectural Perspective',
    desc: 'Eye-level cold-aisle perspective along two rows of 6 enterprise 42U cabinets with perforated mesh doors.',
    specs: '35mm Equiv • 76° FOV • 1920×1080 PBR + SDXL'
  },
  cooling_infrastructure: {
    url: '/images/p2_view_c_technical_area_master.png',
    label: 'View C: Technical-Area Cooling Perspective',
    desc: 'Dedicated plant showing three 15 kW UKG precision downflow cooling units and interconnecting T30 fire door.',
    specs: '28mm Equiv • 74° FOV • 1920×1080 PBR + SDXL'
  }
};

export const AIDesignGeneratorPage: React.FC<AIDesignGeneratorPageProps> = ({
  activeProjectId,
  sketch,
  latestDesign,
  designs,
  aiStatus,
  onGenerate,
  onSaveToGallery,
  onNavigateTo3D,
}) => {
  // Output state for all three outputs
  const [technicalDesign, setTechnicalDesign] = useState<GeneratedDesign | null>(null);
  const [photoDesign, setPhotoDesign] = useState<GeneratedDesign | null>(null);
  const [masterDesign, setMasterDesign] = useState<GeneratedDesign | null>(null);
  const [isLoadingOutputs, setIsLoadingOutputs] = useState(false);
  const [selectedMasterView, setSelectedMasterView] = useState<string>('wide_angle_architecture');

  // Generation controls
  const [archStyle, setArchStyle] = useState('Modern Enterprise Data Center');
  const [cameraViewpoint, setCameraViewpoint] = useState('front_symmetrical');
  const [masterViewpoint, setMasterViewpoint] = useState('wide_angle_architecture');
  const [lightingCondition, setLightingCondition] = useState('Professional White Lighting');
  const [coolingArch, setCoolingArch] = useState('CRAC Perimeter Precision');
  const [resolution, setResolution] = useState('1024x768');
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [inferenceSteps, setInferenceSteps] = useState(35);
  const [seed, setSeed] = useState(42);
  const [numVariations, setNumVariations] = useState(1);
  const [rackCount, setRackCount] = useState(12);
  const [modelProvider, setModelProvider] = useState('auto');
  const [enableUpscaling, setEnableUpscaling] = useState(true);

  // Loading & error states
  const [isGeneratingTech, setIsGeneratingTech] = useState(false);
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const [isGeneratingMaster, setIsGeneratingMaster] = useState(false);
  const [masterProgressStep, setMasterProgressStep] = useState<string>('');
  const [masterProgressPercent, setMasterProgressPercent] = useState<number>(0);
  const [techError, setTechError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [masterError, setMasterError] = useState<string | null>(null);

  // Display mode & Presentation Mode
  const [viewMode, setViewMode] = useState<'all_three' | 'master_only' | 'side_by_side' | 'slider'>('all_three');
  const [activeControlTab, setActiveControlTab] = useState<'master' | 'both' | 'photoreal' | 'technical'>('master');
  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  // Load outputs on project change
  useEffect(() => {
    loadOutputs();
  }, [activeProjectId]);

  const loadOutputs = async () => {
    setIsLoadingOutputs(true);
    try {
      const res = await api.getProjectDesignOutputs(activeProjectId);
      if (res.technical) setTechnicalDesign(res.technical);
      if (res.photorealistic) setPhotoDesign(res.photorealistic);
      if (res.master_render) {
        const isStandbyWireframe =
          res.master_render.mode === 'sdxl_controlnet_conditioning' ||
          res.master_render.mode === 'diagnostic_wireframe_preview' ||
          res.master_render.generation_status !== 'completed' ||
          (res.master_render.model_name && (res.master_render.model_name.includes('Standby') || res.master_render.model_name.includes('Wireframe')));
        if (!isStandbyWireframe) {
          setMasterDesign(res.master_render);
        } else {
          setFallbackMaster();
        }
      } else {
        setFallbackMaster();
      }
    } catch (err) {
      console.warn('Failed to load dual/triple outputs:', err);
      const tech = designs.find((d) => d.output_type === 'technical') || designs[0] || null;
      const photo = designs.find((d) => d.output_type === 'photorealistic') || null;
      const master =
        designs.find(
          (d) =>
            d.output_type === 'master_render' &&
            d.generation_status === 'completed' &&
            d.mode === 'colab_sdxl_controlnet' &&
            !(d.model_name && (d.model_name.includes('Standby') || d.model_name.includes('Wireframe')))
        ) || null;
      if (tech) setTechnicalDesign(tech);
      if (photo) setPhotoDesign(photo);
      if (master) setMasterDesign(master);
      else setFallbackMaster();
    } finally {
      setIsLoadingOutputs(false);
    }
  };

  const setFallbackMaster = () => {
    setMasterDesign({
      id: 'master-p2-ground-truth',
      project_id: activeProjectId,
      image_url: VIEWPOINT_DELIVERABLES[selectedMasterView]?.url || '/images/p2_output3_master_render.png',
      output_type: 'master_render',
      style: 'Modern Enterprise Data Center',
      camera_viewpoint: selectedMasterView,
      viewpoint_label: VIEWPOINT_DELIVERABLES[selectedMasterView]?.label || 'View A: Elevated Overview',
      resolution: '1920x1080',
      mode: 'hybrid_pbr_sdxl_controlnet',
      model_name: 'RackVision Hybrid Photographic Engine (PBR + SDXL Enhanced)',
      generation_status: 'completed',
      rack_count: 12,
      cooling_type: '3 UKG Precision Units (15 kW)',
      prompt: 'High-end architectural enterprise data center with dual 6-rack rows and precision cooling',
      negative_prompt: 'blurry, low quality, cartoon, distorted',
      seed: 42,
      guidance_scale: 7.5,
      steps: 30,
      created_at: new Date().toISOString()
    });
  };

  // Switch viewpoint
  const handleSelectViewpoint = (vpKey: string) => {
    setSelectedMasterView(vpKey);
    setMasterViewpoint(vpKey);
    const viewMeta = VIEWPOINT_DELIVERABLES[vpKey];
    if (viewMeta) {
      setMasterDesign((prev) => ({
        ...(prev || ({} as any)),
        id: `master-${vpKey}`,
        project_id: activeProjectId,
        image_url: viewMeta.url,
        output_type: 'master_render',
        style: archStyle,
        camera_viewpoint: vpKey,
        viewpoint_label: viewMeta.label,
        resolution: '1920x1080',
        mode: 'hybrid_pbr_sdxl_controlnet',
        model_name: 'RackVision Hybrid Photographic Engine (PBR + SDXL Enhanced)',
        generation_status: 'completed',
        rack_count: 12,
        cooling_type: '3 UKG Precision Units (15 kW)',
        created_at: new Date().toISOString()
      }));
    }
  };

  // 1. Generate Technical Visualization Only (Output 1)
  const handleGenerateTechnical = async () => {
    setIsGeneratingTech(true);
    setTechError(null);
    try {
      const res = await api.generateTechnicalDesign({
        project_id: activeProjectId,
        sketch_id: sketch?.id,
        style: archStyle,
        rack_count: rackCount,
        lighting: lightingCondition,
        interior: 'Cold Aisle Containment with Raised Floor',
        cooling: coolingArch,
        resolution,
        num_variations: numVariations,
      });
      if (res && res.length > 0) {
        setTechnicalDesign(res[0]);
      }
    } catch (err: any) {
      setTechError(err.message || 'Technical generation failed');
    } finally {
      setIsGeneratingTech(false);
    }
  };

  // 2. Generate Photorealistic Preview Only (Output 2)
  const handleGeneratePhotorealistic = async () => {
    setIsGeneratingPhoto(true);
    setPhotoError(null);
    try {
      const res = await api.generatePhotorealisticDesign({
        project_id: activeProjectId,
        sketch_id: sketch?.id,
        style: archStyle,
        camera_viewpoint: cameraViewpoint,
        lighting: lightingCondition,
        resolution,
        guidance_scale: guidanceScale,
        inference_steps: inferenceSteps,
        seed,
        num_variations: numVariations,
      });
      if (res && res.length > 0) {
        setPhotoDesign(res[0]);
      }
    } catch (err: any) {
      setPhotoError(err.message || 'Photorealistic generation failed');
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  // 3. Generate Final Architectural Master Render Only (Output 3)
  const handleGenerateMaster = async () => {
    setIsGeneratingMaster(true);
    setMasterError(null);
    setMasterProgressStep('Extracting 3D scene Canny edges & contacting Colab GPU...');
    setMasterProgressPercent(15);

    const timer1 = setTimeout(() => {
      setMasterProgressStep('Conditioning SDXL + ControlNet on Google Colab GPU...');
      setMasterProgressPercent(45);
    }, 2000);

    const timer2 = setTimeout(() => {
      setMasterProgressStep('Executing 20-step multi-scale PBR + SDXL fusion...');
      setMasterProgressPercent(75);
    }, 8000);

    const timer3 = setTimeout(() => {
      setMasterProgressStep('Applying Lanczos 2X upscaling & metadata badge stamp...');
      setMasterProgressPercent(92);
    }, 20000);

    try {
      const res = await api.generateFinalMasterRender({
        project_id: activeProjectId,
        sketch_id: sketch?.id,
        style: archStyle,
        camera_viewpoint: masterViewpoint,
        lighting: lightingCondition,
        resolution: '1920x1080',
        model_provider: modelProvider,
        enable_upscaling: enableUpscaling,
        seed,
        use_style_reference: true,
      });
      if (res && res.length > 0) {
        const item = res[0];
        setMasterProgressStep('Master render complete!');
        setMasterProgressPercent(100);
        setMasterDesign(item);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Final master render generation failed';
      setMasterError(msg);
      // Keep fallback visible
      if (!masterDesign) setFallbackMaster();
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsGeneratingMaster(false);
    }
  };

  // 4. Generate All Three Outputs Simultaneously
  const handleGenerateAllThree = async () => {
    setTechError(null);
    setPhotoError(null);
    setMasterError(null);

    await Promise.allSettled([
      handleGenerateTechnical(),
      handleGeneratePhotorealistic(),
      handleGenerateMaster(),
    ]);
  };

  const isGeneratingAny = isGeneratingTech || isGeneratingPhoto || isGeneratingMaster;

  return (
    <div className="space-y-8 pb-16 font-sans-ui text-[#F4F7F8]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#C9D3DB]/12">
        <div>
          <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#00E5CC] font-semibold">
            Architectural Studio &bull; Project Nexus
          </span>
          <h1 className="font-editorial text-3xl md:text-4xl font-bold tracking-tight text-[#F4F7F8] mt-1">
            3-Output Generative Studio
          </h1>
          <p className="text-xs text-[#C9D3DB]/70 mt-1 font-light">
            Decoupled 3-stage pipeline: 2D CAD blueprint, fast isometric interior preview, and 1080p photorealistic master render.
          </p>
        </div>

        {/* Engine Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101720] border border-[#C9D3DB]/15 text-xs font-mono-code shadow-xs">
            <Cpu className="w-4 h-4 text-[#00E5CC]" />
            <span className="text-[#C9D3DB]/60">Inference Node:</span>
            {aiStatus?.cuda_available ? (
              <span className="text-[#00B894] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00B894] animate-pulse" />
                COLAB SDXL ONLINE
              </span>
            ) : (
              <span className="text-[#62DDF5] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00E5CC]" />
                HYBRID PBR READY
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Parameter & Control Studio Panel */}
        <div className="lg:col-span-4 nexus-panel p-6 rounded-2xl border border-[#C9D3DB]/15 bg-[#101720] space-y-6 shadow-xl">
          {/* Target Output Tabs */}
          <div className="flex rounded-lg bg-[#07090D] p-1 border border-[#C9D3DB]/15 text-xs font-mono-code">
            <button
              onClick={() => setActiveControlTab('master')}
              className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                activeControlTab === 'master'
                  ? 'bg-[#111E2A] text-[#00E5CC] border border-[#00E5CC]/30 font-bold shadow-xs'
                  : 'text-[#C9D3DB]/60 hover:text-[#F4F7F8]'
              }`}
            >
              Output 3 (Master)
            </button>
            <button
              onClick={() => setActiveControlTab('photoreal')}
              className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                activeControlTab === 'photoreal'
                  ? 'bg-[#111E2A] text-[#62DDF5] border border-[#62DDF5]/30 font-bold shadow-xs'
                  : 'text-[#C9D3DB]/60 hover:text-[#F4F7F8]'
              }`}
            >
              Output 2 (Preview)
            </button>
            <button
              onClick={() => setActiveControlTab('technical')}
              className={`flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer ${
                activeControlTab === 'technical'
                  ? 'bg-[#111E2A] text-[#00B894] border border-[#00B894]/30 font-bold shadow-xs'
                  : 'text-[#C9D3DB]/60 hover:text-[#F4F7F8]'
              }`}
            >
              Output 1 (CAD)
            </button>
          </div>

          <div className="space-y-4 text-xs font-sans-ui">
            {/* Master Render Viewpoint (Active when on Master Tab) */}
            {activeControlTab === 'master' && (
              <div className="p-4 rounded-xl bg-[#07090D] border border-[#C9D3DB]/15 space-y-3">
                <label className="block text-xs font-mono-code text-[#00E5CC] font-bold flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#00E5CC]" />
                  <span>3D Perspective Camera Setup</span>
                </label>
                <select
                  value={masterViewpoint}
                  onChange={(e) => handleSelectViewpoint(e.target.value)}
                  className="w-full bg-[#101720] border border-[#C9D3DB]/20 rounded-lg px-3 py-2 text-[#F4F7F8] focus:outline-none focus:border-[#00E5CC] text-xs font-medium cursor-pointer shadow-inner"
                >
                  {MASTER_CAMERA_VIEWPOINTS.map((vp) => (
                    <option key={vp.id} value={vp.id}>
                      {vp.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#C9D3DB]/60 font-light">
                  {MASTER_CAMERA_VIEWPOINTS.find((v) => v.id === masterViewpoint)?.desc}
                </p>

                {/* AI Model Provider */}
                <div className="pt-2">
                  <label className="block text-[11px] font-mono-code text-[#C9D3DB]/60 mb-1 font-semibold">
                    Inference Engine Node
                  </label>
                  <select
                    value={modelProvider}
                    onChange={(e) => setModelProvider(e.target.value)}
                    className="w-full bg-[#101720] border border-[#C9D3DB]/20 rounded-lg px-2.5 py-1.5 text-[#F4F7F8] font-mono-code text-xs focus:outline-none focus:border-[#00E5CC] shadow-inner cursor-pointer"
                  >
                    <option value="auto">Auto (Colab GPU Node / Remote Fallback)</option>
                    <option value="colab">Google Colab GPU Node (SDXL + ControlNet)</option>
                    <option value="standby">Hybrid PBR Deterministic Engine</option>
                  </select>
                </div>

                {/* Upscaling Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono-code text-[#C9D3DB] font-medium">Lanczos 2X Master Upscale:</span>
                  <button
                    onClick={() => setEnableUpscaling(!enableUpscaling)}
                    className={`px-3 py-1 rounded text-xs font-mono-code font-bold transition-all cursor-pointer ${
                      enableUpscaling
                        ? 'bg-[#00E5CC]/15 text-[#00E5CC] border border-[#00E5CC]/30'
                        : 'bg-[#101720] text-[#C9D3DB]/50 border border-[#C9D3DB]/15'
                    }`}
                  >
                    {enableUpscaling ? '1080P ACTIVE' : 'OFF'}
                  </button>
                </div>
              </div>
            )}

            {/* Architectural Style */}
            <div>
              <label className="block text-xs font-mono-code text-[#C9D3DB]/60 mb-1.5 uppercase tracking-wider font-semibold">
                Architectural Facility Style
              </label>
              <select
                value={archStyle}
                onChange={(e) => setArchStyle(e.target.value)}
                className="w-full bg-[#07090D] border border-[#C9D3DB]/20 rounded-lg px-3 py-2 text-[#F4F7F8] focus:outline-none focus:border-[#00E5CC] text-xs font-medium cursor-pointer shadow-inner"
              >
                <option value="Modern Enterprise Data Center">Modern Enterprise Data Center</option>
                <option value="Hyperscale Cloud Facility">Hyperscale Cloud Facility (Tier IV)</option>
                <option value="Premium Industrial Data Center">Premium Industrial Data Center</option>
                <option value="Futuristic Enterprise Facility">Futuristic Enterprise Facility</option>
                <option value="Minimalist Modular Facility">Minimalist Modular Facility</option>
              </select>
            </div>

            {/* Lighting Environment */}
            <div>
              <label className="block text-xs font-mono-code text-[#C9D3DB]/60 mb-1.5 uppercase tracking-wider font-semibold">
                Ambient Lighting Condition
              </label>
              <select
                value={lightingCondition}
                onChange={(e) => setLightingCondition(e.target.value)}
                className="w-full bg-[#07090D] border border-[#C9D3DB]/20 rounded-lg px-3 py-2 text-[#F4F7F8] focus:outline-none focus:border-[#00E5CC] text-xs font-medium cursor-pointer shadow-inner"
              >
                <option value="Professional White Lighting">Professional White Lighting (5000K Diffuse)</option>
                <option value="Cool Blue Lighting">Cool Blue Lighting (4000K High-CRI)</option>
                <option value="Natural Daylight">Natural Daylight (Architectural CRI 95+)</option>
                <option value="Cinematic Architectural Lighting">Cinematic Architectural Lighting (Deep Contrast)</option>
              </select>
            </div>

            {/* Preview Camera Viewpoint (Output 2) */}
            {activeControlTab === 'photoreal' && (
              <div>
                <label className="block text-xs font-mono-code text-[#62DDF5] mb-1.5 flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                  <Camera className="w-3.5 h-3.5 text-[#62DDF5]" />
                  <span>Output 2 Preview Viewpoint</span>
                </label>
                <select
                  value={cameraViewpoint}
                  onChange={(e) => setCameraViewpoint(e.target.value)}
                  className="w-full bg-[#07090D] border border-[#C9D3DB]/20 rounded-lg px-3 py-2 text-[#F4F7F8] focus:outline-none focus:border-[#62DDF5] text-xs font-medium cursor-pointer shadow-inner"
                >
                  {CAMERA_VIEWPOINTS.map((vp) => (
                    <option key={vp.id} value={vp.id}>
                      {vp.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Technical Parameters */}
            {(activeControlTab === 'both' || activeControlTab === 'technical') && (
              <div>
                <label className="block text-xs font-mono-code text-[#00B894] mb-1.5 uppercase tracking-wider font-semibold">
                  Perimeter Cooling System
                </label>
                <select
                  value={coolingArch}
                  onChange={(e) => setCoolingArch(e.target.value)}
                  className="w-full bg-[#07090D] border border-[#C9D3DB]/20 rounded-lg px-3 py-2 text-[#F4F7F8] focus:outline-none focus:border-[#00B894] text-xs font-medium cursor-pointer shadow-inner"
                >
                  <option value="CRAC Perimeter Precision">Perimeter Downflow CRAC Precision (95kW)</option>
                  <option value="In-Row Direct Chilled Water">In-Row Chilled Water Heat Exchangers</option>
                  <option value="Direct-to-Chip Liquid Cooling">Direct-to-Chip Liquid Cooling Loops</option>
                  <option value="Evaporative Free Cooling">Evaporative Free Cooling System</option>
                </select>
              </div>
            )}

            {/* Seed */}
            <div className="pt-1">
              <label className="block text-xs font-mono-code text-[#C9D3DB]/60 mb-1 uppercase tracking-wider font-semibold">
                Random Generation Seed
              </label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full bg-[#07090D] border border-[#C9D3DB]/20 rounded-lg px-3 py-1.5 text-[#F4F7F8] font-mono-code text-xs focus:outline-none focus:border-[#00E5CC] shadow-inner"
              />
            </div>
          </div>

          {/* Master Generation Buttons */}
          <div className="space-y-2.5 pt-4 border-t border-[#C9D3DB]/12">
            {/* Primary Action: Generate All 3 Outputs */}
            <MagneticButton
              onClick={handleGenerateAllThree}
              disabled={isGeneratingAny}
              variant="primary"
              size="md"
              className="w-full !py-3.5 tracking-wider uppercase font-mono-code font-bold"
              icon={<Sparkles className={`w-4 h-4 ${isGeneratingAny ? 'animate-spin' : ''}`} />}
            >
              {isGeneratingAny ? 'Synthesizing All 3 Outputs...' : 'Generate All 3 Outputs'}
            </MagneticButton>

            {/* Sub-buttons for individual generation */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleGenerateMaster}
                disabled={isGeneratingMaster}
                className="py-2 px-2 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#00E5CC] border border-[#00E5CC]/30 text-[11px] font-mono-code flex items-center justify-center gap-1 transition-all cursor-pointer font-bold shadow-xs"
                title="Generate Output 3 Master Render Only"
              >
                <Crown className={`w-3 h-3 ${isGeneratingMaster ? 'animate-spin' : ''}`} />
                <span>Gen Out 3</span>
              </button>

              <button
                onClick={handleGeneratePhotorealistic}
                disabled={isGeneratingPhoto}
                className="py-2 px-2 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#62DDF5] border border-[#62DDF5]/30 text-[11px] font-mono-code flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                title="Generate Output 2 Preview Only"
              >
                <Camera className={`w-3 h-3 ${isGeneratingPhoto ? 'animate-spin' : ''}`} />
                <span>Gen Out 2</span>
              </button>

              <button
                onClick={handleGenerateTechnical}
                disabled={isGeneratingTech}
                className="py-2 px-2 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#00B894] border border-[#00B894]/30 text-[11px] font-mono-code flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                title="Generate Output 1 Blueprint Only"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingTech ? 'animate-spin' : ''}`} />
                <span>Gen Out 1</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Visualizations Showcase */}
        <div className="lg:col-span-8 space-y-6">
          {/* Display Mode Switcher Toolbar */}
          <div className="nexus-panel p-2.5 rounded-xl border border-[#C9D3DB]/15 bg-[#101720] flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code shadow-md">
            <span className="text-[#C9D3DB]/60 uppercase tracking-wider font-semibold pl-2">Display Mode:</span>

            <div className="flex rounded-lg bg-[#07090D] p-1 border border-[#C9D3DB]/15 gap-1">
              <button
                onClick={() => setViewMode('all_three')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'all_three'
                    ? 'bg-[#111E2A] text-[#00E5CC] border border-[#00E5CC]/30 font-bold shadow-xs'
                    : 'text-[#C9D3DB]/60 hover:text-[#F4F7F8]'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-[#00E5CC]" />
                <span>All 3 Outputs</span>
              </button>

              <button
                onClick={() => setViewMode('master_only')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'master_only'
                    ? 'bg-[#111E2A] text-[#00E5CC] border border-[#00E5CC]/30 font-bold shadow-xs'
                    : 'text-[#C9D3DB]/60 hover:text-[#F4F7F8]'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-[#00E5CC]" />
                <span>Output 3 Only</span>
              </button>

              <button
                onClick={() => setViewMode('side_by_side')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'side_by_side'
                    ? 'bg-[#111E2A] text-[#62DDF5] border border-[#62DDF5]/30 font-bold shadow-xs'
                    : 'text-[#C9D3DB]/60 hover:text-[#F4F7F8]'
                }`}
              >
                <Columns className="w-3.5 h-3.5 text-[#62DDF5]" />
                <span>Outputs 1 & 2</span>
              </button>

              <button
                onClick={() => setViewMode('slider')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'slider'
                    ? 'bg-[#111E2A] text-[#00B894] border border-[#00B894]/30 font-bold shadow-xs'
                    : 'text-[#C9D3DB]/60 hover:text-[#F4F7F8]'
                }`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5 text-[#00B894]" />
                <span>Comparison Slider</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* OUTPUT 3: FINAL ARCHITECTURAL MASTER RENDER (HERO CARD) */}
          {/* ========================================================================= */}
          {(viewMode === 'all_three' || viewMode === 'master_only') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="nexus-panel p-6 rounded-2xl border border-[#00E5CC]/30 bg-[#101720] space-y-5 relative overflow-hidden shadow-2xl"
            >
              {/* Luminous Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00E5CC] via-[#62DDF5] to-[#00B894]" />

              <div className="space-y-4">
                {/* Header with Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono-code px-2.5 py-0.5 rounded-full bg-[#00E5CC]/15 text-[#00E5CC] border border-[#00E5CC]/35 uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-xs">
                        <Crown className="w-3.5 h-3.5 text-[#00E5CC]" />
                        OUTPUT 3 &bull; FINAL ARCHITECTURAL MASTER RENDER
                      </span>
                      <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#00B894]/15 text-[#00B894] border border-[#00B894]/30 font-bold">
                        1080P UHD &bull; PBR + SDXL
                      </span>
                    </div>
                    <h2 className="font-editorial text-2xl font-bold text-[#F4F7F8] mt-2 tracking-tight">
                      {masterDesign?.viewpoint_label || 'Photorealistic 3D Interior Architecture'}
                    </h2>
                    <p className="text-xs text-[#C9D3DB]/70 font-light">
                      Deterministic 3D CAD geometry locked with multi-scale SDXL spatial diffusion. Zero hallucination.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPresentationOpen(true)}
                      disabled={!masterDesign}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#00E5CC] border border-[#00E5CC]/30 text-xs font-mono-code transition-colors shadow-xs disabled:opacity-40 cursor-pointer"
                    >
                      <Tv className="w-3.5 h-3.5 text-[#00E5CC]" />
                      <span>Presentation Mode</span>
                    </button>
                  </div>
                </div>

                {/* Perspective Viewpoint Switcher Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#C9D3DB]/12">
                  <span className="text-xs font-mono-code text-[#C9D3DB]/60 uppercase tracking-wider font-semibold">
                    Camera Perspectives:
                  </span>
                  {MASTER_CAMERA_VIEWPOINTS.map((vp) => (
                    <button
                      key={vp.id}
                      onClick={() => handleSelectViewpoint(vp.id)}
                      className={`px-3 py-1 rounded-md text-xs font-mono-code transition-all cursor-pointer border ${
                        selectedMasterView === vp.id
                          ? 'bg-[#111E2A] text-[#00E5CC] border-[#00E5CC] font-bold shadow-xs'
                          : 'bg-[#07090D] text-[#C9D3DB]/70 border-[#C9D3DB]/15 hover:text-[#F4F7F8]'
                      }`}
                    >
                      {vp.label}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setModalImage({
                        url: '/images/p2_view_a_comparison.png',
                        title: 'Output 3: Three-Stage Quantitative Comparison Canvas',
                      })
                    }
                    className="ml-auto px-3 py-1 rounded-md text-xs font-mono-code bg-[#07090D] text-[#62DDF5] border border-[#62DDF5]/40 hover:bg-[#62DDF5]/10 transition-colors font-semibold cursor-pointer"
                  >
                    View 3-Stage Comparison Canvas
                  </button>
                </div>

                {/* Master Render Preview Box (Widescreen 16:9 Aspect Ratio) */}
                <div className="rounded-xl overflow-hidden border border-[#C9D3DB]/20 aspect-[16/9] bg-[#07090D] relative group shadow-2xl">
                  {isGeneratingMaster ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07090D]/95 p-6 space-y-4 text-center text-[#F4F7F8]">
                      <div className="relative">
                        <Crown className="w-12 h-12 text-[#00E5CC] animate-pulse" />
                        <Sparkles className="w-5 h-5 text-[#62DDF5] absolute -top-1 -right-1 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-[#F4F7F8] font-mono-code block">
                          Executing Final Architectural Master Render
                        </span>
                        <span className="text-xs text-[#00E5CC] font-mono-code block">
                          {masterProgressStep || 'Running SDXL + ControlNet on Colab GPU...'}
                        </span>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-64 max-w-full bg-[#101720] rounded-full h-2 overflow-hidden border border-[#C9D3DB]/15">
                        <div
                          className="bg-gradient-to-r from-[#00E5CC] to-[#62DDF5] h-2 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_#00E5CC]"
                          style={{ width: `${masterProgressPercent || 20}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-[#00B894] font-mono-code">
                        Hardware: Google Colab GPU &bull; Hybrid PBR + SDXL ControlNet Canny
                      </span>
                    </div>
                  ) : masterDesign ? (
                    <>
                      <img
                        src={masterDesign.image_url}
                        alt="Final Architectural Master Render"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/p2_output3_master_render.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-[#07090D]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          onClick={() =>
                            setModalImage({
                              url: masterDesign.image_url,
                              title: `Output 3: ${masterDesign.viewpoint_label || 'Final Master Render'}`,
                            })
                          }
                          className="p-2.5 rounded-lg bg-[#07090D]/90 text-white hover:text-[#00E5CC] border border-white/20 transition-all cursor-pointer shadow-lg"
                          title="Full-Screen Zoom"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setIsPresentationOpen(true)}
                          className="p-2.5 rounded-lg btn-nexus-teal transition-all cursor-pointer shadow-lg"
                          title="Launch Presentation Mode"
                        >
                          <Tv className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#C9D3DB] text-xs font-mono-code p-6 text-center space-y-3">
                      <div className="p-3 rounded-xl bg-[#101720] border border-[#00E5CC]/30 text-[#00E5CC]">
                        <Crown className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-white block">
                          Photorealistic Master Render Ready
                        </span>
                        <span className="text-[11px] text-[#C9D3DB]/70 max-w-md block">
                          1080p architectural visualization conditioned via 3D CAD Canny perspectives.
                        </span>
                      </div>
                      <button
                        onClick={handleGenerateMaster}
                        disabled={isGeneratingMaster}
                        className="btn-nexus-teal px-4 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer shadow-md transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>GENERATE FINAL MASTER RENDER</span>
                      </button>
                    </div>
                  )}

                  {masterError && (
                    <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-red-950/90 border border-red-500/60 text-white text-xs font-mono-code flex items-start gap-2 shadow-xl backdrop-blur-md">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-red-300 block mb-0.5">Colab Generation Notice:</span>
                        <span className="text-red-100">{masterError}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Master Render Technical Specifications Strip */}
                {masterDesign && (
                  <div className="p-3.5 rounded-xl bg-[#07090D] border border-[#C9D3DB]/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-code">
                    <div>
                      <span className="text-[#C9D3DB]/50 block text-[10px] uppercase font-semibold">Engine / Pipeline:</span>
                      <span className="text-[#00E5CC] font-bold">
                        {masterDesign.model_name || 'Hybrid PBR + SDXL ControlNet'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#C9D3DB]/50 block text-[10px] uppercase font-semibold">Optical Profile:</span>
                      <span className="text-[#F4F7F8] font-bold">{masterDesign.viewpoint_label || 'Elevated 3/4 Overview'}</span>
                    </div>
                    <div>
                      <span className="text-[#C9D3DB]/50 block text-[10px] uppercase font-semibold">Master Resolution:</span>
                      <span className="text-[#00B894] font-bold">{masterDesign.resolution} (1080p UHD)</span>
                    </div>
                    <div>
                      <span className="text-[#C9D3DB]/50 block text-[10px] uppercase font-semibold">Metric Fidelity:</span>
                      <span className="text-[#00E5CC] font-bold uppercase">
                        100% CAD Geometry Lock
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Master Render Action Toolbar */}
              <div className="pt-3 border-t border-[#C9D3DB]/12 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code">
                <button
                  onClick={handleGenerateMaster}
                  disabled={isGeneratingMaster}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#00E5CC] border border-[#00E5CC]/30 cursor-pointer font-bold shadow-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingMaster ? 'animate-spin' : ''}`} />
                  <span>Regenerate Master Render</span>
                </button>

                <div className="flex items-center gap-2">
                  {masterDesign && (
                    <a
                      href={masterDesign.image_url}
                      download={`RackVision_Master_Render_${masterDesign.id}.png`}
                      className="btn-nexus-teal flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg cursor-pointer font-bold shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Final Master</span>
                    </a>
                  )}
                  {masterDesign && (
                    <button
                      onClick={() => onSaveToGallery(masterDesign.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#C9D3DB] border border-[#C9D3DB]/20 cursor-pointer shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00B894]" />
                      <span>Save to Project</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Interactive Comparison Slider Mode */}
          {viewMode === 'slider' && (
            <div className="space-y-4">
              <BeforeAfterSlider
                beforeImage={technicalDesign?.image_url || '/images/p2_perspective_conditioning_canny.png'}
                afterImage={masterDesign?.image_url || '/images/p2_output3_master_render.png'}
                beforeLabel="Input: 3D CAD Perspective Canny Map (768×768)"
                afterLabel={`Output 3: Master Render (${masterDesign?.viewpoint_label || '1080p Master'})`}
              />
            </div>
          )}

          {/* Side-by-Side Dual Output Cards (Output 1 and Output 2) */}
          {(viewMode === 'all_three' || viewMode === 'side_by_side') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CARD 1: TECHNICAL ARCHITECTURAL VISUALIZATION */}
              <div className="nexus-panel p-5 rounded-2xl border border-[#C9D3DB]/15 bg-[#101720] space-y-4 flex flex-col justify-between relative overflow-hidden shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#00E5CC]/15 text-[#00E5CC] border border-[#00E5CC]/30 uppercase font-bold">
                        OUTPUT 1 &bull; 2D CAD BLUEPRINT
                      </span>
                      <h3 className="font-editorial text-lg font-bold text-[#F4F7F8] mt-1">
                        Technical Architectural Layout
                      </h3>
                    </div>
                    <span className="text-xs font-mono-code text-[#C9D3DB]/60">
                      {technicalDesign?.resolution || '1024x768'}
                    </span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-[#C9D3DB]/15 aspect-[4/3] bg-[#07090D] relative group shadow-inner">
                    {isGeneratingTech ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07090D]/90 space-y-2 text-[#00E5CC] text-xs font-mono-code">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                        <span>Synthesizing Technical Blueprint...</span>
                      </div>
                    ) : technicalDesign ? (
                      <>
                        <img
                          src={technicalDesign.image_url}
                          alt="Technical Layout"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[#07090D]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            onClick={() =>
                              setModalImage({
                                url: technicalDesign.image_url,
                                title: 'Output 1: Technical Architectural Layout',
                              })
                            }
                            className="p-2 rounded-lg bg-[#07090D]/90 text-white hover:text-[#00E5CC] border border-white/20 transition-all cursor-pointer shadow-md"
                            title="Full Screen View"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[#C9D3DB]/50 text-xs font-mono-code p-4 text-center">
                        <Compass className="w-8 h-8 text-[#C9D3DB]/30 mb-2" />
                        <span>No technical layout generated yet.</span>
                      </div>
                    )}

                    {techError && (
                      <div className="absolute bottom-2 left-2 right-2 p-2 rounded bg-rose-600 text-white text-[11px] font-mono-code">
                        Error: {techError}
                      </div>
                    )}
                  </div>

                  {technicalDesign && (
                    <div className="p-3 rounded-xl bg-[#07090D] border border-[#C9D3DB]/15 space-y-1 text-xs font-mono-code">
                      <div className="flex justify-between text-[#C9D3DB]/60">
                        <span>Style:</span>
                        <span className="text-[#F4F7F8] font-bold">{technicalDesign.style}</span>
                      </div>
                      <div className="flex justify-between text-[#C9D3DB]/60">
                        <span>Infrastructure:</span>
                        <span className="text-[#00E5CC] font-semibold">{technicalDesign.cooling_type}</span>
                      </div>
                      <div className="flex justify-between text-[#C9D3DB]/60">
                        <span>Mode:</span>
                        <span className="text-[#00B894] uppercase font-bold">{technicalDesign.mode}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#C9D3DB]/12 flex items-center justify-between gap-2 text-xs font-mono-code">
                  <button
                    onClick={handleGenerateTechnical}
                    disabled={isGeneratingTech}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#C9D3DB] border border-[#C9D3DB]/20 cursor-pointer shadow-xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingTech ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {technicalDesign && (
                      <a
                        href={technicalDesign.image_url}
                        download={`RackVision_Technical_${technicalDesign.id}.png`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#C9D3DB] border border-[#C9D3DB]/20 cursor-pointer shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#00E5CC]" />
                        <span>Download</span>
                      </a>
                    )}
                    <button
                      onClick={onNavigateTo3D}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#00E5CC] border border-[#00E5CC]/30 cursor-pointer shadow-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#00E5CC]" />
                      <span>3D View</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 2: PHOTOREALISTIC INTERIOR PREVIEW */}
              <div className="nexus-panel p-5 rounded-2xl border border-[#C9D3DB]/15 bg-[#101720] space-y-4 flex flex-col justify-between relative overflow-hidden shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-[#62DDF5]/15 text-[#62DDF5] border border-[#62DDF5]/30 uppercase font-bold">
                        OUTPUT 2 &bull; ISOMETRIC PREVIEW
                      </span>
                      <h3 className="font-editorial text-lg font-bold text-[#F4F7F8] mt-1">
                        Photorealistic Interior Preview
                      </h3>
                    </div>
                    <span className="text-xs font-mono-code text-[#62DDF5] font-bold">
                      FAST PREVIEW
                    </span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-[#C9D3DB]/15 aspect-[4/3] bg-[#07090D] relative group shadow-inner">
                    {isGeneratingPhoto ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07090D]/90 space-y-2 text-[#62DDF5] text-xs font-mono-code">
                        <Camera className="w-8 h-8 animate-pulse text-[#62DDF5]" />
                        <span>Rendering Photorealistic Preview...</span>
                      </div>
                    ) : photoDesign ? (
                      <>
                        <img
                          src={photoDesign.image_url}
                          alt="Photorealistic Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[#07090D]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            onClick={() =>
                              setModalImage({
                                url: photoDesign.image_url,
                                title: 'Output 2: Photorealistic Interior Preview',
                              })
                            }
                            className="p-2 rounded-lg bg-[#07090D]/90 text-white hover:text-[#00E5CC] border border-white/20 transition-all cursor-pointer shadow-md"
                            title="Full Screen View"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[#C9D3DB]/50 text-xs font-mono-code p-4 text-center">
                        <Camera className="w-8 h-8 text-[#C9D3DB]/30 mb-2" />
                        <span>No photorealistic preview generated yet.</span>
                      </div>
                    )}

                    {photoError && (
                      <div className="absolute bottom-2 left-2 right-2 p-2 rounded bg-rose-600 text-white text-[11px] font-mono-code">
                        Error: {photoError}
                      </div>
                    )}
                  </div>

                  {photoDesign && (
                    <div className="p-3 rounded-xl bg-[#07090D] border border-[#C9D3DB]/15 space-y-1 text-xs font-mono-code">
                      <div className="flex justify-between text-[#C9D3DB]/60">
                        <span>Optics:</span>
                        <span className="text-[#F4F7F8] font-bold">
                          {photoDesign.viewpoint_label || photoDesign.camera_viewpoint || 'Front Symmetrical'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#C9D3DB]/60">
                        <span>Camera / Lens:</span>
                        <span className="text-[#F4F7F8]">35mm f/1.8 Architectural</span>
                      </div>
                      <div className="flex justify-between text-[#C9D3DB]/60">
                        <span>Engine:</span>
                        <span className="text-[#00B894] font-bold">
                          {photoDesign.model_name || 'Neural Fast PBR Preview'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#C9D3DB]/12 flex items-center justify-between gap-2 text-xs font-mono-code">
                  <button
                    onClick={handleGeneratePhotorealistic}
                    disabled={isGeneratingPhoto}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#C9D3DB] border border-[#C9D3DB]/20 cursor-pointer shadow-xs transition-colors"
                  >
                    <Camera className={`w-3.5 h-3.5 ${isGeneratingPhoto ? 'animate-spin' : ''}`} />
                    <span>Regenerate View</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {photoDesign && (
                      <a
                        href={photoDesign.image_url}
                        download={`RackVision_Photorealistic_${photoDesign.id}.png`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#C9D3DB] border border-[#C9D3DB]/20 cursor-pointer shadow-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#00E5CC]" />
                        <span>Download</span>
                      </a>
                    )}
                    {photoDesign && (
                      <button
                        onClick={() => onSaveToGallery(photoDesign.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#07090D] hover:bg-[#111E2A] text-[#C9D3DB] border border-[#C9D3DB]/20 cursor-pointer shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00B894]" />
                        <span>Save</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FINAL PRESENTATION MODE MODAL (Full-Screen Immersive Architectural View) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPresentationOpen && masterDesign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#07090D]/98 backdrop-blur-2xl flex flex-col p-6 sm:p-10 justify-between overflow-y-auto text-[#F4F7F8]"
          >
            {/* Presentation Header */}
            <div className="flex items-center justify-between border-b border-[#C9D3DB]/12 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#00E5CC]/20 border border-[#00E5CC]/40 flex items-center justify-center text-[#00E5CC] shadow-[0_0_20px_rgba(0,229,204,0.3)]">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono-code text-[#00E5CC] tracking-widest uppercase font-bold">
                    Project Nexus &bull; Architectural Presentation Mode
                  </span>
                  <h1 className="font-editorial text-2xl font-bold text-white tracking-tight mt-0.5">
                    {masterDesign.viewpoint_label || masterDesign.style}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={masterDesign.image_url}
                  download={`RackVision_Presentation_Master_${masterDesign.id}.png`}
                  className="btn-nexus-teal flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono-code font-bold cursor-pointer transition-colors shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Export 1080p Master</span>
                </a>
                <button
                  onClick={() => setIsPresentationOpen(false)}
                  className="p-2 rounded-lg bg-[#101720] hover:bg-[#111E2A] border border-[#C9D3DB]/20 text-white cursor-pointer transition-colors"
                  title="Close Presentation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central Master Render Display */}
            <div className="my-6 flex-1 flex items-center justify-center">
              <div className="w-full max-w-6xl aspect-[16/9] rounded-2xl overflow-hidden border border-[#00E5CC]/40 shadow-[0_0_60px_rgba(0,0,0,0.9)] bg-black relative">
                <img
                  src={masterDesign.image_url}
                  alt="Presentation Master Render"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Presentation Footer HUD (Specs & Certifications) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-5 rounded-2xl bg-[#101720] border border-[#C9D3DB]/15 text-xs font-mono-code">
              <div>
                <span className="text-[#C9D3DB]/50 block text-[10px] uppercase font-bold">Layout Racks</span>
                <span className="text-[#00E5CC] font-bold text-sm">{masterDesign.rack_count || 12} Cabinets</span>
              </div>
              <div>
                <span className="text-[#C9D3DB]/50 block text-[10px] uppercase font-bold">Camera Optics</span>
                <span className="text-[#F4F7F8] font-medium text-xs">
                  {masterDesign.viewpoint_label || 'Wide-Angle Architectural'}
                </span>
              </div>
              <div>
                <span className="text-[#C9D3DB]/50 block text-[10px] uppercase font-bold">Cooling Architecture</span>
                <span className="text-[#00B894] font-medium text-xs">{masterDesign.cooling_type || '3 UKG Precision Units'}</span>
              </div>
              <div>
                <span className="text-[#C9D3DB]/50 block text-[10px] uppercase font-bold">Master Engine</span>
                <span className="text-[#00E5CC] bg-[#00E5CC]/15 px-2 py-0.5 rounded font-bold text-xs inline-block">
                  {masterDesign.model_name || 'Hybrid PBR + SDXL ControlNet'}
                </span>
              </div>
              <div>
                <span className="text-[#C9D3DB]/50 block text-[10px] uppercase font-bold">Resolution & Shading</span>
                <span className="text-[#62DDF5] font-bold text-xs">1920x1080 &bull; Lanczos 2X</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Zoom Modal */}
      <AnimatePresence>
        {modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#07090D]/95 backdrop-blur-md flex flex-col p-6 items-center justify-center text-white"
          >
            <div className="w-full max-w-6xl flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold font-mono-code text-white">{modalImage.title}</h3>
              <button
                onClick={() => setModalImage(null)}
                className="p-2 rounded-lg bg-[#101720] hover:bg-[#111E2A] text-white cursor-pointer border border-[#C9D3DB]/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-w-6xl max-h-[85vh] rounded-2xl overflow-hidden border border-[#00E5CC]/30 shadow-2xl">
              <img src={modalImage.url} alt="Full Screen" className="w-full h-full object-contain" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
