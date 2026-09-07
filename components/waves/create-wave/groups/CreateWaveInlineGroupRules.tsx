import type { ReactNode } from "react";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  CREATE_WAVE_INLINE_GROUP_MORE_RULES,
  CREATE_WAVE_INLINE_GROUP_QUICK_RULES,
  CREATE_WAVE_INLINE_GROUP_RULE_LABELS,
  getInlineGroupConfiguredRules,
  type CreateWaveInlineGroupRuleType,
} from "./createWaveInlineGroupBuilder";
import { DraftChipButton } from "./CreateWaveInlineGroupButtons";

const CREATE_WAVE_INLINE_GROUP_RULE_OPTIONS = [
  ...CREATE_WAVE_INLINE_GROUP_QUICK_RULES,
  ...CREATE_WAVE_INLINE_GROUP_MORE_RULES,
] as const;

function CreateWaveInlineGroupCriteriaTabs({
  activeRule,
  draft,
  disabled,
  identityActive,
  onIdentityToggle,
  onRuleToggle,
}: {
  readonly activeRule: CreateWaveInlineGroupRuleType | null;
  readonly draft: ApiCreateGroup;
  readonly disabled: boolean;
  readonly identityActive: boolean;
  readonly onIdentityToggle?: (() => void) | undefined;
  readonly onRuleToggle: (rule: CreateWaveInlineGroupRuleType) => void;
}) {
  const locale = useBrowserLocale();
  const configuredRules = new Set(getInlineGroupConfiguredRules(draft));
  const identitiesConfigured =
    (draft.group.identity_addresses?.length ?? 0) > 0 ||
    (draft.group.excluded_identity_addresses?.length ?? 0) > 0;
  const configuredLabel = t(locale, "waves.create.groups.rules.configured");
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-1.5">
      {onIdentityToggle ? (
        <DraftChipButton
          label={t(locale, "waves.create.groups.identities")}
          disabled={disabled}
          active={identityActive}
          configured={identitiesConfigured}
          configuredLabel={configuredLabel}
          compact={true}
          prominent={true}
          isToggle={true}
          onClick={onIdentityToggle}
        />
      ) : null}
      {CREATE_WAVE_INLINE_GROUP_RULE_OPTIONS.map((rule) => (
        <DraftChipButton
          key={rule}
          label={CREATE_WAVE_INLINE_GROUP_RULE_LABELS[rule]}
          disabled={disabled}
          active={activeRule === rule}
          configured={configuredRules.has(rule)}
          configuredLabel={configuredLabel}
          compact={true}
          prominent={true}
          isToggle={activeRule !== null || identityActive}
          onClick={() => onRuleToggle(rule)}
        />
      ))}
    </div>
  );
}

export function CreateWaveInlineGroupRuleList({
  draft,
  disabled,
  onIdentityOpen,
  onRuleOpen,
}: {
  readonly draft: ApiCreateGroup;
  readonly disabled: boolean;
  readonly onIdentityOpen?: (() => void) | undefined;
  readonly onRuleOpen: (rule: CreateWaveInlineGroupRuleType) => void;
}) {
  return (
    <div className="tw-space-y-3">
      <CreateWaveInlineGroupCriteriaTabs
        activeRule={null}
        draft={draft}
        disabled={disabled}
        identityActive={false}
        onIdentityToggle={onIdentityOpen}
        onRuleToggle={onRuleOpen}
      />
    </div>
  );
}

export function CreateWaveInlineGroupRuleEditorPanel({
  activeRule,
  draft,
  disabled,
  onIdentityToggle,
  onRuleToggle,
  children,
}: {
  readonly activeRule: CreateWaveInlineGroupRuleType;
  readonly draft: ApiCreateGroup;
  readonly disabled: boolean;
  readonly onIdentityToggle?: (() => void) | undefined;
  readonly onRuleToggle: (rule: CreateWaveInlineGroupRuleType) => void;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-space-y-3">
      <CreateWaveInlineGroupCriteriaTabs
        activeRule={activeRule}
        draft={draft}
        disabled={disabled}
        identityActive={false}
        onIdentityToggle={onIdentityToggle}
        onRuleToggle={onRuleToggle}
      />
      {children}
    </div>
  );
}

export function CreateWaveInlineGroupIdentityEditorPanel({
  children,
  draft,
  disabled,
  onIdentityToggle,
  onRuleToggle,
}: {
  readonly children: ReactNode;
  readonly draft: ApiCreateGroup;
  readonly disabled: boolean;
  readonly onIdentityToggle: () => void;
  readonly onRuleToggle: (rule: CreateWaveInlineGroupRuleType) => void;
}) {
  return (
    <div className="tw-space-y-3">
      <CreateWaveInlineGroupCriteriaTabs
        activeRule={null}
        draft={draft}
        disabled={disabled}
        identityActive={true}
        onIdentityToggle={onIdentityToggle}
        onRuleToggle={onRuleToggle}
      />
      {children}
    </div>
  );
}
