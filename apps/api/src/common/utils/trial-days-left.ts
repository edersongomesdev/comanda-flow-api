export function calculateTrialDaysLeft(trialEndsAt: Date | null): number {
  if (!trialEndsAt) {
    return 0;
  }

  const diffMs = trialEndsAt.getTime() - Date.now();
  if (diffMs <= 0) {
    return 0;
  }

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
