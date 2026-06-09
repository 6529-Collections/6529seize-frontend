import type { Dispatch, SetStateAction } from "react";
import { useMemo, useRef, useState } from "react";
import { useClickAway } from "react-use";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { validateGroupPayload } from "@/services/groups/groupMutations";
import {
  createInitialInlineGroupBuilderState,
  dedupeInlineIdentities,
  getInlineGroupDraftSummary,
  getInlineIdentityAddresses,
} from "./createWaveInlineGroupBuilder";
import type {
  CreateWaveInlineGroupBuilderState,
  CreateWaveInlineGroupPanel,
  CreateWaveInlineGroupRuleType,
} from "./createWaveInlineGroupBuilder";

const PANEL_ACTIONS: CreateWaveInlineGroupPanel = "actions";
const PANEL_IDENTITY: CreateWaveInlineGroupPanel = "identity";
const PANEL_RULE_LIST: CreateWaveInlineGroupPanel = "rule-list";
const PANEL_RULE_EDITOR: CreateWaveInlineGroupPanel = "rule-editor";
const PANEL_SEARCH: CreateWaveInlineGroupPanel = "search";

function getDisplayedBuilder({
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

function buildIdentityDraftState({
  current,
  identities,
}: {
  readonly current: CreateWaveInlineGroupBuilderState;
  readonly identities: readonly CommunityMemberMinimal[];
}): CreateWaveInlineGroupBuilderState {
  return {
    ...current,
    identities,
    draft: {
      ...current.draft,
      group: {
        ...current.draft.group,
        identity_addresses: getInlineIdentityAddresses(identities),
      },
    },
  };
}

function collapseInlineGroupBuilder(
  current: CreateWaveInlineGroupBuilderState
): CreateWaveInlineGroupBuilderState {
  return {
    ...current,
    panel: PANEL_ACTIONS,
    activeRule: null,
  };
}

function openInlineGroupPanel({
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

function openInlineGroupRule({
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

function toggleInlineGroupRule({
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

function clearInlineGroupDraft(
  current: CreateWaveInlineGroupBuilderState
): CreateWaveInlineGroupBuilderState {
  const next = createInitialInlineGroupBuilderState();

  return {
    ...next,
    panel:
      current.panel === PANEL_SEARCH || current.panel === PANEL_ACTIONS
        ? PANEL_ACTIONS
        : current.panel,
    activeRule: current.panel === PANEL_RULE_EDITOR ? current.activeRule : null,
  };
}

export type CreateWaveGroupInlinePanelProps = {
  readonly suggestedName: string;
  readonly defaultLabel: string;
  readonly disabled?: boolean;
  readonly selectedGroup: ApiGroupFull | null;
  readonly allowGroupClear?: boolean;
  readonly collapseOnClickAway?: boolean;
  readonly startMode?: "actions" | "existing";
  readonly onChange: (group: ApiGroupFull | null) => void | Promise<void>;
  readonly onCreateGroup: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
};

function buildUnsavedGroupDescription(): string {
  return "Not applied yet.";
}

function useCreateWaveGroupInlinePanelViewState({
  builder,
  defaultLabel,
  disabled,
  isCreating,
  selectedGroup,
}: {
  readonly builder: CreateWaveInlineGroupBuilderState;
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly isCreating: boolean;
  readonly selectedGroup: ApiGroupFull | null;
}) {
  const displayedBuilder = getDisplayedBuilder({
    builder,
    disabled,
  });
  const draftSummary = useMemo(
    () =>
      getInlineGroupDraftSummary({
        draft: builder.draft,
        identityCount: builder.identities.length,
      }),
    [builder.draft, builder.identities.length]
  );
  const validation = validateGroupPayload(builder.draft);
  const canCreateDraft = validation.valid && !disabled && !isCreating;
  const canResetDraft = !!draftSummary && !disabled && !isCreating;
  const isIdentityPanel = displayedBuilder.panel === PANEL_IDENTITY;
  const isRulePanel =
    displayedBuilder.panel === PANEL_RULE_LIST ||
    displayedBuilder.panel === PANEL_RULE_EDITOR;
  const isSearchPanel = displayedBuilder.panel === PANEL_SEARCH;
  const hasUnsavedGroup = !!draftSummary && !disabled;
  const currentGroupLabel = selectedGroup?.name ?? defaultLabel;

  return {
    canCreateDraft,
    canResetDraft,
    currentGroupLabel,
    displayedBuilder,
    draftSummary,
    hasUnsavedGroup,
    isDraftValid: validation.valid,
    isExpandedPanel: displayedBuilder.panel !== PANEL_ACTIONS,
    isIdentityPanel,
    isRulePanel,
    isSearchPanel,
    showDraftFooter: hasUnsavedGroup && !isSearchPanel,
    unsavedGroupDescription: hasUnsavedGroup
      ? buildUnsavedGroupDescription()
      : null,
    unsavedGroupSummary: hasUnsavedGroup ? draftSummary : null,
  };
}

function useCreateWaveGroupInlinePanelController({
  allowGroupClear,
  builder,
  canCreateDraft,
  canResetDraft,
  onChange,
  onCreateGroup,
  setBuilder,
  setIsCreating,
  suggestedName,
}: {
  readonly allowGroupClear: boolean;
  readonly builder: CreateWaveInlineGroupBuilderState;
  readonly canCreateDraft: boolean;
  readonly canResetDraft: boolean;
  readonly onChange: (group: ApiGroupFull | null) => void | Promise<void>;
  readonly onCreateGroup: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
  readonly setBuilder: Dispatch<
    SetStateAction<CreateWaveInlineGroupBuilderState>
  >;
  readonly setIsCreating: Dispatch<SetStateAction<boolean>>;
  readonly suggestedName: string;
}) {
  const resetBuilder = () => {
    setBuilder(createInitialInlineGroupBuilderState());
  };

  const collapseBuilderPanel = () => {
    setBuilder(collapseInlineGroupBuilder);
  };

  const setDraft = (draft: ApiCreateGroup) => {
    setBuilder((current) => ({
      ...current,
      draft,
    }));
  };

  const addIdentity = (identity: CommunityMemberMinimal) => {
    setBuilder((current) => {
      const identities = dedupeInlineIdentities([
        ...current.identities,
        identity,
      ]);

      return buildIdentityDraftState({
        current,
        identities,
      });
    });
  };

  const removeIdentity = (wallet: string) => {
    const normalizedWallet = wallet.trim().toLowerCase();

    setBuilder((current) => {
      const identities = current.identities.filter((identity) => {
        const key = identity.wallet.trim().toLowerCase();
        return key !== normalizedWallet;
      });

      return buildIdentityDraftState({
        current,
        identities,
      });
    });
  };

  const openPanel = (panel: CreateWaveInlineGroupPanel) => {
    setBuilder((current) => openInlineGroupPanel({ current, panel }));
  };

  const togglePanel = (
    panel: CreateWaveInlineGroupPanel,
    isActive: boolean
  ) => {
    if (isActive) {
      collapseBuilderPanel();
      return;
    }

    openPanel(panel);
  };

  const openRule = (rule: CreateWaveInlineGroupRuleType) => {
    setBuilder((current) => openInlineGroupRule({ current, rule }));
  };

  const toggleRule = (rule: CreateWaveInlineGroupRuleType) => {
    setBuilder((current) => toggleInlineGroupRule({ current, rule }));
  };

  const createAndUse = async () => {
    if (!canCreateDraft) {
      return;
    }

    setIsCreating(true);
    try {
      const nextPayload: ApiCreateGroup = {
        ...builder.draft,
        name: suggestedName.trim() || "Wave Group",
      };

      const createdGroup = await onCreateGroup(nextPayload);
      if (!createdGroup) {
        return;
      }

      await onChange(createdGroup);
      resetBuilder();
    } finally {
      setIsCreating(false);
    }
  };

  const onCreateAndUse = () => {
    void createAndUse();
  };

  const onClearAll = () => {
    if (!canResetDraft) {
      return;
    }

    setBuilder(clearInlineGroupDraft);
  };

  const selectExistingGroup = async (group: ApiGroupFull | null) => {
    if (!group && !allowGroupClear) {
      return;
    }

    await onChange(group);
    if (group) {
      resetBuilder();
    }
  };

  const onExistingGroupSelect = (group: ApiGroupFull | null) => {
    void selectExistingGroup(group);
  };

  return {
    addIdentity,
    collapseBuilderPanel,
    onCancelPanel: collapseBuilderPanel,
    onClearAll,
    onCreateAndUse,
    onExistingGroupSelect,
    openRule,
    removeIdentity,
    setDraft,
    togglePanel,
    toggleRule,
  };
}

export function useCreateWaveGroupInlinePanel({
  suggestedName,
  defaultLabel,
  disabled = false,
  selectedGroup,
  allowGroupClear = true,
  collapseOnClickAway = true,
  startMode = "actions",
  onChange,
  onCreateGroup,
}: CreateWaveGroupInlinePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [builder, setBuilder] = useState<CreateWaveInlineGroupBuilderState>(
    () => ({
      ...createInitialInlineGroupBuilderState(),
      panel: startMode === "existing" ? PANEL_SEARCH : PANEL_ACTIONS,
    })
  );
  const {
    canCreateDraft,
    canResetDraft,
    currentGroupLabel,
    displayedBuilder,
    draftSummary,
    hasUnsavedGroup,
    isDraftValid,
    isExpandedPanel,
    isIdentityPanel,
    isRulePanel,
    isSearchPanel,
    showDraftFooter,
    unsavedGroupDescription,
    unsavedGroupSummary,
  } = useCreateWaveGroupInlinePanelViewState({
    builder,
    defaultLabel,
    disabled,
    isCreating,
    selectedGroup,
  });
  const {
    addIdentity,
    collapseBuilderPanel,
    onCancelPanel,
    onClearAll,
    onCreateAndUse,
    onExistingGroupSelect,
    openRule,
    removeIdentity,
    setDraft,
    togglePanel,
    toggleRule,
  } = useCreateWaveGroupInlinePanelController({
    allowGroupClear,
    builder,
    canCreateDraft,
    canResetDraft,
    onChange,
    onCreateGroup,
    setBuilder,
    setIsCreating,
    suggestedName,
  });

  useClickAway(panelRef, () => {
    if (collapseOnClickAway && builder.panel !== PANEL_ACTIONS) {
      collapseBuilderPanel();
    }
  });

  return {
    addIdentity,
    canCreateDraft,
    canResetDraft,
    currentGroupLabel,
    displayedBuilder,
    draftSummary,
    hasUnsavedGroup,
    isCreating,
    isDraftValid,
    isExpandedPanel,
    isIdentityPanel,
    isRulePanel,
    isSearchPanel,
    onCancelPanel,
    onClearAll,
    onCreateAndUse,
    onExistingGroupSelect,
    openRule,
    panelRef,
    removeIdentity,
    setDraft,
    showDraftFooter,
    togglePanel,
    toggleRule,
    unsavedGroupDescription,
    unsavedGroupSummary,
  };
}
