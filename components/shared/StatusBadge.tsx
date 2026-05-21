import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

type StatusKey = string;

interface StatusBadgeProps extends BadgeProps {
  status: StatusKey;
}

export function StatusBadge({ status, variant, ...props }: StatusBadgeProps) {
  const inferred: BadgeProps["variant"] =
    variant ??
    (status === "active" || status === "completed" || status === "resolved"
      ? "success"
      : status === "open" || status === "pending"
        ? "neutral"
        : status === "full" || status === "overflow"
          ? "danger"
          : status === "filling" || status === "in_progress"
            ? "warning"
            : "neutral");

  return (
    <Badge {...props} variant={inferred}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
