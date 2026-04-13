"use client";

import { useMemo, useState } from "react";
import GroupCreateCIC from "@/components/groups/page/create/config/GroupCreateCIC";
import GroupCreateLevel from "@/components/groups/page/create/config/GroupCreateLevel";
import GroupCreateRep from "@/components/groups/page/create/config/GroupCreateRep";
import GroupCreateTDH from "@/components/groups/page/create/config/GroupCreateTDH";
import GroupCreateCollections from "@/components/groups/page/create/config/nfts/GroupCreateCollections";
import GroupCreateNfts from "@/components/groups/page/create/config/nfts/GroupCreateNfts";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { validateGroupPayload } from "@/services/groups/groupMutations";
import {
  CreateWaveInlineGroupRuleType,
  buildInlineGroupName,
  CREATE_WAVE_INLINE_GROUP_MORE_RULES,
  CREATE_WAVE_INLINE_GROUP_QUICK_RULES,
  CREATE_WAVE_INLINE_GROUP_RULE_LABELS,
  getInlineGroupConfiguredRules,
  getInlineGroupDraftSummary,
} from "./createWaveInlineGroupBuilder";
import type {
  CreateWaveInlineGroupBuilderState,
  CreateWaveInlineGroupPanel,
} from "./createWaveInlineGroupBuilder";
import CreateWaveGroupSearchField from "./CreateWaveGroupSearchField";
import CreateWaveInlineGroupIdentities from "./CreateWaveInlineGroupIdentities";
import CreateWaveInlineGroupXtdhGrant from "./CreateWaveInlineGroupXtdhGrant";

const CREATE_WAVE_INLINE_GROUP_RULE_OPTIONS = [
  ...CREATE_WAVE_INLINE_GROUP_QUICK_RULES,
  ...CREATE_WAVE_INLINE_GROUP_MORE_RULES,
] as const;

function PanelHeader({
  title,
  backLabel,
  onBack,
}: {
  readonly title: string;
  readonly backLabel: string;
  readonly onBack: () => void;
}) {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3">
      <button
        type="button"
        onClick={onBack}
        className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
      >
        {backLabel}
      </button>
      <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-50">
        {title}
      </p>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled = false,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800"
    >
      {label}
    </button>
  );
}

function DraftChipButton({
  label,
  onClick,
  disabled = false,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-200 tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800"
    >
      {label}
    </button>
  );
}

