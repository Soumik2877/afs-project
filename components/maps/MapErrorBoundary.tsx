"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, errorMessage: undefined });
    }
  }

  componentDidCatch(error: Error) {
    console.error("[MapErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      const tokenMissing = !process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const hint = tokenMissing
        ? "Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local and restart npm run dev."
        : (this.props.fallbackMessage ??
          "Map failed to load. Restart npm run dev after changing .env.local.");

      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-[#1e293b] bg-[#0A0F1E] p-8 text-center">
          <p className="font-display text-lg text-white">Map unavailable</p>
          <p className="mt-2 max-w-md text-sm text-[#94A3B8]">{hint}</p>
          {!tokenMissing && this.state.errorMessage ? (
            <p className="mt-3 max-w-md font-mono text-xs text-[#64748B]">{this.state.errorMessage}</p>
          ) : null}
        </div>
      );
    }

    return this.props.children;
  }
}
