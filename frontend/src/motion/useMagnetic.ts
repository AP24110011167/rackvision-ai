import { useEffect, useRef } from 'react';
import { gsap } from './motionEngine';

interface MagneticOptions {
  strength?: number;
  ease?: string;
  duration?: number;
}

/**
 * useMagnetic
 * Creates a physics-based magnetic attraction effect for interactive buttons,
 * icons, and badges. On mouseleave, smoothly snaps back to origin.
 */
export const useMagnetic = <T extends HTMLElement = HTMLElement>(
  options: MagneticOptions = {}
) => {
  const ref = useRef<T | null>(null);
  const { strength = 0.35, ease = 'power3.out', duration = 0.5 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      gsap.to(el, {
        x: deltaX,
        y: deltaY,
        duration,
        ease,
        overwrite: 'auto',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: duration * 1.2,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto',
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(el);
    };
  }, [strength, ease, duration]);

  return ref;
};
