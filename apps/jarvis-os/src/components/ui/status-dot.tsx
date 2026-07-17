import { cn } from "@/lib/cn";

export function StatusDot({
  online,
  label,
}: {
  online: boolean;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          online
            ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
            : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]",
        )}
      />
      {label ?? (online ? "Factory online" : "Demo mode")}
    </span>
  );
}
