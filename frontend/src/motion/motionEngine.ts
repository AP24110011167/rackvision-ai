/**
 * RACKVISION AI — CENTRALIZED GSAP MOTION ENGINE
 * Registers GSAP core, ScrollTrigger, Flip, and Observer plugins.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { Observer } from 'gsap/Observer';

// Register plugins once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, Flip, Observer);
  
  // High-precision ticker settings for 120Hz/60Hz displays
  gsap.ticker.lagSmoothing(500, 33);
}

export { gsap, ScrollTrigger, Flip, Observer };
export default gsap;
