import { useEffect, useRef } from 'react';
import { gsap } from './motionEngine';

interface TiltOptions {
  maxRotation?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
}

/**
 * useTilt
 * Adds cinematic 3D perspective tilt and light tracking to interactive cards.
 */
export const useTilt = <T extends HTMLElement = HTMLElement>(
  options: TiltOptions = {}
) => {
  const ref = useRef<T | null>(null);
  const {
    maxRotation = 8,
    perspective = 1000,
    scale = 1.02,
    speed = 0.4,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { transformPerspective: perspective, transformStyle: 'preserve-3d' });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const px = (x / rect.width) * 2 - 1;
      const py = (y / rect.height) * 2 - 1;

      gsap.to(el, {
        rotationY: px * maxRotation,
        rotationX: -py * maxRotation,
        scale,
        duration: speed,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      // Update CSS variables for dynamic specular reflection
      el.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
      el.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        rotationY: 0,
        rotationX: 0,
        scale: 1,
        duration: speed * 1.5,
        ease: 'power3.out',
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
  }, [maxRotation, perspective, scale, speed]);

  return ref;
};
