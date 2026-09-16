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
  readonly quiet?: boolean;
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
  const wallets =
    getInlineIdentityAddresses(identities, walletSources) ?? [];
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
    <label className="tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-x-2 sm:tw-gap-x-3">
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
  onCurrentUserToggle,
  onRemove,
  quiet,
  selectedWalletCount,
}: {
  readonly activeIdentities: readonly CommunityMemberMinimal[];
  readonly currentUserIdentity: CommunityMemberMinimal | null;
  readonly emptyText: string;
  readonly includeMeLabel: string;
  readonly isCurrentUserIncluded: boolean;
  readonly isIncludedMode: boolean;
  readonly onCurrentUserToggle: (checked: boolean) => void;
  readonly onRemove: (wallet: string) => void;
  readonly quiet: boolean;
  readonly selectedWalletCount: number;
}) {
  const showRow =
    activeIdentities.length > 0 ||
    selectedWalletCount === 0 ||
    (isIncludedMode && !!currentUserIdentity);
  if (!showRow) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
      {activeIdentities.length > 0 && (
        <GroupCreateIdentitySelectedItems
          selectedIdentities={[...activeIdentities]}
          onRemove={onRemove}
          variant={quiet ? "inlineQuiet" : "inline"}
        />
      )}
      {selectedWalletCount === 0 && (
        <p className="tw-m-0 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-500">
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
  quiet,
  totalText,
}: {
  readonly isOverIdentityLimit: boolean;
  readonly limitText: string | null;
  readonly quiet: boolean;
  readonly totalText: string;
}) {
  let toneClasses =
    "tw-border-white/5 tw-bg-iron-950/60 tw-text-iron-300";
  if (quiet) {
    toneClasses = "tw-text-iron-400";
  }
  if (isOverIdentityLimit) {
    toneClasses = "tw-border-error/30 tw-bg-error/10 tw-text-error";
  }
  const layoutClasses = quiet
    ? "tw-border-x-0 tw-border-b-0 tw-border-t tw-border-iron-800"
    : "tw-rounded-lg tw-border tw-px-3";

  return (
    <div
      role="status"
      className={`tw-border-solid tw-py-2 tw-text-xs tw-font-medium tw-leading-relaxed ${layoutClasses} ${toneClasses}`}
    >
      <p className="tw-m-0">{totalText}</p>
      {limitText ? <p className="tw-mb-0 tw-mt-1">{limitText}</p> : null}
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
    quiet = false,
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
  const identitiesHelperText = t(locale, emptyHelperKey);
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
    ? t(
        locale,
        getIdentityLimitMessageKey(mode),
        { limit: formatInteger(locale, identityLimit) }
      )
    : null;

  return (
    <div className={quiet ? "tw-space-y-4" : "tw-space-y-5"}>
      <div
        role="group"
        aria-label={t(locale, "waves.create.groups.inlineIdentities.modeLabel")}
        className={
          quiet
            ? "tw-relative tw-isolate tw-inline-flex tw-min-h-11 tw-w-fit tw-items-center tw-rounded-lg tw-bg-transparent tw-p-0 before:tw-pointer-events-none before:tw-absolute before:-tw-z-10 before:tw-inset-x-0 before:tw-inset-y-1 before:tw-rounded-lg before:tw-bg-iron-900 before:tw-ring-1 before:tw-ring-inset before:tw-ring-iron-800 before:tw-content-['']"
            : "tw-flex tw-flex-wrap tw-gap-1.5"
        }
      >
        <DraftChipButton
          label={t(
            locale,
            "waves.create.groups.inlineIdentities.included.label"
          )}
          active={isIncludedMode}
          quiet={quiet}
          quietStyle="segment"
          isToggle={true}
          onClick={() => setMode("included")}
        />
        <DraftChipButton
          label={t(
            locale,
            "waves.create.groups.inlineIdentities.excluded.label"
          )}
          active={!isIncludedMode}
          quiet={quiet}
          quietStyle="segment"
          isToggle={true}
          onClick={() => setMode("excluded")}
        />
      </div>

      <div className={quiet ? "tw-space-y-3" : "tw-space-y-4"}>
        <GroupCreateIdentitiesSearch
          key={mode}
          selectedWallets={selectedWallets}
          onIdentitySelect={onIdentitySelect}
          label={searchLabel}
          placeholder={searchPlaceholder}
          hideLabel={true}
          inputAppearance={quiet ? "modal" : "default"}
          inputClassName={
            quiet
              ? ""
              : "tw-border-white/10 tw-bg-iron-950 tw-ring-white/10 desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 focus:tw-border-primary-400 focus:tw-bg-iron-950 focus:tw-ring-primary-400"
          }
          iconClassName="tw-text-iron-500"
          resultsLayout={resultsLayout}
          sort="level"
        />
        <IdentityControlsRow
          activeIdentities={activeIdentities}
          currentUserIdentity={currentUserIdentity}
          emptyText={identitiesHelperText}
          includeMeLabel={t(
            locale,
            "waves.create.groups.inlineIdentities.includeMe"
          )}
          isCurrentUserIncluded={isCurrentUserIncluded}
          isIncludedMode={isIncludedMode}
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
          quiet={quiet}
          selectedWalletCount={selectedWallets.length}
        />
      </div>
      <CreateWaveInlineGroupWalletSources
        direction={mode}
        sources={activeWalletSources}
        onChange={onWalletSourcesChange}
        quiet={quiet}
      />
      <IdentityStatus
        isOverIdentityLimit={isOverIdentityLimit}
        limitText={limitText}
        quiet={quiet}
        totalText={totalText}
      />
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
