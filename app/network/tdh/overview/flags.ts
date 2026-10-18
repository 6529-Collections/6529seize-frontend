/**
 * The network's distribution of TDH as one area (EXPLAINED.md §4.1 and
 * §13.8; SCORECARD.md §7): an owner item. It is built and tested, and off
 * until it is switched on here. `?distribution=on` shows it on any page
 * render, so it can be reviewed before it ships; `?distribution=off` hides
 * it once it is on.
 */
const NETWORK_DISTRIBUTION_ON_BY_DEFAULT = false;

export function showNetworkDistribution(param: string | undefined): boolean {
  if (param === "on") return true;
  if (param === "off") return false;
  return NETWORK_DISTRIBUTION_ON_BY_DEFAULT;
}
