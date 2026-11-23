import { useEffect, useRef } from 'react';
import { gsap } from './motionEngine';

/**
 * useGsapEffect
 * Safely executes GSAP animations within a scoped context and automatically
 * calls context.revert() on unmount or dependency change, preventing memory leaks,
 * duplicate ScrollTriggers, and animation collisions.
 */
export const useGsapEffect = (
  effect: (context: gsap.Context) => void | (() => void),
  deps: React.DependencyList = [],
  scopeRef?: React.RefObject<HTMLElement | null>
) => {
  const isReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    if (isReducedMotion) return;

    const ctx = gsap.context((self) => {
      effect(self);
    }, scopeRef?.current || undefined);

    return () => {
      ctx.revert();
    };
  }, deps);
};
