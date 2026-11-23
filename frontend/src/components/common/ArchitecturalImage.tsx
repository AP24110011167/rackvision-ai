import React, { useState } from 'react';
import { getAssetUrl } from '../../services/assetRegistry';
import { ImageOff, Loader2, Maximize2 } from 'lucide-react';

interface ArchitecturalImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackId?: string;
  showExpand?: boolean;
  onExpand?: () => void;
  aspectRatioClass?: string;
}

export const ArchitecturalImage: React.FC<ArchitecturalImageProps> = ({
  src,
  alt = 'Architectural Visualization',
  fallbackId = 'p2_view_a_master',
  showExpand = false,
  onExpand,
  aspectRatioClass = 'aspect-video',
  className = '',
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src || getAssetUrl(fallbackId));
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(getAssetUrl(fallbackId));
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#080B0F] border border-white/10 group ${aspectRatioClass} ${className}`}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111820]/90 backdrop-blur-xs">
          <Loader2 className="w-5 h-5 text-[#00D6C9] animate-spin" />
        </div>
      )}

      {/* Actual Image */}
      <img
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-all duration-700 ${
          isLoading ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
        } ${onExpand ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
        {...props}
      />

      {/* Expand Overlay */}
      {showExpand && onExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-[#080B0F]/80 backdrop-blur-md border border-white/20 text-[#F3F1E9] opacity-0 group-hover:opacity-100 hover:text-[#00D6C9] hover:border-[#00D6C9]/40 transition-all cursor-pointer shadow-lg"
          title="Expand to Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      {/* Subtle Bottom Ambient Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#080B0F]/80 to-transparent pointer-events-none" />
    </div>
  );
};
