import { Badge } from "@/components/ui/badge";

interface SimulationStatusProps {
  iotEnabled: boolean;
  driverEnabled: boolean;
  anomalyDemo: boolean;
}

export function SimulationStatus({ iotEnabled, driverEnabled, anomalyDemo }: SimulationStatusProps) {
  const anyOn = iotEnabled || driverEnabled;

  if (!anyOn) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4">
      <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">Demo simulations</p>
      <p className="mt-1 text-sm text-[#94A3B8]">
        Cron or local scripts are updating telemetry without physical hardware.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {iotEnabled ? <Badge variant="success">IoT fill levels</Badge> : null}
        {driverEnabled ? <Badge variant="success">Fleet GPS</Badge> : null}
        {anomalyDemo ? <Badge variant="warning">Anomaly demo</Badge> : null}
      </div>
      <p className="mt-2 font-mono text-xs text-[#64748B]">
        npm run simulate:all · /api/iot-simulate · /api/driver-simulate
      </p>
    </div>
  );
}
