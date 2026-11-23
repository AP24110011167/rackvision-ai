import React, { useState } from 'react';
import { GeneratedDesign } from '../types';
import {
  Image as GalleryIcon, Download, Box, Sparkles,
  Calendar, Layers, Cpu, Maximize2, X, Eye, Camera, ShieldCheck
} from 'lucide-react';
import { ArchitecturalImage } from '../components/common/ArchitecturalImage';
import { PerspectiveCard } from '../motion/PerspectiveCard';
import { MagneticButton } from '../motion/MagneticButton';
import { ASSET_REGISTRY, getAssetUrl } from '../services/assetRegistry';

interface DesignGalleryPageProps {
  designs: GeneratedDesign[];
  onSelectFor3D: (design: GeneratedDesign) => void;
}

const CANONICAL_GALLERY_DELIVERABLES: GeneratedDesign[] = [
  {
    id: 'design-master-view-a',
    project_id: 'proj-p2-serverraum',
    output_type: 'master_render',
    style: 'Modern Enterprise Data Center • View A',
    viewpoint_label: 'View A: Elevated 3/4 Overview Master',
    camera_viewpoint: 'wide_angle_architecture',
    resolution: '1920x1080',
    image_url: '/images/p2_view_a_elevated_overview_master.png',
    created_at: new Date().toISOString(),
    prompt: '49.6 m² Serverraum with dual rows of 6 enterprise 42U racks, hot aisle containment, Technikspange plant.',
    negative_prompt: 'blurry, low quality, distorted',
    rack_count: 12,
    cooling_type: '3 UKG Precision Units (15 kW)',
    seed: 42,
    guidance_scale: 7.5,
    steps: 30,
    mode: 'hybrid_pbr_sdxl_controlnet'
  },
  {
    id: 'design-master-view-b',
    project_id: 'proj-p2-serverraum',
    output_type: 'master_render',
    style: 'Modern Enterprise Data Center • View B',
    viewpoint_label: 'View B: Server Room Perspective Master',
    camera_viewpoint: 'cinematic_central_aisle',
    resolution: '1920x1080',
    image_url: '/images/p2_view_b_server_room_master.png',
    created_at: new Date().toISOString(),
    prompt: 'Eye-level cold aisle corridor, Tate HPL conductive flooring, overhead cable trays, 12 server cabinets.',
    negative_prompt: 'blurry, low quality, distorted',
    rack_count: 12,
    cooling_type: '3 UKG Precision Units (15 kW)',
    seed: 42,
    guidance_scale: 7.5,
    steps: 30,
    mode: 'hybrid_pbr_sdxl_controlnet'
  },
  {
    id: 'design-master-view-c',
    project_id: 'proj-p2-serverraum',
    output_type: 'master_render',
    style: 'Technical Utility Plant • View C',
    viewpoint_label: 'View C: Technical Area Cooling Master',
    camera_viewpoint: 'cooling_infrastructure',
    resolution: '1920x1080',
    image_url: '/images/p2_view_c_technical_area_master.png',
    created_at: new Date().toISOString(),
    prompt: 'Dedicated plant showing three 15 kW UKG precision downflow cooling units and interconnecting T30 fire door.',
    negative_prompt: 'blurry, low quality, distorted',
    rack_count: 12,
    cooling_type: '3 UKG Precision Units (15 kW)',
    seed: 42,
    guidance_scale: 7.5,
    steps: 30,
    mode: 'hybrid_pbr_sdxl_controlnet'
  },
  {
    id: 'design-photo-p2',
    project_id: 'proj-p2-serverraum',
    output_type: 'photorealistic',
    style: 'Photorealistic Interior Preview',
    viewpoint_label: 'Front Symmetrical Cold Aisle Perspective',
    camera_viewpoint: 'front_symmetrical',
    resolution: '1920x1080',
    image_url: '/images/p2_view_b_server_room_master.png',
    created_at: new Date().toISOString(),
    prompt: 'Photorealistic spatial preview with 5000K diffuse illumination and cold aisle containment.',
    negative_prompt: 'blurry, low quality, distorted',
    rack_count: 12,
    cooling_type: '3 UKG Precision Units (15 kW)',
    seed: 42,
    guidance_scale: 7.5,
    steps: 30,
    mode: 'photorealistic_synthesis'
  },
  {
    id: 'design-tech-p2',
    project_id: 'proj-p2-serverraum',
    output_type: 'technical',
    style: 'Technical CAD Edge Delineation',
    viewpoint_label: 'ControlNet Canny Wireframe Blueprint',
    camera_viewpoint: 'isometric',
    resolution: '1920x1080',
    image_url: '/images/p2_perspective_conditioning_canny.png',
    created_at: new Date().toISOString(),
    prompt: 'Coordinate-locked CAD edge wireframe delineating 12 cabinet footprints and T30 partition wall.',
    negative_prompt: 'blurry, low quality, distorted',
    rack_count: 12,
    cooling_type: '3 UKG Precision Units (15 kW)',
    seed: 42,
    guidance_scale: 7.5,
    steps: 30,
    mode: 'inference'
  },
  {
    id: 'design-p1-master',
    project_id: 'proj-p1-sketch',
    output_type: 'master_render',
    style: 'P1 Hand-Drawn Sketch Synthesis',
    viewpoint_label: '8-Rack Compact Facility Master Render',
    camera_viewpoint: 'front_symmetrical',
    resolution: '1920x1080',
    image_url: '/images/p1_output3_master_render.png',
    created_at: new Date().toISOString(),
    prompt: '4.8m × 3.6m data room with 8 server cabinets, 2 perimeter A/C units, 80 kW IT load.',
    negative_prompt: 'blurry, low quality, distorted',
    rack_count: 8,
    cooling_type: '2 Perimeter CRAC',
    seed: 42,
    guidance_scale: 7.5,
    steps: 30,
    mode: 'hybrid_pbr_sdxl_controlnet'
  }
];

