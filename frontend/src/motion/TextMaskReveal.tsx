import React, { useRef, useEffect } from 'react';
import { gsap } from './motionEngine';

interface TextMaskRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  stagger?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  scrollTrigger?: boolean;
}

/**
 * TextMaskReveal
 * Splits or wraps typography in overflow-hidden containers, sliding text up
 * with a cinematic mask reveal when triggered or scrolled into view.
 */
export const TextMaskReveal: React.FC<TextMaskRevealProps> = ({
  children,
  delay = 0,
  duration = 1.0,
  className = '',
  as: Component = 'div',
  scrollTrigger = true,
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = textRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.set(el, { y: '110%', opacity: 0 });

    const animConfig: gsap.TweenVars = {
      y: '0%',
      opacity: 1,
      duration,
      delay,
      ease: 'power4.out',
    };

    if (scrollTrigger) {
      animConfig.scrollTrigger = {
        trigger: container,
        start: 'top 85%',
        toggleActions: 'play none none none',
      };
    }

    const tween = gsap.to(el, animConfig);

    return () => {
      tween.kill();
    };
  }, [delay, duration, scrollTrigger]);

  return (
    // @ts-expect-error dynamic component type
    <Component ref={containerRef} className={`overflow-hidden inline-block ${className}`}>
      <div ref={textRef} className="will-change-transform">
        {children}
      </div>
    </Component>
  );
};
