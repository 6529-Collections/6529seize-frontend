"use client";

import { useState } from "react";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { useAuth } from "@/components/auth/Auth";
import GroupCreateIdentitySelectedItems from "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems";
import GroupCreateIdentitiesSearch from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch";
import type { GroupCreateIdentitiesSearchResultsLayout } from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItems";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { MessageKey } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import {
  GROUP_EXCLUDE_LIMIT,
  GROUP_INCLUDE_LIMIT,
} from "@/services/groups/groupMutations";
import { getInlineGroupIdentityFromProfile } from "./createWaveInlineGroupBuilder";
import {
  getInlineIdentityAddresses,
  type CreateWaveInlineGroupWalletSources as InlineGroupWalletSources,
} from "./createWaveInlineGroupBuilder";
import { DraftChipButton } from "./CreateWaveInlineGroupButtons";
import CreateWaveInlineGroupWalletSources from "./CreateWaveInlineGroupWalletSources";

type InlineIdentityMode = "included" | "excluded";

interface CreateWaveInlineGroupIdentitiesProps {
  readonly includedIdentities: readonly CommunityMemberMinimal[];
  readonly excludedIdentities: readonly CommunityMemberMinimal[];
  readonly includedWalletSources: InlineGroupWalletSources;
  readonly excludedWalletSources: InlineGroupWalletSources;
  readonly onIncludedIdentitySelect: (identity: CommunityMemberMinimal) => void;
  readonly onIncludedIdentityRemove: (wallet: string) => void;
  readonly onExcludedIdentitySelect: (identity: CommunityMemberMinimal) => void;
  readonly onExcludedIdentityRemove: (wallet: string) => void;
  readonly onIncludedWalletSourcesChange: (
    update: Partial<InlineGroupWalletSources>
  ) => void;
  readonly onExcludedWalletSourcesChange: (
    update: Partial<InlineGroupWalletSources>
  ) => void;
  readonly resultsLayout?: GroupCreateIdentitiesSearchResultsLayout;
}

function getModeConfig(
  mode: InlineIdentityMode,
  props: CreateWaveInlineGroupIdentitiesProps
) {
  if (mode === "included") {
    return {
      activeIdentities: props.includedIdentities,
      activeWalletSources: props.includedWalletSources,
      onWalletSourcesChange: props.onIncludedWalletSourcesChange,
      onIdentitySelect: props.onIncludedIdentitySelect,
      onRemove: props.onIncludedIdentityRemove,
      identityLimit: GROUP_INCLUDE_LIMIT,
      emptyHelperKey:
        "waves.create.groups.inlineIdentities.included.emptyHelper",
      searchLabelKey:
        "waves.create.groups.inlineIdentities.included.searchLabel",
      searchPlaceholderKey:
        "waves.create.groups.inlineIdentities.included.searchPlaceholder",
    } as const;
  }

  return {
    activeIdentities: props.excludedIdentities,
    activeWalletSources: props.excludedWalletSources,
    onWalletSourcesChange: props.onExcludedWalletSourcesChange,
    onIdentitySelect: props.onExcludedIdentitySelect,
    onRemove: props.onExcludedIdentityRemove,
    identityLimit: GROUP_EXCLUDE_LIMIT,
    emptyHelperKey: "waves.create.groups.inlineIdentities.excluded.emptyHelper",
    searchLabelKey: "waves.create.groups.inlineIdentities.excluded.searchLabel",
    searchPlaceholderKey:
      "waves.create.groups.inlineIdentities.excluded.searchPlaceholder",
  } as const;
}

function getIdentityTotalMessageKey({
  mode,
  count,
}: {
  readonly mode: InlineIdentityMode;
  readonly count: number;
}): MessageKey {
  if (mode === "included") {
    return count === 1
      ? "waves.create.groups.inlineIdentities.sources.total.included.one"
      : "waves.create.groups.inlineIdentities.sources.total.included.other";
  }

  return count === 1
    ? "waves.create.groups.inlineIdentities.sources.total.excluded.one"
    : "waves.create.groups.inlineIdentities.sources.total.excluded.other";
}

