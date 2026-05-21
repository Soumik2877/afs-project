import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnomalyAlertProps {
  title: string;
  description: string;
  severity?: "critical" | "warning";
}

export function AnomalyAlert({ title, description, severity = "warning" }: AnomalyAlertProps) {
  const tone =
    severity === "critical"
      ? "border-red-600/70 bg-[#2b0f16] text-red-300"
      : "border-amber-500/70 bg-[#20170a] text-amber-200";

  return (
    <Card className={`animate-slideIn border-[#1F2937] px-6 py-4 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.08)] transition ${tone}`}>
      <div className="flex items-center gap-4">
        <Badge variant={severity === "critical" ? "danger" : "warning"}>{severity.toUpperCase()}</Badge>
        <div className="space-y-1">
          <p className="font-display text-xl">{title}</p>
          <p className="text-sm">{description}</p>
        </div>
      </div>
    </Card>
  );
}
