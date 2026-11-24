import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './motionEngine';

interface SmoothScrollContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | HTMLElement | number, options?: any) => void;
  stop: () => void;
  start: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

interface SmoothScrollProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({
  children,
  enabled = true,
}) => {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Fallback native scroll listener for GSAP ScrollTrigger
    const handleNativeScroll = () => {
      ScrollTrigger.update();
    };

    if (!enabled || prefersReducedMotion) {
      window.addEventListener('scroll', handleNativeScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleNativeScroll);
      };
    }

    /**
     * CRITICAL SCROLL ARCHITECTURE FIX:
     * - `smoothWheel: false`: Do NOT intercept or call preventDefault() on mouse-wheel or touchpad gestures.
     *   The browser's hardware-accelerated, natural wheel and touchpad scrolling remains 100% active.
     * - `syncTouch: false`: Retain native mobile/touchpad gesture fluidity and inertia.
     * - `autoRaf: true`: Let Lenis manage its internal animation loop smoothly for programmatic `.scrollTo()`.
     * - `prevent`: Automatically bypass any inner scrollable containers, inputs, or canvas overlays.
     * - Synchronize GSAP ScrollTrigger directly on both Lenis scroll and native window scroll.
     */
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: false,
      syncTouch: false,
      autoRaf: true,
      autoResize: true,
      prevent: (node: HTMLElement) => {
        return (
          node.tagName === 'INPUT' ||
          node.tagName === 'TEXTAREA' ||
          node.tagName === 'SELECT' ||
          node.tagName === 'CANVAS' ||
          node.hasAttribute?.('data-lenis-prevent') ||
          Boolean(node.closest?.('[data-lenis-prevent], main, nav, .overflow-y-auto, .overflow-auto'))
        );
      },
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // Keep GSAP ScrollTrigger 100% in sync with scroll position
    lenis.on('scroll', ScrollTrigger.update);
    window.addEventListener('scroll', handleNativeScroll, { passive: true });

    // Refresh ScrollTrigger and resize Lenis after initial DOM elements and images mount
    const timer1 = setTimeout(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    }, 150);

    const timer2 = setTimeout(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    }, 600);

    const handleResize = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleNativeScroll);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, [enabled]);

  const scrollTo = useCallback((target: string | HTMLElement | number, options?: any) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: 0,
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        ...options,
      });
    } else {
      // Fallback for native smooth scroll
      if (typeof target === 'string') {
        const el = document.querySelector(target);
        el?.scrollIntoView({ behavior: 'smooth' });
      } else if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const stop = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    lenisRef.current?.start();
  }, []);

  return (
    <SmoothScrollContext.Provider
      value={{
        lenis: lenisInstance,
        scrollTo,
        stop,
        start,
      }}
    >
      {children}
    </SmoothScrollContext.Provider>
  );
};
