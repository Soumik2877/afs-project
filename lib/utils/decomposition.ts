import { differenceInCalendarDays } from "date-fns";

const ORGANIC_MATURATION_DAYS = 90;

export function decompositionProgressPercent(depositedAt: string, estimatedReadyAt: string) {
  const start = Date.parse(depositedAt);

  const end = Date.parse(estimatedReadyAt);

  const now = Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;

  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));

  return Math.round(pct);
}

export function daysUntilOrganicReady(depositedAt: Date) {
  const readyDate = new Date(depositedAt);

  readyDate.setDate(readyDate.getDate() + ORGANIC_MATURATION_DAYS);

  const diff = differenceInCalendarDays(readyDate, new Date());

  return Math.max(diff, 0);
}
