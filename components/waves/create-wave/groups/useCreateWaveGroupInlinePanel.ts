import type { Dispatch, SetStateAction } from "react";
import { useMemo, useRef, useState } from "react";
import { useClickAway } from "react-use";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { areEqualAddresses } from "@/helpers/Helpers";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useGroupCriteriaIdentityLabels } from "@/hooks/useGroupCriteriaIdentityLabels";
import { useXtdhGrantQuery } from "@/hooks/useXtdhGrantQuery";
import { t } from "@/i18n/messages";
import type { GroupMembersPreviewTarget } from "@/services/api/group-members-api";
import { validateGroupPayload } from "@/services/groups/groupMutations";
import {
  createInlineGroupBuilderStateFromSavedGroup,
  createInitialInlineGroupBuilderState,
  dedupeInlineIdentities,
  getInlineGroupDraftSummary,
  getInlineGroupRuleCount,
} from "./createWaveInlineGroupBuilder";
import type {
  CreateWaveInlineGroupBuilderState,
  CreateWaveInlineGroupPanel,
  CreateWaveInlineGroupRuleType,
  CreateWaveInlineGroupWalletSources,
} from "./createWaveInlineGroupBuilder";
import {
  buildIdentityDraftState,
  clearInlineGroupDraft,
  collapseInlineGroupBuilder,
  getDisplayedBuilder,
  openInlineGroupPanel,
  openInlineGroupRule,
  PANEL_ACTIONS,
  PANEL_IDENTITY,
  PANEL_RULE_EDITOR,
  PANEL_RULE_LIST,
  PANEL_SEARCH,
  startCriteriaReplacement,
  toggleInlineGroupRule,
} from "./createWaveInlineGroupPanelState";

export type CreateWaveGroupInlinePanelProps = {
  readonly suggestedName: string;
  readonly defaultLabel: string;
  readonly disabled?: boolean;
  readonly selectedGroup: ApiGroupFull | null;
  readonly selectedGroupIncludedWallets?: readonly string[] | undefined;
  readonly selectedGroupExcludedWallets?: readonly string[] | undefined;
  readonly allowGroupClear?: boolean;
  readonly collapseOnClickAway?: boolean;
  readonly startMode?: "actions" | "existing" | "criteria";
  readonly membersRoleLabel?: string | undefined;
  readonly selectedGroupCriteriaStatus?: "loading" | "unavailable" | undefined;
  readonly defaultMembersPreviewTarget?: GroupMembersPreviewTarget | undefined;
  readonly defaultIncludedIdentity?: CommunityMemberMinimal | null | undefined;
  readonly onCriteriaReplacementChange?:
    | ((active: boolean) => void)
    | undefined;
  readonly onChange: (
    group: ApiGroupFull | null
  ) => void | boolean | Promise<void | boolean>;
  readonly onCreateGroup: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
};

