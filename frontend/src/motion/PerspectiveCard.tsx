import React, { useRef } from 'react';
import { useTilt } from './useTilt';

interface PerspectiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxRotation?: number;
  scale?: number;
  className?: string;
  glowOnHover?: boolean;
}

export const PerspectiveCard: React.FC<PerspectiveCardProps> = ({
  children,
  maxRotation = 6,
  scale = 1.015,
  className = '',
  glowOnHover = true,
  ...props
}) => {
  const cardRef = useTilt<HTMLDivElement>({ maxRotation, scale });

  return (
    <div
      ref={cardRef}
      className={`relative rounded-xl border border-[rgba(168,179,188,0.12)] bg-[#111820]/80 backdrop-blur-md transition-shadow duration-500 overflow-hidden group ${
        glowOnHover ? 'hover:border-[#00D6C9]/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(0,214,201,0.08)]' : ''
      } ${className}`}
      {...props}
    >
      {/* Dynamic Radial Spotlight follows mouse via CSS variable */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
        style={{
          background:
            'radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0, 214, 201, 0.08), transparent 40%)',
        }}
      />
      {children}
    </div>
  );
};