export const DesignGalleryPage: React.FC<DesignGalleryPageProps> = ({
  designs,
  onSelectFor3D,
}) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedDesign | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'master_render' | 'photorealistic' | 'technical'>('all');

  // Merge canonical deliverables if project designs are empty, ensuring no empty or broken views
  const displayDesigns = designs.length > 0 ? designs : CANONICAL_GALLERY_DELIVERABLES;

  const filteredDesigns = displayDesigns.filter((d) => {
    if (filterType === 'all') return true;
    return d.output_type === filterType;
  });

  return (
    <div className="space-y-8 pb-16 font-sans text-warm-ivory">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#00D6C9] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Architectural Curation & Master Archive
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#F3F1E9] mt-1">
            Design Gallery & Visual Archive
          </h1>
          <p className="text-xs text-[#A8B3BC] mt-1">
            Browse verified architectural master renders, photorealistic perspectives, and technical CAD blueprints.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex rounded-xl bg-[#19232C]/80 p-1 border border-white/10 text-xs font-mono flex-wrap gap-1 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#00D6C9] text-[#080B0F] font-bold shadow-[0_0_10px_rgba(0,214,201,0.3)]'
                : 'text-[#A8B3BC] hover:text-[#F3F1E9]'
            }`}
          >
            All ({displayDesigns.length})
          </button>
          <button
            onClick={() => setFilterType('master_render')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'master_render'
                ? 'bg-[#00D6C9] text-[#080B0F] font-bold shadow-[0_0_10px_rgba(0,214,201,0.3)]'
                : 'text-[#A8B3BC] hover:text-[#F3F1E9]'
            }`}
          >
            Output 3 Master ({displayDesigns.filter((d) => d.output_type === 'master_render').length})
          </button>
          <button
            onClick={() => setFilterType('photorealistic')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'photorealistic'
                ? 'bg-[#00D6C9] text-[#080B0F] font-bold shadow-[0_0_10px_rgba(0,214,201,0.3)]'
                : 'text-[#A8B3BC] hover:text-[#F3F1E9]'
            }`}
          >
            Output 2 Preview ({displayDesigns.filter((d) => d.output_type === 'photorealistic').length})
          </button>
          <button
            onClick={() => setFilterType('technical')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'technical'
                ? 'bg-[#00D6C9] text-[#080B0F] font-bold shadow-[0_0_10px_rgba(0,214,201,0.3)]'
                : 'text-[#A8B3BC] hover:text-[#F3F1E9]'
            }`}
          >
            Output 1 Blueprint ({displayDesigns.filter((d) => d.output_type === 'technical').length})
          </button>
        </div>
      </div>

      {/* Grid of Designs */}
      {filteredDesigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDesigns.map((design) => (
            <PerspectiveCard
              key={design.id}
              className="flex flex-col justify-between shadow-xl overflow-hidden"
            >
              {/* Image Thumbnail with fail-safe ArchitecturalImage */}
              <div
                onClick={() => setSelectedImage(design)}
                className="relative aspect-video overflow-hidden bg-[#080B0F] cursor-pointer"
              >
                <ArchitecturalImage
                  src={design.image_url}
                  alt={design.style}
                  fallbackId="p2_view_a_master"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-3 left-3 z-20">
                  {design.output_type === 'master_render' ? (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#00D6C9] text-[#080B0F] font-bold shadow-md">
                      OUTPUT 3 &bull; MASTER RENDER
                    </span>
                  ) : design.output_type === 'photorealistic' ? (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#C6A477] text-[#080B0F] font-bold shadow-md">
                      OUTPUT 2 &bull; PREVIEW
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#00B894] text-[#080B0F] font-bold shadow-md">
                      OUTPUT 1 &bull; BLUEPRINT
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-[#080B0F]/90 px-2.5 py-1 rounded-md text-xs font-mono text-[#00D6C9] border border-[#00D6C9]/30">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div className="p-5 space-y-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-[#F3F1E9] truncate">{design.style}</h4>
                  <p className="text-[11px] font-mono text-[#A8B3BC]">
                    {design.viewpoint_label || design.camera_viewpoint || 'Symmetrical View'} &bull; {design.resolution}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <button
                    onClick={() => onSelectFor3D(design)}
                    className="flex items-center gap-1 text-[#00D6C9] hover:underline transition-colors cursor-pointer font-bold"
                  >
                    <Box className="w-3.5 h-3.5 text-[#00D6C9]" />
                    <span>View in 3D</span>
                  </button>

                  <a
                    href={design.image_url}
                    download={`RackVision_${design.id}.png`}
                    className="flex items-center gap-1 text-[#A8B3BC] hover:text-[#F3F1E9] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </PerspectiveCard>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center border border-white/10 bg-[#111820]/60 backdrop-blur-md space-y-3 shadow-lg">
          <GalleryIcon className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-[#F3F1E9]">No saved designs in this category</h3>
          <p className="text-xs text-[#A8B3BC]">Launch the AI Generative Studio to synthesize photorealistic outputs.</p>
        </div>
      )}

      {/* Full-Screen Zoom Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-[#080B0F]/95 backdrop-blur-xl flex items-center justify-center p-6 text-[#F3F1E9]"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="max-w-6xl w-full space-y-4 bg-[#111820] p-6 rounded-2xl border border-[#00D6C9]/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center text-xs font-mono pb-3 border-b border-white/10">
              <span className="text-[#00D6C9] font-bold">{selectedImage.style} ({selectedImage.resolution})</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer text-[#F3F1E9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden border border-white/15 bg-[#080B0F] shadow-2xl">
              <img src={selectedImage.image_url} alt="Zoomed" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignGalleryPage;
