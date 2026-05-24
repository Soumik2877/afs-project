"use client";

import { cn } from "@/lib/utils";

interface DriverRadarMarkerProps {
  bearing?: number;
  isMoving?: boolean;
}

/**
 * Green blinking radar — triangle points along travel bearing (0° = north).
 */
export function DriverRadarMarker({ bearing = 0, isMoving = false }: DriverRadarMarkerProps) {
  return (
    <div className="pointer-events-none relative h-14 w-14">
      <div
        className={cn(
          "absolute inset-0 rounded-full border border-emerald-400/50 bg-emerald-500/15",
          isMoving ? "animate-radar-ring" : "animate-pulse",
        )}
      />
      <div
        className={cn(
          "absolute inset-1 rounded-full border border-emerald-400/35 bg-emerald-500/10",
          isMoving && "animate-radar-ring [animation-delay:400ms]",
        )}
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="h-3 w-3 animate-ping rounded-full bg-emerald-400/70" />
      </span>

      <div
        className="absolute inset-0 flex items-center justify-center will-change-transform"
        style={{ transform: `rotate(${bearing}deg)` }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
          className="drop-shadow-[0_0_12px_rgba(16,185,129,0.85)]"
        >
          <path
            d="M16 4 L28 26 H4 Z"
            fill="#10B981"
            stroke="#34D399"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className={cn(isMoving && "animate-pulse")}
          />
          <circle cx="16" cy="18" r="3" fill="#ECFDF5" opacity="0.9" />
        </svg>
      </div>
    </div>
  );
}
