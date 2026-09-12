"use client";

import RecipientSelector from "@/components/common/RecipientSelector";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useId, useMemo, useRef, useState } from "react";
import { getAddress, isAddress } from "viem";
import { collectProfileWallets } from "./collect-recipient.helpers";

const keepProfile = (_profile: CommunityMemberMinimal | null) => undefined;

export default function CollectTdhTargetDelivery({
  profile,
  value,
  onChange,
}: {
  readonly profile: ApiIdentity;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const locale = useBrowserLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const identity = useMemo(
    () => ({ ...profile, wallets: collectProfileWallets(profile) }),
    [profile]
  );
  const selectedProfile = useMemo<CommunityMemberMinimal>(
    () => ({
      profile_id: profile.id,
      handle: profile.handle,
      normalised_handle: profile.normalised_handle,
      primary_wallet: profile.primary_wallet,
      display: profile.display,
      tdh: profile.tdh,
      level: profile.level,
      cic_rating: profile.cic,
      wallet: profile.primary_wallet,
      pfp: profile.pfp,
    }),
    [profile]
  );
  const address = isAddress(value) ? getAddress(value) : null;
  const own = identity.wallets.find(
    (wallet) => wallet.wallet.toLowerCase() === value.toLowerCase()
  );
  const display =
    own?.display && !isAddress(own.display)
      ? own.display
      : address
        ? `${address.slice(0, 6)}…${address.slice(-4)}`
        : t(locale, "collect.buy.chooseDelivery");
  return (
    <div className="tw-max-w-xl tw-space-y-2">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-xs tw-text-iron-400">
        <span>{t(locale, "collect.buy.deliverTo")}</span>
        <span
          title={address ?? undefined}
          className="tw-break-all tw-text-iron-100"
        >
          {display}
        </span>
        <span aria-hidden="true">·</span>
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-wallets`}
          onClick={() => setOpen((value) => !value)}
          className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-xs tw-text-iron-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "collect.buy.changeDelivery")}
        </button>
      </div>
      {open && (
        <div
          id={`${id}-wallets`}
          role="group"
          aria-label={t(locale, "collect.recipient.chooseWallet")}
          className="tw-max-w-xl tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-p-4"
        >
          <RecipientSelector
            open
            selectedProfile={selectedProfile}
            resolvedIdentity={identity}
            selectedWallet={value || null}
            onProfileSelect={keepProfile}
            onWalletSelect={(wallet) => {
              if (
                wallet &&
                identity.wallets.some(
                  (own) => own.wallet.toLowerCase() === wallet.toLowerCase()
                )
              ) {
                onChange(getAddress(wallet));
                setOpen(false);
                trigger.current?.focus();
              }
            }}
            showLabel={false}
            allowProfileChange={false}
            disableSingleWalletSelection
            showSelectedProfileCard={false}
            locale={locale}
          />
        </div>
      )}
      <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, "collect.tdhTarget.profileDelivery")}
      </p>
    </div>
  );
}