function useCreateWaveGroupInlinePanelViewState({
  builder,
  defaultLabel,
  disabled,
  defaultIncludedIdentity,
  isCreating,
  selectedGroup,
  selectedGroupIncludedWallets,
  selectedGroupExcludedWallets,
}: {
  readonly builder: CreateWaveInlineGroupBuilderState;
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly defaultIncludedIdentity: CommunityMemberMinimal | null;
  readonly isCreating: boolean;
  readonly selectedGroup: ApiGroupFull | null;
  readonly selectedGroupIncludedWallets: readonly string[] | undefined;
  readonly selectedGroupExcludedWallets: readonly string[] | undefined;
}) {
  const locale = useBrowserLocale();
  const normalizedBeneficiaryGrantId =
    builder.draft.group.is_beneficiary_of_grant_id?.trim() ?? "";
  const beneficiaryGrantId = normalizedBeneficiaryGrantId.length
    ? normalizedBeneficiaryGrantId
    : null;
  const { grant: beneficiaryGrant } = useXtdhGrantQuery({
    grantId: beneficiaryGrantId,
    enabled: beneficiaryGrantId !== null,
  });
  const identityLabels = useGroupCriteriaIdentityLabels(builder.draft.group);
  const displayedBuilder = getDisplayedBuilder({
    builder,
    disabled,
  });
  const draftSummary = useMemo(
    () =>
      getInlineGroupDraftSummary({
        draft: builder.draft,
        identityCount: builder.draft.group.identity_addresses?.length ?? 0,
        beneficiaryGrantCollectionName:
          beneficiaryGrant?.target_collection_name,
        identityLabels,
        locale,
      }),
    [
      beneficiaryGrant?.target_collection_name,
      builder.draft,
      identityLabels,
      locale,
    ]
  );
  const validation = validateGroupPayload(builder.draft);
  const canCreateDraft = validation.valid && !disabled && !isCreating;
  const ruleCount = getInlineGroupRuleCount(builder.draft);
  const defaultWallet = defaultIncludedIdentity?.wallet ?? "";
  const includedAddresses = builder.draft.group.identity_addresses ?? [];
  const excludedAddresses =
    builder.draft.group.excluded_identity_addresses ?? [];
  const selectedWallet = includedAddresses[0] ?? "";
  const walletsAreComparable =
    defaultWallet.length > 0 &&
    selectedWallet.length > 0 &&
    !/\s/.test(defaultWallet) &&
    !/\s/.test(selectedWallet);
  const containsOnlyDefaultIdentity =
    ruleCount === 0 &&
    includedAddresses.length === 1 &&
    excludedAddresses.length === 0 &&
    walletsAreComparable &&
    areEqualAddresses(selectedWallet, defaultWallet);
  const isIdentityPanel = displayedBuilder.panel === PANEL_IDENTITY;
  const isRulePanel =
    displayedBuilder.panel === PANEL_RULE_LIST ||
    displayedBuilder.panel === PANEL_RULE_EDITOR;
  const isSearchPanel = displayedBuilder.panel === PANEL_SEARCH;
  const hasUnsavedGroup =
    (builder.criteriaReplacementActive ||
      (!!draftSummary && !containsOnlyDefaultIdentity)) &&
    !disabled;
  const canResetDraft = hasUnsavedGroup && !isCreating;
  const currentGroupLabel = selectedGroup?.name ?? defaultLabel;
  const canReplaceCriteria =
    selectedGroup === null ||
    (selectedGroupIncludedWallets !== undefined &&
      selectedGroupExcludedWallets !== undefined);

  return {
    canCreateDraft,
    canResetDraft,
    canReplaceCriteria,
    currentGroupLabel,
    displayedBuilder,
    draftSummary,
    hasUnsavedGroup,
    isCriteriaReplacementActive: builder.criteriaReplacementActive,
    isDraftValid: validation.valid,
    isExpandedPanel: displayedBuilder.panel !== PANEL_ACTIONS,
    isIdentityPanel,
    isRulePanel,
    isSearchPanel,
    showDraftFooter: hasUnsavedGroup && !isSearchPanel,
    unsavedGroupDescription: hasUnsavedGroup
      ? t(locale, "waves.create.groups.notAppliedYet")
      : null,
    unsavedGroupSummary: hasUnsavedGroup ? draftSummary : null,
  };
}

