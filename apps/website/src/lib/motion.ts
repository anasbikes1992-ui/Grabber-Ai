import { DESIGN_TOKENS, MOTION_EASE } from "@/lib/design-tokens";

type MotionState = {
  opacity: number;
  y: number;
  scale?: number;
};

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

export function createPanelMotion(prefersReducedMotion: boolean) {
  const duration = DESIGN_TOKENS.motion.duration;

  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1, y: 0, scale: 1 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 1, y: 0, scale: 1 },
    };
  }

  return {
    initial: { opacity: 0, y: 14, scale: 0.98 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: duration.base / 1000,
        ease: MOTION_EASE,
      },
    },
    exit: {
      opacity: 0,
      y: 12,
      scale: 0.98,
      transition: {
        duration: duration.fast / 1000,
        ease: MOTION_EASE,
      },
    },
  };
}
