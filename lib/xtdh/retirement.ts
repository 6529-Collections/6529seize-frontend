import type { IdentityMovePhase } from "@/lib/identity-move/schedule";

/**
 * xTDH is retired when identities move to the 6529 Network; the network
 * takes no xTDH and no grants over.
 *
 * - `live`: before the freeze, or with no freeze set. xTDH works as before.
 * - `closing`: the day between the freeze and the identity switch-on.
 *   Grants can't be created or changed; the xTDH pages say xTDH is being
 *   retired.
 * - `retired`: from the identity switch-on. The site shows no xTDH figures
 *   and no grant controls; the xTDH pages say xTDH was retired.
 */
export type XtdhRetirement = "live" | "closing" | "retired";

export function xtdhRetirementOf(phase: IdentityMovePhase): XtdhRetirement {
  switch (phase) {
    case "frozen":
      return "closing";
    case "moved":
      return "retired";
    default:
      return "live";
  }
}
