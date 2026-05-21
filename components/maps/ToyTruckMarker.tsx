"use client";

import { cn } from "@/lib/utils";

interface ToyTruckMarkerProps {
  bearing?: number;
  isMoving?: boolean;
  label?: string;
}

/**
 * Top-down waste truck (SVG) — rotates with map bearing. 0° = north, clockwise.
 * For custom art: replace with /public/truck-marker.png or see docs/truck-3d-assets.md
 */
export function ToyTruckMarker({ bearing = 0, isMoving = false, label }: ToyTruckMarkerProps) {
  const customSrc =
    typeof process.env.NEXT_PUBLIC_TRUCK_MARKER_URL === "string" &&
    process.env.NEXT_PUBLIC_TRUCK_MARKER_URL.length > 0
      ? process.env.NEXT_PUBLIC_TRUCK_MARKER_URL
      : null;

  return (
    <div className="pointer-events-none relative flex flex-col items-center">
      <div
        className={cn(
          "relative will-change-transform transition-transform",
          isMoving && "animate-truck-drive",
        )}
        style={{
          width: 56,
          height: 56,
          transform: `rotate(${bearing}deg)`,
        }}
      >
        {customSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={customSrc}
            alt=""
            width={56}
            height={56}
            className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
            draggable={false}
          />
        ) : (
        <svg
          width="56"
          height="56"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
          className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
        >
          <defs>
            <linearGradient id="truckBody" x1="32" y1="8" x2="32" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34D399" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="truckCab" x1="32" y1="10" x2="32" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F8FAFC" />
              <stop offset="1" stopColor="#94A3B8" />
            </linearGradient>
            <filter id="truckGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Ground shadow */}
          <ellipse cx="32" cy="34" rx="18" ry="22" fill="rgba(0,0,0,0.22)" />

          {/* Cargo / compactor body */}
          <rect
            x="18"
            y="22"
            width="28"
            height="30"
            rx="6"
            fill="url(#truckBody)"
            stroke="#047857"
            strokeWidth="1.5"
            filter="url(#truckGlow)"
          />
          {/* Stripe detail */}
          <rect x="22" y="30" width="20" height="3" rx="1.5" fill="#A7F3D0" opacity="0.85" />
          <rect x="22" y="38" width="14" height="2" rx="1" fill="#064E3B" opacity="0.35" />

          {/* Cab (front = top of SVG = north) */}
          <path
            d="M24 14h16c2 0 4 2 4 4v8H20v-8c0-2 2-4 4-4z"
            fill="url(#truckCab)"
            stroke="#475569"
            strokeWidth="1.25"
          />
          {/* Windshield */}
          <path d="M26 16h12c1.2 0 2.2 1 2.2 2.2V24H23.8V18.2C23.8 17 24.8 16 26 16z" fill="#38BDF8" opacity="0.9" />
          <path d="M28 18h8v4h-8z" fill="#E0F2FE" opacity="0.5" />

          {/* Headlights */}
          <circle cx="26" cy="12" r="2" fill="#FDE68A" />
          <circle cx="38" cy="12" r="2" fill="#FDE68A" />
          <circle cx="26" cy="12" r="3.5" fill="#FBBF24" opacity="0.35" />
          <circle cx="38" cy="12" r="3.5" fill="#FBBF24" opacity="0.35" />

          {/* Wheels */}
          <circle cx="22" cy="24" r="4" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
          <circle cx="42" cy="24" r="4" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
          <circle cx="22" cy="48" r="4.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
          <circle cx="42" cy="48" r="4.5" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
          <circle cx="22" cy="24" r="1.5" fill="#64748B" />
          <circle cx="42" cy="24" r="1.5" fill="#64748B" />
          <circle cx="22" cy="48" r="1.8" fill="#64748B" />
          <circle cx="42" cy="48" r="1.8" fill="#64748B" />

          {/* Direction chevron */}
          <path d="M32 6 L36 11 H28 Z" fill="#FEF08A" stroke="#CA8A04" strokeWidth="0.75" />
        </svg>
        )}

        {isMoving ? (
          <span className="absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 animate-ping rounded-full bg-emerald-400" />
        ) : null}
      </div>

      {label ? (
        <span className="mt-1.5 max-w-[120px] truncate rounded-lg border border-emerald-500/30 bg-[#0f172a]/95 px-2.5 py-1 text-[10px] font-semibold text-emerald-100 shadow-xl backdrop-blur-sm">
          {label}
        </span>
      ) : null}
    </div>
  );
}
