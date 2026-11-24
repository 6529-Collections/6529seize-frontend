"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useChainIdentityActive } from "@/hooks/useIdentityMovePhase";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/chain-identity";

/**
 * Under the REP and NIC forms once ratings are on the 6529 Network: who
 * signs and where the fee comes from, since the form shows no fee step.
 */
export default function ChainRatingNote() {
  const active = useChainIdentityActive();
  const locale = useBrowserLocale();
  if (!active) {
    return null;
  }
  return (
    <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-400">
      {t(locale, "chainIdentity.rating.formNote")}
    </p>
  );
}