export default function CreateWaveGroupInlinePanel({
  waveName,
  groupLabel,
  defaultLabel,
  disabled,
  selectedGroup,
  groupBuilder,
  onGroupSelect,
  onInlineGroupCreate,
  setGroupBuilderPanel,
  setGroupBuilderRule,
  setGroupBuilderDraft,
  addGroupBuilderIdentity,
  removeGroupBuilderIdentity,
  resetGroupBuilder,
}: {
  readonly waveName: string;
  readonly groupLabel: string;
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly selectedGroup: ApiGroupFull | null;
  readonly groupBuilder: CreateWaveInlineGroupBuilderState;
  readonly onGroupSelect: (group: ApiGroupFull | null) => void;
  readonly onInlineGroupCreate: (
    payload: ApiCreateGroup
  ) => Promise<ApiGroupFull | null>;
  readonly setGroupBuilderPanel: (panel: CreateWaveInlineGroupPanel) => void;
  readonly setGroupBuilderRule: (
    rule: CreateWaveInlineGroupRuleType | null
  ) => void;
  readonly setGroupBuilderDraft: (draft: ApiCreateGroup) => void;
  readonly addGroupBuilderIdentity: (identity: CommunityMemberMinimal) => void;
  readonly removeGroupBuilderIdentity: (wallet: string) => void;
  readonly resetGroupBuilder: () => void;
}) {
  const [isCreating, setIsCreating] = useState(false);

  const draftSummary = useMemo(
    () =>
      getInlineGroupDraftSummary({
        draft: groupBuilder.draft,
        identityCount: groupBuilder.identities.length,
      }),
    [groupBuilder.draft, groupBuilder.identities.length]
  );
  const configuredRules = useMemo(
    () => getInlineGroupConfiguredRules(groupBuilder.draft),
    [groupBuilder.draft]
  );
  const validation = validateGroupPayload(groupBuilder.draft);
  const canCreateDraft = validation.valid && !disabled && !isCreating;
  const currentStateLabel = selectedGroup?.name ?? defaultLabel;
  const identityCount = groupBuilder.identities.length;

  const updateDraft = (draft: ApiCreateGroup) => {
    setGroupBuilderDraft(draft);
  };

  const openPanel = (panel: CreateWaveInlineGroupPanel) => {
    setGroupBuilderRule(null);
    setGroupBuilderPanel(panel);
  };

  const onCreateAndUse = async () => {
    if (!canCreateDraft) {
      return;
    }

    setIsCreating(true);
    try {
      const nextPayload: ApiCreateGroup = {
        ...groupBuilder.draft,
        name: buildInlineGroupName({
          waveName,
          groupLabel,
        }),
      };

      const createdGroup = await onInlineGroupCreate(nextPayload);
      if (!createdGroup) {
        return;
      }

      onGroupSelect(createdGroup);
      resetGroupBuilder();
      setGroupBuilderRule(null);
      setGroupBuilderPanel("actions");
    } finally {
      setIsCreating(false);
    }
  };

  const onExistingGroupSelect = (group: ApiGroupFull | null) => {
    onGroupSelect(group);
    if (group) {
      resetGroupBuilder();
      setGroupBuilderRule(null);
      setGroupBuilderPanel("actions");
    }
  };

  const renderRuleEditor = () => {
    const draft = groupBuilder.draft;
    const activeRule = groupBuilder.activeRule;

    if (activeRule === null) {
      return null;
    }

    switch (activeRule) {
      case CreateWaveInlineGroupRuleType.LEVEL:
        return (
          <GroupCreateLevel
            level={draft.group.level}
            setLevel={(level) =>
              updateDraft({
                ...draft,
                group: { ...draft.group, level },
              })
            }
          />
        );
      case CreateWaveInlineGroupRuleType.TDH:
        return (
          <GroupCreateTDH
            tdh={draft.group.tdh}
            setTDH={(tdh) =>
              updateDraft({
                ...draft,
                group: { ...draft.group, tdh },
              })
            }
          />
        );
      case CreateWaveInlineGroupRuleType.CIC:
        return (
          <GroupCreateCIC
            cic={draft.group.cic}
            setCIC={(cic) =>
              updateDraft({
                ...draft,
                group: { ...draft.group, cic },
              })
            }
          />
        );
      case CreateWaveInlineGroupRuleType.REP:
        return (
          <GroupCreateRep
            rep={draft.group.rep}
            setRep={(rep) =>
              updateDraft({
                ...draft,
                group: { ...draft.group, rep },
              })
            }
          />
        );
      case CreateWaveInlineGroupRuleType.NFTS:
        return (
          <GroupCreateNfts
            nfts={draft.group.owns_nfts}
            setNfts={(owns_nfts) =>
              updateDraft({
                ...draft,
                group: { ...draft.group, owns_nfts },
              })
            }
          />
        );
      case CreateWaveInlineGroupRuleType.COLLECTIONS:
        return (
          <GroupCreateCollections
            nfts={draft.group.owns_nfts}
            setNfts={(owns_nfts) =>
              updateDraft({
                ...draft,
                group: { ...draft.group, owns_nfts },
              })
            }
          />
        );
      case CreateWaveInlineGroupRuleType.XTDH_GRANT:
        return (
          <CreateWaveInlineGroupXtdhGrant
            beneficiaryGrantId={draft.group.is_beneficiary_of_grant_id}
            setBeneficiaryGrantId={(is_beneficiary_of_grant_id) =>
              updateDraft({
                ...draft,
                group: {
                  ...draft.group,
                  is_beneficiary_of_grant_id:
                    is_beneficiary_of_grant_id ?? null,
                },
              })
            }
          />
        );
      default:
        return assertUnreachable(activeRule);
    }
  };

  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4">
      <div className="tw-space-y-3">
        <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-3">
          <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
            Current state
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
            {currentStateLabel}
          </p>
          {draftSummary && (
            <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                Draft
              </span>
              {identityCount > 0 ? (
                <DraftChipButton
                  label={`${identityCount} ${
                    identityCount === 1 ? "identity" : "identities"
                  }`}
                  disabled={disabled}
                  onClick={() => openPanel("identity")}
                />
              ) : (
                <DraftChipButton
                  label="+ Add identity"
                  disabled={disabled}
                  onClick={() => openPanel("identity")}
                />
              )}
              {configuredRules.map((rule) => (
                <DraftChipButton
                  key={rule}
                  label={CREATE_WAVE_INLINE_GROUP_RULE_LABELS[rule]}
                  disabled={disabled}
                  onClick={() => setGroupBuilderRule(rule)}
                />
              ))}
              <DraftChipButton
                label="+ Add rule"
                disabled={disabled}
                onClick={() => openPanel("rule-list")}
              />
              <DraftChipButton
                label="Use existing group"
                disabled={disabled}
                onClick={() => openPanel("search")}
              />
            </div>
          )}
        </div>

        {groupBuilder.panel === "actions" && !draftSummary && (
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <ActionButton
              label="Add identity"
              disabled={disabled}
              onClick={() => openPanel("identity")}
            />
            <ActionButton
              label="Add rule"
              disabled={disabled}
              onClick={() => openPanel("rule-list")}
            />
            <ActionButton
              label="Use existing group"
              disabled={disabled}
              onClick={() => openPanel("search")}
            />
          </div>
        )}

        {groupBuilder.panel === "identity" && (
          <div className="tw-space-y-3">
            <PanelHeader
              title="Add identity"
              backLabel="Back to options"
              onBack={() => openPanel("actions")}
            />
            <CreateWaveInlineGroupIdentities
              identities={groupBuilder.identities}
              onIdentitySelect={addGroupBuilderIdentity}
              onRemove={removeGroupBuilderIdentity}
            />
          </div>
        )}

        {groupBuilder.panel === "rule-list" && (
          <div className="tw-space-y-3">
            <PanelHeader
              title="Add rule"
              backLabel="Back to options"
              onBack={() => openPanel("actions")}
            />
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {CREATE_WAVE_INLINE_GROUP_RULE_OPTIONS.map((rule) => (
                <ActionButton
                  key={rule}
                  label={CREATE_WAVE_INLINE_GROUP_RULE_LABELS[rule]}
                  disabled={disabled}
                  onClick={() => setGroupBuilderRule(rule)}
                />
              ))}
            </div>
          </div>
        )}

        {groupBuilder.panel === "rule-editor" &&
          groupBuilder.activeRule !== null && (
            <div className="tw-space-y-3">
              <PanelHeader
                title={
                  CREATE_WAVE_INLINE_GROUP_RULE_LABELS[groupBuilder.activeRule]
                }
                backLabel="Back to rules"
                onBack={() => {
                  setGroupBuilderRule(null);
                  setGroupBuilderPanel("rule-list");
                }}
              />
              {renderRuleEditor()}
            </div>
          )}

        {groupBuilder.panel === "search" && (
          <div className="tw-space-y-3">
            <PanelHeader
              title="Use existing group"
              backLabel="Back to options"
              onBack={() => openPanel("actions")}
            />
            <CreateWaveGroupSearchField
              label="Search groups…"
              defaultLabel={defaultLabel}
              disabled={disabled}
              selectedGroup={selectedGroup}
              onSelect={onExistingGroupSelect}
            />
          </div>
        )}

        {groupBuilder.panel !== "search" && draftSummary && (
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/60 tw-p-3">
            <div className="tw-min-w-0">
              <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
                Ready to create this inline group
              </p>
              <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
                {validation.valid
                  ? draftSummary
                  : "Draft is incomplete. Check the selected rules before creating it."}
              </p>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <button
                type="button"
                onClick={resetGroupBuilder}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition tw-duration-200 desktop-hover:hover:tw-bg-iron-800"
              >
                Start over
              </button>
              <button
                type="button"
                disabled={!canCreateDraft}
                onClick={onCreateAndUse}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-primary-600"
              >
                {isCreating ? "Creating..." : "Create + use"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
