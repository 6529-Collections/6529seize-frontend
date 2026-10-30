"use client";

import { useState } from "react";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { useAuth } from "@/components/auth/Auth";
import GroupIdentitySelectedList from "@/components/groups/assignment/GroupIdentitySelectedList";
import GroupCreateIdentitiesSearch from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch";
import type { GroupCreateIdentitiesSearchResultsLayout } from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItems";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
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
  readonly simplifyIncludedCopy?: boolean;
  readonly showIdentityTotal?: boolean;
  readonly mobilePresentation?: boolean;
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

function getIdentityLimitMessageKey(mode: InlineIdentityMode): MessageKey {
  return mode === "included"
    ? "waves.create.groups.inlineIdentities.sources.includeLimit"
    : "waves.create.groups.inlineIdentities.sources.excludeLimit";
}

function includesCurrentUser({
  currentUserIdentity,
  identities,
  walletSources,
}: {
  readonly currentUserIdentity: CommunityMemberMinimal | null;
  readonly identities: readonly CommunityMemberMinimal[];
  readonly walletSources: InlineGroupWalletSources;
}) {
  if (!currentUserIdentity) {
    return false;
  }
  const wallets = getInlineIdentityAddresses(identities, walletSources) ?? [];
  return wallets.some((wallet) =>
    areEqualAddresses(wallet, currentUserIdentity.wallet)
  );
}

function updateCurrentUserSelection({
  checked,
  currentUserIdentity,
  isCurrentUserIncluded,
  onIncludedIdentityRemove,
  onIncludedIdentitySelect,
}: {
  readonly checked: boolean;
  readonly currentUserIdentity: CommunityMemberMinimal | null;
  readonly isCurrentUserIncluded: boolean;
  readonly onIncludedIdentityRemove: (wallet: string) => void;
  readonly onIncludedIdentitySelect: (identity: CommunityMemberMinimal) => void;
}) {
  if (!currentUserIdentity) {
    return;
  }
  if (checked && !isCurrentUserIncluded) {
    onIncludedIdentitySelect(currentUserIdentity);
    return;
  }
  if (!checked && isCurrentUserIncluded) {
    onIncludedIdentityRemove(currentUserIdentity.wallet);
  }
}

