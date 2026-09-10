const MASTER_ASPECT_RATIO = 3;

export const journeyStops = {
  welcome: 0,
  difference: 0.12,
  register: 0.24,
  stepStart: 0.34,
  stepEnd: 0.88,
  completion: 1,
} as const;

export function journeyOffset(
  progress: number,
  viewportWidth: number,
  viewportHeight: number,
): { width: number; translateX: number } {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const width = Math.max(viewportWidth, viewportHeight * MASTER_ASPECT_RATIO);
  const travel = width - viewportWidth;

  return { width, translateX: -travel * clampedProgress };
}

export function stepJourneyProgress(current: number, total: number): number {
  if (total <= 1) return journeyStops.stepStart;

  const stepProgress = Math.min(1, Math.max(0, (current - 1) / (total - 1)));
  if (stepProgress === 0) return journeyStops.stepStart;
  if (stepProgress === 1) return journeyStops.stepEnd;

  return journeyStops.stepStart + stepProgress * (journeyStops.stepEnd - journeyStops.stepStart);
}
