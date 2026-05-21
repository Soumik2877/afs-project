"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-[#1e293b] bg-[#0A0F1E] p-8 text-center">
          <p className="font-display text-lg text-white">Map unavailable</p>
          <p className="mt-2 max-w-md text-sm text-[#94A3B8]">
            {this.props.fallbackMessage ??
              "Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local and reload to enable maps."}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
