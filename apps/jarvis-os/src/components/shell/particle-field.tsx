"use client";

/** Lightweight CSS particle field — no WebGL required for Phase 3 shell. */
export function ParticleField() {
  const dots = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-40"
    >
      {dots.map((i) => (
        <span
          key={i}
          className="absolute h-0.5 w-0.5 rounded-full bg-cyan-300/70"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            animation: `float-y ${4 + (i % 5)}s ease-in-out ${i * 0.2}s infinite`,
            opacity: 0.3 + (i % 5) * 0.1,
          }}
        />
      ))}
    </div>
  );
}
