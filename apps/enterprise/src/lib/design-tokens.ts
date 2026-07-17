import theme from "../../design-tokens/theme.json";

export const DESIGN_TOKENS = theme;

function validateEase(ease: unknown): [number, number, number, number] {
  if (!Array.isArray(ease) || ease.length !== 4 || !ease.every((n) => typeof n === "number")) {
    throw new Error("Invalid motion.ease in enterprise design tokens.");
  }
  return ease as [number, number, number, number];
}

export const MOTION_EASE = validateEase(DESIGN_TOKENS.motion.ease);
