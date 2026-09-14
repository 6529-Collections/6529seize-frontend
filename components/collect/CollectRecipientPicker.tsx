"use client";

import RecipientSelector from "@/components/common/RecipientSelector";
import TransferModalPfp from "@/components/nft-transfer/TransferModalPfp";
import Button from "@/components/utils/button/Button";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useId, useMemo, useState } from "react";
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

function RecipientProfileContext({
  profile,
}: {
  readonly profile: CommunityMemberMinimal;
}) {
  const locale = useBrowserLocale();
  const hasLevel = Number.isInteger(profile.level) && profile.level >= 0;
  const hasTdh = Number.isFinite(profile.tdh) && profile.tdh >= 0;
  const name = [profile.handle, profile.display].find((value) => value?.trim());
  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
      {hasLevel && (
        <div aria-hidden="true" className="tw-shrink-0">
          <TransferModalPfp src={profile.pfp} alt="" level={profile.level} />
        </div>
      )}
      <div className="tw-min-w-0 tw-flex-1">
        {name && (
          <bdi className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100 [overflow-wrap:anywhere]">
            {name}
          </bdi>
        )}
        <div className="tw-flex tw-flex-wrap tw-gap-x-3 tw-text-xs tw-tabular-nums tw-leading-5 tw-text-iron-400">
          {hasLevel && (
            <span>
              {t(locale, "collect.recipient.profileLevel", {
                level: formatInteger(locale, profile.level),
              })}
            </span>
          )}
          {hasTdh && (
            <span>
              {t(locale, "collect.recipient.profileTdh", {
                tdh: formatInteger(locale, profile.tdh),
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CollectRecipientPicker({
  profile,
  payingWallet,
  value,
  invalid,
  errorId,
  onChange,
  compact = false,
}: {
  readonly profile: ApiIdentity | null;
  readonly payingWallet?: string;
  readonly value: string;
  readonly invalid: boolean;
  readonly errorId: string;
  readonly onChange: (address: string) => void;
  readonly compact?: boolean;
}) {
  const locale = useBrowserLocale();
  const walletContextPrefix = useId();
  const [otherProfile, setOtherProfile] =
    useState<CommunityMemberMinimal | null>(null);
  const [searchRevision, setSearchRevision] = useState(0);
  const [focusSearch, setFocusSearch] = useState(false);
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
    setFocusSearch(false);
    setOtherProfile(null);
    onChange(
      nextMode === "profile"
        ? defaultCollectRecipient(profile, payingWallet)
        : ""
    );
  };
  return (
    <div className="tw-space-y-3">
      {!compact && (
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
          {t(locale, "collect.trade.recipient")}
        </p>
      )}
      <div
        role="group"
        aria-label={t(locale, "collect.recipient.mode")}
        className={`tw-grid ${compact ? "tw-gap-2" : "tw-gap-0"} ${profile ? "tw-grid-cols-2" : "tw-grid-cols-1"}`}
      >
        {profile && (
          <Button
            variant={!compact && mode === "profile" ? "primary" : "secondary"}
            size="sm"
            className={`tw-min-h-11 tw-w-full tw-rounded-md tw-font-normal ${compact ? "!tw-border-white/10 !tw-bg-transparent !tw-px-2 !tw-text-[13px] aria-pressed:!tw-bg-white/[0.06] aria-pressed:!tw-text-white" : ""}`}
            aria-pressed={mode === "profile"}
            onClick={() => changeMode("profile")}
          >
            {t(locale, "collect.recipient.myProfile")}
          </Button>
        )}
        <Button
          variant={!compact && mode === "other" ? "primary" : "secondary"}
          size="sm"
          className={`tw-min-h-11 tw-w-full tw-rounded-md tw-font-normal ${compact ? "!tw-border-white/10 !tw-bg-transparent !tw-px-2 !tw-text-[13px] aria-pressed:!tw-bg-white/[0.06] aria-pressed:!tw-text-white" : ""}`}
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
          {compact && (
            <div className="tw-mb-3 tw-px-2">
              <RecipientProfileContext profile={ownProfile} />
            </div>
          )}
          {compact && ownIdentity.wallets.length > 0 && (
            <div className="tw-space-y-1">
              {ownIdentity.wallets.map((wallet) => {
                const selected = areEqualAddresses(wallet.wallet, value);
                const display =
                  typeof wallet.display === "string"
                    ? wallet.display.trim()
                    : "";
                const walletTdh = profile?.wallets?.find((entry) =>
                  areEqualAddresses(entry.wallet, wallet.wallet)
                )?.tdh;
                const walletContext =
                  typeof walletTdh === "number" &&
                  Number.isFinite(walletTdh) &&
                  walletTdh >= 0
                    ? t(locale, "collect.recipient.walletTdh", {
                        tdh: formatInteger(locale, walletTdh),
                      })
                    : undefined;
                return (
                  <button
                    key={wallet.wallet}
                    type="button"
                    aria-pressed={selected}
                    aria-label={
                      display ? `${display} ${wallet.wallet}` : wallet.wallet
                    }
                    aria-describedby={
                      walletContext
                        ? `${walletContextPrefix}-${wallet.wallet}`
                        : undefined
                    }
                    onClick={() => onChange(wallet.wallet)}
                    className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-2 tw-text-left aria-pressed:tw-bg-white/[0.04] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/[0.04]"
                  >
                    <span className="tw-min-w-0 tw-flex-1">
                      {display && !isAddress(display, { strict: false }) && (
                        <bdi className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100 [overflow-wrap:anywhere]">
                          {display}
                        </bdi>
                      )}
                      <code
                        aria-hidden="true"
                        dir="ltr"
                        className="tw-block tw-break-all tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-400"
                      >
                        {`${wallet.wallet.slice(0, 6)}…${wallet.wallet.slice(-4)}`}
                      </code>
                      {walletContext && (
                        <span
                          id={`${walletContextPrefix}-${wallet.wallet}`}
                          className="tw-block tw-text-xs tw-tabular-nums tw-leading-5 tw-text-iron-400"
                        >
                          {walletContext}
                        </span>
                      )}
                    </span>
                    {selected && (
                      <CheckIcon
                        aria-hidden="true"
                        className="tw-size-4 tw-shrink-0 tw-text-iron-200"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {!compact && ownIdentity.wallets.length > 0 && (
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
          )}
          {ownIdentity.wallets.length === 0 && (
            <p role="status" className="tw-m-0 tw-text-xs tw-text-iron-400">
              {t(locale, "collect.recipient.walletsUnavailable")}
            </p>
          )}
        </div>
      )}
      {mode === "other" && (
        <div
          className={
            compact
              ? "tw-min-w-0 tw-space-y-3 [overflow-wrap:anywhere] [&_.tw-font-bold]:!tw-font-normal [&_.tw-tracking-wider]:tw-tracking-normal [&_.tw-uppercase]:tw-normal-case [&_button>div]:tw-max-w-full [&_button>div]:!tw-font-normal [&_button]:tw-min-h-11 [&_button]:tw-min-w-0 [&_button]:tw-rounded-lg [&_button]:tw-text-left [&_input]:tw-rounded-lg"
              : "tw-space-y-3"
          }
        >
          {compact && otherProfile && (
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-3">
              <div className="tw-min-w-0 tw-flex-1">
                <RecipientProfileContext profile={otherProfile} />
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtherProfile(null);
                  setFocusSearch(true);
                  setSearchRevision((revision) => revision + 1);
                  onChange("");
                }}
                className="tw-shrink-0 tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {t(locale, "collect.buy.changeDelivery")}
              </button>
            </div>
          )}
          <RecipientSelector
            key={searchRevision}
            open
            autoFocusSearch={compact && focusSearch}
            selectedProfile={otherProfile}
            selectedWallet={value || null}
            onProfileSelect={(selected) => {
              setChosenMode("other");
              setOtherProfile(selected);
              onChange("");
            }}
            onWalletSelect={(wallet) =>
              onChange(wallet && isAddress(wallet) ? getAddress(wallet) : "")
            }
            label={t(locale, "collect.recipient.search")}
            showLabel={!compact || !otherProfile}
            // A new lookup clears the old destination before its results arrive.
            {...(compact
              ? {
                  onSearchChange: () => {
                    setChosenMode("other");
                    onChange("");
                  },
                }
              : {})}
            showSelectedProfileCard={!compact}
            showWalletTdh={compact}
            locale={locale}
          />
          {(!compact || !otherProfile) && (
            <label className="tw-block tw-space-y-2 tw-text-xs tw-text-iron-300">
              <span>{t(locale, "collect.recipient.direct")}</span>
              <input
                autoComplete="off"
                spellCheck={false}
                maxLength={42}
                value={value}
                onChange={(event) => {
                  setChosenMode("other");
                  setOtherProfile(null);
                  setFocusSearch(false);
                  setSearchRevision((revision) => revision + 1);
                  onChange(event.target.value);
                }}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                className={`${COLLECT_INPUT_CLASS} tw-font-mono tw-text-xs`}
              />
            </label>
          )}
        </div>
      )}
      {!compact && isAddress(value) && (
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