function useCreateWaveGroupInlinePanelController({
  allowGroupClear,
  builder,
  canCreateDraft,
  canResetDraft,
  defaultIncludedIdentity,
  onChange,
  onCriteriaReplacementChange,
  onCreateGroup,
  selectedGroup,
  selectedGroupIncludedWallets,
  selectedGroupExcludedWallets,
  setBuilder,
  setIsCreating,
  suggestedName,
}: {
  readonly allowGroupClear: boolean;
  readonly builder: CreateWaveInlineGroupBuilderState;
  readonly canCreateDraft: boolean;
  readonly canResetDraft: boolean;
  readonly defaultIncludedIdentity: CommunityMemberMinimal | null;
  readonly onChange: (
    group: ApiGroupFull | null
  ) => void | boolean | Promise<void | boolean>;
  readonly onCriteriaReplacementChange?:
    | ((active: boolean) => void)
    | undefined;
  readonly onCreateGroup: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
  readonly selectedGroup: ApiGroupFull | null;
  readonly selectedGroupIncludedWallets: readonly string[] | undefined;
  readonly selectedGroupExcludedWallets: readonly string[] | undefined;
  readonly setBuilder: Dispatch<
    SetStateAction<CreateWaveInlineGroupBuilderState>
  >;
  readonly setIsCreating: Dispatch<SetStateAction<boolean>>;
  readonly suggestedName: string;
}) {
  const locale = useBrowserLocale();
  const resetBuilder = () => {
    setBuilder(
      createInitialInlineGroupBuilderState(
        defaultIncludedIdentity ? [defaultIncludedIdentity] : []
      )
    );
    onCriteriaReplacementChange?.(false);
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

  const withoutIdentity = (
    identities: readonly CommunityMemberMinimal[],
    wallet: string
  ): CommunityMemberMinimal[] => {
    const normalizedWallet = wallet.trim().toLowerCase();
    return identities.filter(
      (identity) => identity.wallet.trim().toLowerCase() !== normalizedWallet
    );
  };

  const withoutWalletsFromSources = (
    sources: CreateWaveInlineGroupWalletSources,
    walletKeys: ReadonlySet<string>
  ): CreateWaveInlineGroupWalletSources => {
    const filterWallets = (
      wallets: readonly string[] | null
    ): readonly string[] | null => {
      if (wallets === null) {
        return null;
      }
      return wallets.filter(
        (wallet) => !walletKeys.has(wallet.trim().toLowerCase())
      );
    };

    return {
      ...sources,
      emmaWallets: filterWallets(sources.emmaWallets),
      uploadedWallets: filterWallets(sources.uploadedWallets),
    };
  };

  const withoutWalletsFromIdentities = (
    identities: readonly CommunityMemberMinimal[],
    walletKeys: ReadonlySet<string>
  ): CommunityMemberMinimal[] =>
    identities.filter(
      (identity) => !walletKeys.has(identity.wallet.trim().toLowerCase())
    );

  const getWalletKeys = (wallets: readonly string[]): ReadonlySet<string> =>
    new Set(wallets.map((wallet) => wallet.trim().toLowerCase()));

  const addIdentity = (identity: CommunityMemberMinimal) => {
    setBuilder((current) => {
      const identities = dedupeInlineIdentities([
        ...current.identities,
        identity,
      ]);
      const excludedIdentities = withoutIdentity(
        current.excludedIdentities,
        identity.wallet
      );
      const walletKeys = getWalletKeys([identity.wallet]);
      const excludedWalletSources = withoutWalletsFromSources(
        current.excludedWalletSources,
        walletKeys
      );

      return buildIdentityDraftState({
        current,
        identities,
        excludedIdentities,
        excludedWalletSources,
      });
    });
  };

  const removeIdentity = (wallet: string) => {
    setBuilder((current) => {
      const identities = withoutIdentity(current.identities, wallet);
      const includedWalletSources = withoutWalletsFromSources(
        current.includedWalletSources,
        getWalletKeys([wallet])
      );

      return buildIdentityDraftState({
        current,
        identities,
        excludedIdentities: current.excludedIdentities,
        includedWalletSources,
      });
    });
  };

  const addExcludedIdentity = (identity: CommunityMemberMinimal) => {
    setBuilder((current) => {
      const identities = withoutIdentity(current.identities, identity.wallet);
      const excludedIdentities = dedupeInlineIdentities([
        ...current.excludedIdentities,
        identity,
      ]);
      const walletKeys = getWalletKeys([identity.wallet]);
      const includedWalletSources = withoutWalletsFromSources(
        current.includedWalletSources,
        walletKeys
      );

      return buildIdentityDraftState({
        current,
        identities,
        excludedIdentities,
        includedWalletSources,
      });
    });
  };

  const removeExcludedIdentity = (wallet: string) => {
    setBuilder((current) => {
      const excludedIdentities = withoutIdentity(
        current.excludedIdentities,
        wallet
      );
      const excludedWalletSources = withoutWalletsFromSources(
        current.excludedWalletSources,
        getWalletKeys([wallet])
      );

      return buildIdentityDraftState({
        current,
        identities: current.identities,
        excludedIdentities,
        excludedWalletSources,
      });
    });
  };

  const updateWalletSources = ({
    direction,
    update,
  }: {
    readonly direction: "included" | "excluded";
    readonly update: Partial<CreateWaveInlineGroupWalletSources>;
  }) => {
    setBuilder((current) => {
      const currentSources =
        direction === "included"
          ? current.includedWalletSources
          : current.excludedWalletSources;
      const nextSources = { ...currentSources, ...update };
      const newlyAddedWallets = [
        ...("emmaWallets" in update ? (update.emmaWallets ?? []) : []),
        ...("uploadedWallets" in update ? (update.uploadedWallets ?? []) : []),
      ];
      // A source replacement only moves wallets present in the new source. Wallets
      // removed with the old source stay removed from the opposite side by design.
      const walletKeys = getWalletKeys(newlyAddedWallets);

      if (direction === "included") {
        return buildIdentityDraftState({
          current,
          identities: current.identities,
          excludedIdentities: withoutWalletsFromIdentities(
            current.excludedIdentities,
            walletKeys
          ),
          includedWalletSources: nextSources,
          excludedWalletSources: withoutWalletsFromSources(
            current.excludedWalletSources,
            walletKeys
          ),
        });
      }

      return buildIdentityDraftState({
        current,
        identities: withoutWalletsFromIdentities(
          current.identities,
          walletKeys
        ),
        excludedIdentities: current.excludedIdentities,
        includedWalletSources: withoutWalletsFromSources(
          current.includedWalletSources,
          walletKeys
        ),
        excludedWalletSources: nextSources,
      });
    });
  };

  const updateIncludedWalletSources = (
    update: Partial<CreateWaveInlineGroupWalletSources>
  ) => updateWalletSources({ direction: "included", update });

  const updateExcludedWalletSources = (
    update: Partial<CreateWaveInlineGroupWalletSources>
  ) => updateWalletSources({ direction: "excluded", update });

  const openPanel = (panel: CreateWaveInlineGroupPanel) => {
    setBuilder((current) => openInlineGroupPanel({ current, panel }));
  };

  const onReplaceCriteria = () => {
    if (builder.criteriaReplacementActive) {
      if (builder.panel === PANEL_ACTIONS || builder.panel === PANEL_SEARCH) {
        setBuilder((current) =>
          openInlineGroupPanel({ current, panel: PANEL_RULE_LIST })
        );
      }
      return;
    }

    if (selectedGroup) {
      if (
        selectedGroupIncludedWallets === undefined ||
        selectedGroupExcludedWallets === undefined
      ) {
        return;
      }
      setBuilder(
        createInlineGroupBuilderStateFromSavedGroup({
          group: selectedGroup,
          includedWallets: selectedGroupIncludedWallets,
          excludedWallets: selectedGroupExcludedWallets,
        })
      );
      onCriteriaReplacementChange?.(true);
      return;
    }

    setBuilder(startCriteriaReplacement);
    onCriteriaReplacementChange?.(true);
  };

  const returnToCriteria = () => {
    setBuilder((current) =>
      openInlineGroupPanel({ current, panel: PANEL_RULE_LIST })
    );
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
        name:
          suggestedName.trim() ||
          t(locale, "waves.create.groups.defaultGroupName"),
      };

      const createdGroup = await onCreateGroup(nextPayload);
      if (!createdGroup) {
        return;
      }

      const changed = await onChange(createdGroup);
      if (changed !== false) {
        resetBuilder();
      }
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

    setBuilder(clearInlineGroupDraft(defaultIncludedIdentity));
    onCriteriaReplacementChange?.(false);
  };

  const selectExistingGroup = async (group: ApiGroupFull | null) => {
    if (!group && !allowGroupClear) {
      return;
    }

    const changed = await onChange(group);
    if (group && changed !== false) {
      resetBuilder();
    }
  };

  const onExistingGroupSelect = (group: ApiGroupFull | null) => {
    void selectExistingGroup(group);
  };

  return {
    addExcludedIdentity,
    addIdentity,
    collapseBuilderPanel,
    onCancelPanel: collapseBuilderPanel,
    onClearAll,
    onCreateAndUse,
    onExistingGroupSelect,
    onReplaceCriteria,
    openRule,
    removeIdentity,
    removeExcludedIdentity,
    returnToCriteria,
    setDraft,
    togglePanel,
    toggleRule,
    updateExcludedWalletSources,
    updateIncludedWalletSources,
  };
}