function CurrentUserSwitch({
  checked,
  label,
  onChange,
}: {
  readonly checked: boolean;
  readonly label: string;
  readonly onChange: (checked: boolean) => void;
}) {
  return (
    <label className="tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-gap-x-2 sm:tw-gap-x-3">
      <span className="tw-text-xs tw-font-semibold tw-text-iron-50">
        {label}
      </span>
      <span
        className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] ${
          checked ? "tw-from-primary-300" : "tw-from-iron-600"
        }`}
      >
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="tw-peer tw-sr-only"
        />
        <span
          aria-hidden="true"
          className={`tw-relative tw-flex tw-h-5 tw-w-9 tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-p-0 tw-transition-colors tw-duration-200 tw-ease-in-out peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-500 peer-focus-visible:tw-ring-offset-2 ${
            checked ? "tw-bg-primary-500" : "tw-bg-iron-700"
          }`}
        >
          <span
            className={`tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${
              checked ? "tw-translate-x-[18px]" : "tw-translate-x-0"
            }`}
          />
        </span>
      </span>
    </label>
  );
}

function IdentityControlsRow({
  activeIdentities,
  currentUserIdentity,
  emptyText,
  includeMeLabel,
  isCurrentUserIncluded,
  isIncludedMode,
  mobilePresentation,
  onCurrentUserToggle,
  onRemove,
  selectedWalletCount,
}: {
  readonly activeIdentities: readonly CommunityMemberMinimal[];
  readonly currentUserIdentity: CommunityMemberMinimal | null;
  readonly emptyText: string | null;
  readonly includeMeLabel: string;
  readonly isCurrentUserIncluded: boolean;
  readonly isIncludedMode: boolean;
  readonly mobilePresentation: boolean;
  readonly onCurrentUserToggle: (checked: boolean) => void;
  readonly onRemove: (wallet: string) => void;
  readonly selectedWalletCount: number;
}) {
  const showRow =
    activeIdentities.length > 0 ||
    (selectedWalletCount === 0 && emptyText !== null) ||
    (isIncludedMode && !!currentUserIdentity);
  if (!showRow) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
      {activeIdentities.length > 0 && (
        <GroupIdentitySelectedList
          identities={activeIdentities}
          mobilePresentation={mobilePresentation}
          onRemove={onRemove}
        />
      )}
      {selectedWalletCount === 0 && emptyText !== null && (
        <p className="tw-m-0 tw-text-xs tw-font-normal tw-text-iron-400">
          {emptyText}
        </p>
      )}
      {isIncludedMode && currentUserIdentity && (
        <CurrentUserSwitch
          checked={isCurrentUserIncluded}
          label={includeMeLabel}
          onChange={onCurrentUserToggle}
        />
      )}
    </div>
  );
}

function IdentityStatus({
  isOverIdentityLimit,
  limitText,
  totalText,
}: {
  readonly isOverIdentityLimit: boolean;
  readonly limitText: string | null;
  readonly totalText: string | null;
}) {
  if (totalText === null && limitText === null) return null;

  const toneClasses = isOverIdentityLimit
    ? "tw-text-error"
    : "tw-text-iron-400";

  return (
    <div
      role="status"
      className={`tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-2 tw-text-xs tw-font-medium tw-leading-relaxed ${toneClasses}`}
    >
      {totalText !== null && <p className="tw-m-0">{totalText}</p>}
      {limitText !== null && (
        <p className={totalText === null ? "tw-m-0" : "tw-mb-0 tw-mt-1"}>
          {limitText}
        </p>
      )}
    </div>
  );
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
    simplifyIncludedCopy = false,
    showIdentityTotal = true,
    mobilePresentation = false,
  } = props;
  const { connectedProfile } = useAuth();
  const locale = useBrowserLocale();
  const [mode, setMode] = useState<InlineIdentityMode>("included");
  const isIncludedMode = mode === "included";
  const hideRedundantCopy = simplifyIncludedCopy && isIncludedMode;
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
  const isCurrentUserIncluded = includesCurrentUser({
    currentUserIdentity,
    identities: includedIdentities,
    walletSources: includedWalletSources,
  });
  const isCurrentUserExcluded = includesCurrentUser({
    currentUserIdentity,
    identities: excludedIdentities,
    walletSources: excludedWalletSources,
  });
  const identitiesHelperText = simplifyIncludedCopy
    ? null
    : t(locale, emptyHelperKey);
  const searchLabel = t(locale, searchLabelKey);
  const searchPlaceholder = t(locale, searchPlaceholderKey);
  const isOverIdentityLimit = selectedWallets.length > identityLimit;
  const totalKey = getIdentityTotalMessageKey({
    mode,
    count: selectedWallets.length,
  });
  const showCurrentUserExcludedWarning =
    !!currentUserIdentity &&
    (isCurrentUserExcluded ||
      (includedIdentities.length > 0 && !isCurrentUserIncluded));
  const totalText = t(locale, totalKey, {
    count: formatInteger(locale, selectedWallets.length),
  });
  const limitText = isOverIdentityLimit
    ? t(locale, getIdentityLimitMessageKey(mode), {
        limit: formatInteger(locale, identityLimit),
      })
    : null;
  const includedLabel = t(
    locale,
    "waves.create.groups.inlineIdentities.included.label"
  );
  const excludedLabel = t(
    locale,
    "waves.create.groups.inlineIdentities.excluded.label"
  );
  const modeItems: CommonSelectItem<InlineIdentityMode>[] = [
    {
      label: includedLabel,
      value: "included",
      key: "included",
    },
    {
      label: excludedLabel,
      value: "excluded",
      key: "excluded",
    },
  ];
  return (
    <div
      className={`tw-space-y-4 ${mobilePresentation ? "[&_label:has([role=switch])]:tw-w-full [&_label:has([role=switch])]:tw-justify-between" : ""}`}
    >
      <div data-group-criteria-tabs className="tw-w-fit">
        <CommonTabs<InlineIdentityMode>
          items={modeItems}
          activeItem={mode}
          setSelected={setMode}
          filterLabel={t(
            locale,
            "waves.create.groups.inlineIdentities.modeLabel"
          )}
          fill={false}
          size="sm"
        />
      </div>

      <div
        className={
          mobilePresentation
            ? "tw-min-w-0 tw-space-y-3 tw-rounded-xl tw-bg-iron-900 tw-p-4"
            : "tw-space-y-3"
        }
      >
        <h3 className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
          {searchLabel}
        </h3>
        <GroupCreateIdentitiesSearch
          key={mode}
          selectedWallets={selectedWallets}
          onIdentitySelect={onIdentitySelect}
          label={searchLabel}
          placeholder={searchPlaceholder}
          hideLabel={true}
          inputAppearance="modal"
          inputClassName="focus:!tw-ring-1 desktop-hover:hover:focus:tw-ring-primary-400"
          iconClassName="tw-text-iron-500"
          resultsLayout={resultsLayout}
          sort="level"
        />
        <IdentityControlsRow
          key={`controls-${mode}`}
          activeIdentities={activeIdentities}
          currentUserIdentity={currentUserIdentity}
          emptyText={identitiesHelperText}
          includeMeLabel={t(
            locale,
            "waves.create.groups.inlineIdentities.includeMe"
          )}
          isCurrentUserIncluded={isCurrentUserIncluded}
          isIncludedMode={isIncludedMode}
          mobilePresentation={mobilePresentation}
          onCurrentUserToggle={(checked) =>
            updateCurrentUserSelection({
              checked,
              currentUserIdentity,
              isCurrentUserIncluded,
              onIncludedIdentityRemove,
              onIncludedIdentitySelect,
            })
          }
          onRemove={onRemove}
          selectedWalletCount={selectedWallets.length}
        />
      </div>
      <CreateWaveInlineGroupWalletSources
        quiet
        networkPresentation
        mobilePresentation={mobilePresentation}
        hideEmptyMessages={simplifyIncludedCopy}
        direction={mode}
        sources={activeWalletSources}
        onChange={onWalletSourcesChange}
      />
      {(!hideRedundantCopy || selectedWallets.length > 0) && (
        <IdentityStatus
          isOverIdentityLimit={isOverIdentityLimit}
          limitText={limitText}
          totalText={showIdentityTotal ? totalText : null}
        />
      )}
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
