"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useIdentityMovePhase } from "@/hooks/useIdentityMovePhase";
import { t } from "@/i18n/messages";
import { getIdentityFreezeAtMs } from "@/lib/identity-move/schedule";
import IdentityMoveCallout from "./IdentityMoveCallout";
import {
  formatIdentityMoveDay,
  formatIdentityMoveTime,
} from "./identityMoveFormat";

/**
 * Tells Delegation Center visitors that NFTDelegation registrations stop
 * counting for 6529 at the freeze, and that their delegations and
 * consolidations as of then moved to the 6529 Network. Renders nothing
 * unless NEXT_PUBLIC_IDENTITY_FREEZE_AT is set.
 */
export default function NftDelegationMoveNotice({
  className = "",
}: {
  readonly className?: string;
}) {
  const locale = useBrowserLocale();
  // Subscribing keeps the notice in step with the other move notices.
  const phase = useIdentityMovePhase();
  const freezeAtMs = getIdentityFreezeAtMs();

  if (phase === "none" || freezeAtMs === null) {
    return null;
  }

  return (
    <IdentityMoveCallout
      label={t(locale, "identityMove.nftDelegation.label")}
      text={t(locale, "identityMove.nftDelegation.notice", {
        freezeDay: formatIdentityMoveDay(locale, freezeAtMs),
        freezeTime: formatIdentityMoveTime(locale, freezeAtMs),
      })}
      testId="nft-delegation-move-notice"
      className={className}
    />
  );
}
