"use client";

import RecipientSelector from "@/components/common/RecipientSelector";
import Button from "@/components/utils/button/Button";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useState } from "react";
import { isAddress } from "viem";
import { COLLECT_INPUT_CLASS } from "./CollectGoalForm";

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

const keepOwnProfile = (_profile: CommunityMemberMinimal | null) => undefined;

export default function CollectRecipientPicker({
  profile,
  value,
  invalid,
  errorId,
  onChange,
}: {
  readonly profile: ApiIdentity | null;
  readonly value: string;
  readonly invalid: boolean;
  readonly errorId: string;
  readonly onChange: (address: string) => void;
}) {
  const locale = useBrowserLocale();
  const [otherProfile, setOtherProfile] =
    useState<CommunityMemberMinimal | null>(null);
  const [chosenMode, setChosenMode] = useState<"profile" | "other" | null>(
    null
  );
  const isOwnWallet = Boolean(
    profile?.wallets?.some((wallet) => areEqualAddresses(wallet.wallet, value))
  );
  const defaultMode = profile && (isOwnWallet || !value) ? "profile" : "other";
  const mode = chosenMode ?? defaultMode;
  const ownProfile = profile ? asRecipientProfile(profile) : null;
  const changeMode = (nextMode: "profile" | "other") => {
    setChosenMode(nextMode);
    setOtherProfile(null);
    if (
      (nextMode === "profile" && !isOwnWallet) ||
      (nextMode === "other" && isOwnWallet)
    )
      onChange("");
  };
  return (
    <div className="tw-space-y-3">
      <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
        {t(locale, "collect.trade.recipient")}
      </p>
      <div
        role="group"
        aria-label={t(locale, "collect.recipient.mode")}
        className="tw-flex tw-flex-wrap tw-gap-2"
      >
        {ownProfile && (
          <Button
            variant={mode === "profile" ? "primary" : "secondary"}
            size="sm"
            className="tw-min-h-11"
            aria-pressed={mode === "profile"}
            onClick={() => changeMode("profile")}
          >
            {t(locale, "collect.recipient.myProfile")}
          </Button>
        )}
        <Button
          variant={mode === "other" ? "primary" : "secondary"}
          size="sm"
          className="tw-min-h-11"
          aria-pressed={mode === "other"}
          onClick={() => changeMode("other")}
        >
          {t(locale, "collect.recipient.other")}
        </Button>
      </div>
      {mode === "profile" && ownProfile && (
        <RecipientSelector
          open
          selectedProfile={ownProfile}
          selectedWallet={value || null}
          onProfileSelect={keepOwnProfile}
          onWalletSelect={(wallet) => onChange(wallet ?? "")}
          allowProfileChange={false}
          showSelectedProfileCard={false}
          label={t(locale, "collect.recipient.chooseWallet")}
          locale={locale}
        />
      )}
      {mode === "other" && (
        <>
          <RecipientSelector
            open
            selectedProfile={otherProfile}
            selectedWallet={value || null}
            onProfileSelect={(selected) => {
              setOtherProfile(selected);
              onChange("");
            }}
            onWalletSelect={(wallet) => onChange(wallet ?? "")}
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
            {value}
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
