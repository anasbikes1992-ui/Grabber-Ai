"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

/** 3D pointer-tracked tilt card with a glow that follows the cursor. */
export function TiltCard({
  children,
  className,
  maxTilt = 6,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const px = useMotionValue(0.5); // pointer position 0..1
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), {
    stiffness: 220,
    damping: 20,
  });
  const ry = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), {
    stiffness: 220,
    damping: 20,
  });
  const glowX = useTransform(px, (v) => `${v * 100}%`);
  const glowY = useTransform(py, (v) => `${v * 100}%`);
  const glowBackground = useTransform(
    [glowX, glowY],
    ([x, y]) =>
      `radial-gradient(240px circle at ${x} ${y}, rgba(56,189,248,0.10), transparent 65%)`,
  );

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        className={className}
        style={{
          rotateX: rx,
          rotateY: ry,
          transformStyle: "preserve-3d",
          position: "relative",
        }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width);
          py.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          px.set(0.5);
          py.set(0.5);
        }}
        whileHover={{ scale: 1.015 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <motion.span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            background: glowBackground,
          }}
        />
        {children}
      </motion.div>
    </div>
  );
}

/** Spring count-up for KPI values. Non-numeric values render unchanged. */
export function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const reduced = useReducedMotion() ?? false;
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const [shown, setShown] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    spring.set(value);
    const unsub = spring.on("change", (v) => setShown(v));
    return unsub;
  }, [value, reduced, spring]);

  const rounded = Math.round(shown);
  return <>{format ? format(rounded) : rounded.toLocaleString()}</>;
}

/** Page-level entrance: fade-up + slight scale, once per navigation. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion() ?? false;
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered reveal for grids/lists of cards. */
export function StaggerGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
