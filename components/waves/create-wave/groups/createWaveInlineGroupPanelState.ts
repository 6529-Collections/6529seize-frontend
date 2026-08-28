import type { CommunityMemberMinimal } from "@/entities/IProfile";
import {
  createInitialInlineGroupBuilderState,
  getInlineIdentityAddresses,
} from "./createWaveInlineGroupBuilder";
import type {
  CreateWaveInlineGroupBuilderState,
  CreateWaveInlineGroupPanel,
  CreateWaveInlineGroupRuleType,
  CreateWaveInlineGroupWalletSources,
} from "./createWaveInlineGroupBuilder";

export const PANEL_ACTIONS: CreateWaveInlineGroupPanel = "actions";
export const PANEL_IDENTITY: CreateWaveInlineGroupPanel = "identity";
export const PANEL_RULE_LIST: CreateWaveInlineGroupPanel = "rule-list";
export const PANEL_RULE_EDITOR: CreateWaveInlineGroupPanel = "rule-editor";
export const PANEL_SEARCH: CreateWaveInlineGroupPanel = "search";

export function getDisplayedBuilder({
  builder,
  disabled,
}: {
  readonly builder: CreateWaveInlineGroupBuilderState;
  readonly disabled: boolean;
}): CreateWaveInlineGroupBuilderState {
  if (!disabled) {
    return builder;
  }

  return {
    ...builder,
    panel: PANEL_ACTIONS,
    activeRule: null,
  };
}

export function buildIdentityDraftState({
  current,
  identities,
  excludedIdentities,
  includedWalletSources = current.includedWalletSources,
  excludedWalletSources = current.excludedWalletSources,
}: {
  readonly current: CreateWaveInlineGroupBuilderState;
  readonly identities: readonly CommunityMemberMinimal[];
  readonly excludedIdentities: readonly CommunityMemberMinimal[];
  readonly includedWalletSources?: CreateWaveInlineGroupWalletSources;
  readonly excludedWalletSources?: CreateWaveInlineGroupWalletSources;
}): CreateWaveInlineGroupBuilderState {
  return {
    ...current,
    identities,
    excludedIdentities,
    includedWalletSources,
    excludedWalletSources,
    draft: {
      ...current.draft,
      group: {
        ...current.draft.group,
        identity_addresses: getInlineIdentityAddresses(
          identities,
          includedWalletSources
        ),
        excluded_identity_addresses: getInlineIdentityAddresses(
          excludedIdentities,
          excludedWalletSources
        ),
      },
    },
  };
}

export function collapseInlineGroupBuilder(
  current: CreateWaveInlineGroupBuilderState
): CreateWaveInlineGroupBuilderState {
  return {
    ...current,
    panel: PANEL_ACTIONS,
    activeRule: null,
  };
}

export function openInlineGroupPanel({
  current,
  panel,
}: {
  readonly current: CreateWaveInlineGroupBuilderState;
  readonly panel: CreateWaveInlineGroupPanel;
}): CreateWaveInlineGroupBuilderState {
  return {
    ...current,
    panel,
    activeRule: null,
  };
}

export function startCriteriaReplacement(
  current: CreateWaveInlineGroupBuilderState
): CreateWaveInlineGroupBuilderState {
  return {
    ...current,
    panel: PANEL_RULE_LIST,
    activeRule: null,
    criteriaReplacementActive: true,
  };
}

export function openInlineGroupRule({
  current,
  rule,
}: {
  readonly current: CreateWaveInlineGroupBuilderState;
  readonly rule: CreateWaveInlineGroupRuleType;
}): CreateWaveInlineGroupBuilderState {
  return {
    ...current,
    activeRule: rule,
    panel: PANEL_RULE_EDITOR,
  };
}

export function toggleInlineGroupRule({
  current,
  rule,
}: {
  readonly current: CreateWaveInlineGroupBuilderState;
  readonly rule: CreateWaveInlineGroupRuleType;
}): CreateWaveInlineGroupBuilderState {
  if (current.panel === PANEL_RULE_EDITOR && current.activeRule === rule) {
    return {
      ...current,
      activeRule: null,
      panel: PANEL_RULE_LIST,
    };
  }

  return openInlineGroupRule({ current, rule });
}

export function clearInlineGroupDraft(
  defaultIncludedIdentity: CommunityMemberMinimal | null
): CreateWaveInlineGroupBuilderState {
  return createInitialInlineGroupBuilderState(
    defaultIncludedIdentity ? [defaultIncludedIdentity] : []
  );
}