export default function CreateWaveInlineGroupIdentities(
  props: CreateWaveInlineGroupIdentitiesProps
) {
  const {
    includedIdentities,
    excludedIdentities,
    includedWalletSources,
    excludedWalletSources,
    onIncludedIdentitySelect,
    onIncludedIdentityRemove,
    resultsLayout = "popover",
  } = props;
  const { connectedProfile } = useAuth();
  const locale = useBrowserLocale();
  const [mode, setMode] = useState<InlineIdentityMode>("included");
  const isIncludedMode = mode === "included";
  const {
    activeIdentities,
    activeWalletSources,
    onWalletSourcesChange,
    onIdentitySelect,
    onRemove,
    identityLimit,
    emptyHelperKey,
    searchLabelKey,
    searchPlaceholderKey,
  } = getModeConfig(mode, props);
  const selectedWallets =
    getInlineIdentityAddresses(activeIdentities, activeWalletSources) ?? [];
  const currentUserIdentity =
    getInlineGroupIdentityFromProfile(connectedProfile);
  const isCurrentUserIncluded =
    !!currentUserIdentity &&
    (
      getInlineIdentityAddresses(includedIdentities, includedWalletSources) ??
      []
    ).some((wallet) => areEqualAddresses(wallet, currentUserIdentity.wallet));
  const isCurrentUserExcluded =
    !!currentUserIdentity &&
    (
      getInlineIdentityAddresses(excludedIdentities, excludedWalletSources) ??
      []
    ).some((wallet) => areEqualAddresses(wallet, currentUserIdentity.wallet));
  const identitiesHelperText = t(locale, emptyHelperKey);
  const searchLabel = t(locale, searchLabelKey);
  const searchPlaceholder = t(locale, searchPlaceholderKey);
  const isOverIdentityLimit = selectedWallets.length > identityLimit;
  const totalKey = getIdentityTotalMessageKey({
    mode,
    count: selectedWallets.length,
  });
  const showIdentityControlsRow =
    activeIdentities.length > 0 ||
    selectedWallets.length === 0 ||
    (isIncludedMode && !!currentUserIdentity);
  const showCurrentUserExcludedWarning =
    !!currentUserIdentity &&
    (isCurrentUserExcluded ||
      (includedIdentities.length > 0 && !isCurrentUserIncluded));

  const onCurrentUserToggle = (checked: boolean) => {
    if (!currentUserIdentity) {
      return;
    }

    if (checked) {
      if (!isCurrentUserIncluded) {
        onIncludedIdentitySelect(currentUserIdentity);
      }
      return;
    }

    if (isCurrentUserIncluded) {
      onIncludedIdentityRemove(currentUserIdentity.wallet);
    }
  };

  return (
    <div className="tw-space-y-5">
      <div
        role="group"
        aria-label={t(locale, "waves.create.groups.inlineIdentities.modeLabel")}
        className="tw-flex tw-flex-wrap tw-gap-1.5"
      >
        <DraftChipButton
          label={t(
            locale,
            "waves.create.groups.inlineIdentities.included.label"
          )}
          active={isIncludedMode}
          isToggle={true}
          onClick={() => setMode("included")}
        />
        <DraftChipButton
          label={t(
            locale,
            "waves.create.groups.inlineIdentities.excluded.label"
          )}
          active={!isIncludedMode}
          isToggle={true}
          onClick={() => setMode("excluded")}
        />
      </div>

      <div className="tw-space-y-4">
        <GroupCreateIdentitiesSearch
          key={mode}
          selectedWallets={selectedWallets}
          onIdentitySelect={onIdentitySelect}
          label={searchLabel}
          placeholder={searchPlaceholder}
          hideLabel={true}
          inputClassName="tw-border-white/10 tw-bg-iron-950 tw-ring-white/10 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 focus:tw-border-primary-400 focus:tw-bg-iron-950 focus:tw-ring-primary-400"
          iconClassName="tw-text-iron-500"
          resultsLayout={resultsLayout}
          sort="level"
        />
        {showIdentityControlsRow && (
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
            {activeIdentities.length > 0 && (
              <GroupCreateIdentitySelectedItems
                selectedIdentities={[...activeIdentities]}
                onRemove={onRemove}
                variant="inline"
              />
            )}
            {selectedWallets.length === 0 && (
              <p className="tw-m-0 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-500">
                {identitiesHelperText}
              </p>
            )}
            {isIncludedMode && currentUserIdentity && (
              <label className="tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-x-2 sm:tw-gap-x-3">
                <span className="tw-text-xs tw-font-semibold tw-text-iron-50">
                  {t(locale, "waves.create.groups.inlineIdentities.includeMe")}
                </span>
                <span
                  className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] ${
                    isCurrentUserIncluded
                      ? "tw-from-primary-300"
                      : "tw-from-iron-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    role="switch"
                    checked={isCurrentUserIncluded}
                    onChange={(event) =>
                      onCurrentUserToggle(event.target.checked)
                    }
                    className="tw-peer tw-sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`tw-relative tw-flex tw-h-5 tw-w-9 tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-p-0 tw-transition-colors tw-duration-200 tw-ease-in-out peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-500 peer-focus-visible:tw-ring-offset-2 ${
                      isCurrentUserIncluded
                        ? "tw-bg-primary-500"
                        : "tw-bg-iron-700"
                    }`}
                  >
                    <span
                      className={`tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${
                        isCurrentUserIncluded
                          ? "tw-translate-x-[18px]"
                          : "tw-translate-x-0"
                      }`}
                    />
                  </span>
                </span>
              </label>
            )}
          </div>
        )}
      </div>
      <CreateWaveInlineGroupWalletSources
        direction={mode}
        sources={activeWalletSources}
        onChange={onWalletSourcesChange}
      />
      <div
        role="status"
        className={`tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-leading-relaxed ${
          isOverIdentityLimit
            ? "tw-border-error/30 tw-bg-error/10 tw-text-error"
            : "tw-border-white/5 tw-bg-iron-950/60 tw-text-iron-300"
        }`}
      >
        <p className="tw-m-0">
          {t(locale, totalKey, {
            count: formatInteger(locale, selectedWallets.length),
          })}
        </p>
        {isOverIdentityLimit ? (
          <p className="tw-mb-0 tw-mt-1">
            {t(
              locale,
              isIncludedMode
                ? "waves.create.groups.inlineIdentities.sources.includeLimit"
                : "waves.create.groups.inlineIdentities.sources.excludeLimit",
              { limit: formatInteger(locale, identityLimit) }
            )}
          </p>
        ) : null}
      </div>
      {showCurrentUserExcludedWarning && (
        <p
          role="status"
          aria-live="polite"
          className="tw-m-0 tw-rounded-lg tw-border tw-border-solid tw-border-[#fef08a]/20 tw-bg-[#fef08a]/10 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-leading-relaxed tw-text-[#fef08a]"
        >
          {t(
            locale,
            "waves.create.groups.inlineIdentities.creatorExcludedWarning"
          )}
        </p>
      )}
    </div>
  );
}
