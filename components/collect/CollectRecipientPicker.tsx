"use client";

import RecipientSelector from "@/components/common/RecipientSelector";
import Button from "@/components/utils/button/Button";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useMemo, useState } from "react";
import { getAddress, isAddress } from "viem";
import { COLLECT_INPUT_CLASS } from "./CollectGoalForm";
import {
  collectProfileWallets,
  defaultCollectRecipient,
} from "./collect-recipient.helpers";

const keepOwnProfile = (_profile: CommunityMemberMinimal | null) => undefined;

function asRecipientProfile(profile: ApiIdentity): CommunityMemberMinimal {
  return {
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
  };
}

export default function CollectRecipientPicker({
  profile,
  payingWallet,
  value,
  invalid,
  errorId,
  onChange,
}: {
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string;
  readonly value: string;
  readonly invalid: boolean;
  readonly errorId: string;
  readonly onChange: (address: string) => void;
}) {
  const locale = useBrowserLocale();
  const [otherProfile, setOtherProfile] =
    useState<CommunityMemberMinimal | null>(null);
  const [searchRevision, setSearchRevision] = useState(0);
  const [chosenMode, setChosenMode] = useState<"profile" | "other" | null>(
    null
  );
  const ownIdentity = useMemo(
    () =>
      profile
        ? {
            ...profile,
            wallets: collectProfileWallets(profile),
          }
        : null,
    [profile]
  );
  const ownProfile = useMemo(
    () => (ownIdentity ? asRecipientProfile(ownIdentity) : null),
    [ownIdentity]
  );
  const isOwnWallet = ownIdentity?.wallets.some((wallet) =>
    areEqualAddresses(wallet.wallet, value)
  );
  const defaultMode = profile && (isOwnWallet || !value) ? "profile" : "other";
  const mode = chosenMode ?? defaultMode;
  const changeMode = (nextMode: "profile" | "other") => {
    if (nextMode === mode) return;
    setChosenMode(nextMode);
    setOtherProfile(null);
    onChange(
      nextMode === "profile"
        ? defaultCollectRecipient(profile, payingWallet)
        : ""
    );
  };
  return (
    <div className="tw-space-y-3">
      <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
        {t(locale, "collect.trade.recipient")}
      </p>
      <div
        role="group"
        aria-label={t(locale, "collect.recipient.mode")}
        className={`tw-grid tw-gap-0 ${profile ? "tw-grid-cols-2" : "tw-grid-cols-1"}`}
      >
        {profile && (
          <Button
            variant={mode === "profile" ? "primary" : "secondary"}
            size="sm"
            className="tw-min-h-11 tw-w-full tw-rounded-md tw-font-normal"
            aria-pressed={mode === "profile"}
            onClick={() => changeMode("profile")}
          >
            {t(locale, "collect.recipient.myProfile")}
          </Button>
        )}
        <Button
          variant={mode === "other" ? "primary" : "secondary"}
          size="sm"
          className="tw-min-h-11 tw-w-full tw-rounded-md tw-font-normal"
          aria-pressed={mode === "other"}
          onClick={() => changeMode("other")}
        >
          {t(locale, "collect.recipient.other")}
        </Button>
      </div>
      {mode === "profile" && ownIdentity && ownProfile && (
        <div
          role="group"
          aria-label={t(locale, "collect.recipient.chooseWallet")}
          aria-describedby={invalid ? errorId : undefined}
          className="tw-pb-1 tw-pt-2"
        >
          {ownIdentity.wallets.length > 0 ? (
            <RecipientSelector
              open
              selectedProfile={ownProfile}
              resolvedIdentity={ownIdentity}
              selectedWallet={value || null}
              onProfileSelect={keepOwnProfile}
              onWalletSelect={(wallet) => onChange(wallet ?? "")}
              showLabel={false}
              allowProfileChange={false}
              disableSingleWalletSelection
              showSelectedProfileCard={false}
              locale={locale}
            />
          ) : (
            <p role="status" className="tw-m-0 tw-text-xs tw-text-iron-400">
              {t(locale, "collect.recipient.walletsUnavailable")}
            </p>
          )}
        </div>
      )}
      {mode === "other" && (
        <>
          <RecipientSelector
            key={searchRevision}
            open
            autoFocusSearch={false}
            selectedProfile={otherProfile}
            selectedWallet={value || null}
            onProfileSelect={(selected) => {
              setOtherProfile(selected);
              onChange("");
            }}
            onWalletSelect={(wallet) =>
              onChange(wallet && isAddress(wallet) ? getAddress(wallet) : "")
            }
            label={t(locale, "collect.recipient.search")}
            locale={locale}
          />
          <label className="tw-block tw-space-y-2 tw-text-xs tw-text-iron-300">
            <span>{t(locale, "collect.recipient.direct")}</span>
            <input
              autoComplete="off"
              spellCheck={false}
              maxLength={42}
              value={value}
              onChange={(event) => {
                setOtherProfile(null);
                setSearchRevision((revision) => revision + 1);
                onChange(event.target.value);
              }}
              aria-invalid={invalid}
              aria-describedby={invalid ? errorId : undefined}
              className={`${COLLECT_INPUT_CLASS} tw-font-mono tw-text-xs`}
            />
          </label>
        </>
      )}
      {isAddress(value) && (
        <div className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-3">
          <p className="tw-m-0 tw-break-all tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-200">
            {getAddress(value)}
          </p>
          <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
            {t(
              locale,
              isOwnWallet
                ? "collect.recipient.inProfile"
                : "collect.recipient.external"
            )}
          </p>
        </div>
      )}
    </div>
  );
}
