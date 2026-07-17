import { DESIGN_TOKENS, MOTION_EASE } from "@/lib/design-tokens";

export function createFadeUpVariant(
  prefersReducedMotion: boolean,
  y = 16,
  durationMs?: number,
) {
  const duration = durationMs ?? DESIGN_TOKENS.motion.duration.base;

  if (prefersReducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    };
  }

  return {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: duration / 1000,
        ease: MOTION_EASE,
      },
    },
  };
}

export function createStaggerVariant(
  prefersReducedMotion: boolean,
  staggerChildren = 0.07,
  delayMs?: number,
) {
  const delay = delayMs ?? DESIGN_TOKENS.motion.duration.fast;

  if (prefersReducedMotion) {
    return { hidden: {}, visible: {} };
  }

  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren: delay / 1000,
      },
    },
  };
}
