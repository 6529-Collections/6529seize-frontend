/**
 * The network's distribution of TDH as one area (EXPLAINED.md §4.1 and
 * §13.8; SCORECARD.md §7): an owner item. The owner approved it on
 * 2026-10-18 ("spread important"), so it is on by default; it must stay
 * honest about concentration. `?distribution=off` hides it on one render,
 * for a review without it; `?distribution=on` shows it if the default is
 * ever turned off again.
 */
const NETWORK_DISTRIBUTION_ON_BY_DEFAULT = true;

export function showNetworkDistribution(param: string | undefined): boolean {
  if (param === "on") return true;
  if (param === "off") return false;
  return NETWORK_DISTRIBUTION_ON_BY_DEFAULT;
}
