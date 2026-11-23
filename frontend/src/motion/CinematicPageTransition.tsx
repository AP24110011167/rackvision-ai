import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CinematicPageTransitionProps {
  pageKey: string;
  children: React.ReactNode;
  className?: string;
}

export const CinematicPageTransition: React.FC<CinematicPageTransitionProps> = ({
  pageKey,
  children,
  className = '',
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
        transition={{
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1], // Custom cinematic cubic-bezier
        }}
        className={`w-full min-h-full ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
