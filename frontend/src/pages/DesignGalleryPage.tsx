import React, { useState } from 'react';
import { GeneratedDesign } from '../types';
import {
  Image as GalleryIcon, Download, Box, Sparkles,
  Calendar, Layers, Cpu, Maximize2, X, Eye
} from 'lucide-react';

interface DesignGalleryPageProps {
  designs: GeneratedDesign[];
  onSelectFor3D: (design: GeneratedDesign) => void;
}

export const DesignGalleryPage: React.FC<DesignGalleryPageProps> = ({
  designs,
  onSelectFor3D,
}) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedDesign | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'master_render' | 'photorealistic' | 'technical'>('all');

  const filteredDesigns = designs.filter((d) => {
    if (filterType === 'all') return true;
    return d.output_type === filterType;
  });

  return (
    <div className="space-y-8 pb-16 font-sans text-warm-ivory">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-electric-teal font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Architectural Curation
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-warm-ivory mt-1">
            Design Gallery & Visual Archive
          </h1>
          <p className="text-xs text-muted-silver mt-1">
            Browse all saved architectural master renders, photorealistic perspectives, and technical blueprints.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex rounded-xl bg-titanium-charcoal/80 p-1 border border-white/10 text-xs font-mono flex-wrap gap-1 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-electric-teal text-obsidian font-bold shadow-[0_0_10px_rgba(0,214,201,0.3)]'
                : 'text-muted-silver hover:text-warm-ivory'
            }`}
          >
            All ({designs.length})
          </button>
          <button
            onClick={() => setFilterType('master_render')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'master_render'
                ? 'bg-electric-teal text-obsidian font-bold shadow-[0_0_10px_rgba(0,214,201,0.3)]'
                : 'text-muted-silver hover:text-warm-ivory'
            }`}
          >
            Output 3 Master ({designs.filter((d) => d.output_type === 'master_render').length})
          </button>
          <button
            onClick={() => setFilterType('photorealistic')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'photorealistic'
                ? 'bg-champagne-bronze text-obsidian font-bold shadow-[0_0_10px_rgba(198,164,119,0.3)]'
                : 'text-muted-silver hover:text-warm-ivory'
            }`}
          >
            Output 2 Preview ({designs.filter((d) => d.output_type === 'photorealistic').length})
          </button>
          <button
            onClick={() => setFilterType('technical')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'technical'
                ? 'bg-controlled-emerald text-obsidian font-bold shadow-[0_0_10px_rgba(0,184,148,0.3)]'
                : 'text-muted-silver hover:text-warm-ivory'
            }`}
          >
            Output 1 Blueprint ({designs.filter((d) => d.output_type === 'technical').length})
          </button>
        </div>
      </div>

      {/* Grid of Designs */}
      {filteredDesigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDesigns.map((design) => (
            <div
              key={design.id}
              className="rounded-2xl overflow-hidden border border-white/10 bg-graphite/80 backdrop-blur-md transition-all group flex flex-col justify-between shadow-lg hover:border-electric-teal/40 hover:shadow-[0_0_25px_rgba(0,214,201,0.15)]"
            >
              {/* Image Thumbnail */}
              <div
                onClick={() => setSelectedImage(design)}
                className="relative aspect-video overflow-hidden bg-obsidian cursor-pointer"
              >
                <img
                  src={design.image_url}
                  alt={design.style}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

                <div className="absolute top-3 left-3">
                  {design.output_type === 'master_render' ? (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-electric-teal text-obsidian font-bold shadow-md">
                      OUTPUT 3 &bull; MASTER RENDER
                    </span>
                  ) : design.output_type === 'photorealistic' ? (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-champagne-bronze text-obsidian font-bold shadow-md">
                      OUTPUT 2 &bull; PREVIEW
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-controlled-emerald text-obsidian font-bold shadow-md">
                      OUTPUT 1 &bull; BLUEPRINT
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-obsidian/90 px-2.5 py-1 rounded-md text-xs font-mono text-electric-teal border border-electric-teal/30">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div className="p-5 space-y-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-warm-ivory truncate">{design.style}</h4>
                  <p className="text-[11px] font-mono text-muted-silver">
                    {design.viewpoint_label || design.camera_viewpoint || 'Symmetrical View'} &bull; {design.resolution}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <button
                    onClick={() => onSelectFor3D(design)}
                    className="flex items-center gap-1 text-electric-teal hover:underline transition-colors cursor-pointer"
                  >
                    <Box className="w-3.5 h-3.5 text-electric-teal" />
                    <span>View in 3D</span>
                  </button>

                  <a
                    href={design.image_url}
                    download={`RackVision_${design.id}.png`}
                    className="flex items-center gap-1 text-muted-silver hover:text-warm-ivory transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center border border-white/10 bg-graphite/60 backdrop-blur-md space-y-3 shadow-lg">
          <GalleryIcon className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-warm-ivory">No saved designs in this category</h3>
          <p className="text-xs text-muted-silver">Launch the AI Generative Studio to synthesize photorealistic outputs.</p>
        </div>
      )}

      {/* Full-Screen Zoom Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-obsidian/90 backdrop-blur-md flex items-center justify-center p-6 text-warm-ivory">
          <div className="max-w-5xl w-full space-y-4">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-electric-teal">{selectedImage.style} ({selectedImage.resolution})</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer text-warm-ivory transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/15 bg-obsidian shadow-2xl">
              <img src={selectedImage.image_url} alt="Zoomed" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignGalleryPage;
