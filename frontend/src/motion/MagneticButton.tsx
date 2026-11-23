import React, { useRef } from 'react';
import { useMagnetic } from './useMagnetic';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'bronze';
  size?: 'sm' | 'md' | 'lg';
  magneticStrength?: number;
  glowColor?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  variant = 'primary',
  size = 'md',
  magneticStrength = 0.3,
  glowColor,
  icon,
  children,
  className = '',
  onClick,
  ...props
}) => {
  const buttonRef = useMagnetic<HTMLButtonElement>({ strength: magneticStrength });
  const innerRef = useRef<HTMLSpanElement | null>(null);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-[#00D6C9] to-[#00B894] text-[#080B0F] font-semibold shadow-[0_0_25px_rgba(0,214,201,0.25)] hover:shadow-[0_0_35px_rgba(0,214,201,0.45)] border border-[rgba(0,214,201,0.5)]';
      case 'secondary':
        return 'bg-[#111820]/90 backdrop-blur-md text-[#F3F1E9] border border-[rgba(168,179,188,0.2)] hover:border-[#00D6C9]/60 hover:text-[#00D6C9]';
      case 'bronze':
        return 'bg-gradient-to-r from-[#C6A477] to-[#A88B5E] text-[#080B0F] font-semibold shadow-[0_0_25px_rgba(198,164,119,0.3)] hover:shadow-[0_0_35px_rgba(198,164,119,0.5)] border border-[rgba(198,164,119,0.6)]';
      case 'outline':
        return 'bg-transparent text-[#00D6C9] border border-[#00D6C9]/50 hover:bg-[#00D6C9]/10 hover:border-[#00D6C9]';
      case 'ghost':
        return 'bg-transparent text-[#A8B3BC] hover:text-[#F3F1E9] hover:bg-[#111820]/50';
      default:
        return '';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3.5 py-1.5 text-xs';
      case 'md':
        return 'px-5 py-2.5 text-sm';
      case 'lg':
        return 'px-7 py-3.5 text-base';
      default:
        return 'px-5 py-2.5 text-sm';
    }
  };

  return (
    <button
      ref={buttonRef}
      className={`relative group inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-300 select-none cursor-pointer overflow-hidden ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      onClick={onClick}
      {...props}
    >
      {/* Dynamic Specular Shimmer */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      {/* Button Content */}
      <span ref={innerRef} className="relative z-10 flex items-center gap-2 pointer-events-none">
        {icon && <span className="transition-transform duration-300 group-hover:scale-110">{icon}</span>}
        <span>{children}</span>
      </span>
    </button>
  );
};