export function useCreateWaveGroupInlinePanel({
  suggestedName,
  defaultLabel,
  disabled = false,
  selectedGroup,
  selectedGroupIncludedWallets,
  selectedGroupExcludedWallets,
  allowGroupClear = true,
  collapseOnClickAway = true,
  startMode = "actions",
  defaultIncludedIdentity = null,
  onChange,
  onCriteriaReplacementChange,
  onCreateGroup,
}: CreateWaveGroupInlinePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [builder, setBuilder] = useState<CreateWaveInlineGroupBuilderState>(
    () => {
      if (
        startMode === "criteria" &&
        selectedGroup &&
        selectedGroupIncludedWallets !== undefined &&
        selectedGroupExcludedWallets !== undefined
      ) {
        return createInlineGroupBuilderStateFromSavedGroup({
          group: selectedGroup,
          includedWallets: selectedGroupIncludedWallets,
          excludedWallets: selectedGroupExcludedWallets,
        });
      }

      const initial = createInitialInlineGroupBuilderState(
        defaultIncludedIdentity ? [defaultIncludedIdentity] : []
      );
      if (startMode === "criteria") {
        return {
          ...initial,
          panel: PANEL_RULE_LIST,
          criteriaReplacementActive: true,
        };
      }

      return {
        ...initial,
        panel: startMode === "existing" ? PANEL_SEARCH : PANEL_ACTIONS,
      };
    }
  );
  const {
    canCreateDraft,
    canReplaceCriteria,
    canResetDraft,
    currentGroupLabel,
    displayedBuilder,
    draftSummary,
    hasUnsavedGroup,
    isCriteriaReplacementActive,
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
    defaultIncludedIdentity,
    isCreating,
    selectedGroup,
    selectedGroupIncludedWallets,
    selectedGroupExcludedWallets,
  });
  const {
    addExcludedIdentity,
    addIdentity,
    collapseBuilderPanel,
    onCancelPanel,
    onClearAll,
    onCreateAndUse,
    onExistingGroupSelect,
    onReplaceCriteria,
    openRule,
    removeIdentity,
    removeExcludedIdentity,
    returnToCriteria,
    setDraft,
    togglePanel,
    toggleRule,
    updateExcludedWalletSources,
    updateIncludedWalletSources,
  } = useCreateWaveGroupInlinePanelController({
    allowGroupClear,
    builder,
    canCreateDraft,
    canResetDraft,
    defaultIncludedIdentity,
    onChange,
    onCriteriaReplacementChange,
    onCreateGroup,
    selectedGroup,
    selectedGroupIncludedWallets,
    selectedGroupExcludedWallets,
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
    addExcludedIdentity,
    addIdentity,
    canCreateDraft,
    canReplaceCriteria,
    canResetDraft,
    currentGroupLabel,
    displayedBuilder,
    draftSummary,
    hasUnsavedGroup,
    isCreating,
    isCriteriaReplacementActive,
    isDraftValid,
    isExpandedPanel,
    isIdentityPanel,
    isRulePanel,
    isSearchPanel,
    onCancelPanel,
    onClearAll,
    onCreateAndUse,
    onExistingGroupSelect,
    onReplaceCriteria,
    openRule,
    panelRef,
    removeIdentity,
    removeExcludedIdentity,
    returnToCriteria,
    setDraft,
    showDraftFooter,
    togglePanel,
    toggleRule,
    updateExcludedWalletSources,
    updateIncludedWalletSources,
    unsavedGroupDescription,
    unsavedGroupSummary,
  };
}
