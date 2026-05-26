import { useId } from "react";

/** Unique Realtime channel name — avoids duplicate `postgres_changes` on the same topic. */
export function useRealtimeChannelName(prefix: string, key: string) {
  const instanceId = useId().replace(/:/g, "");
  return `${prefix}_${key}_${instanceId}`;
}
