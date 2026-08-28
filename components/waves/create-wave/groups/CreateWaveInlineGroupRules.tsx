import type { ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  CREATE_WAVE_INLINE_GROUP_MORE_RULES,
  CREATE_WAVE_INLINE_GROUP_QUICK_RULES,
  CREATE_WAVE_INLINE_GROUP_RULE_LABELS,
  type CreateWaveInlineGroupRuleType,
} from "./createWaveInlineGroupBuilder";
import { DraftChipButton } from "./CreateWaveInlineGroupButtons";

const CREATE_WAVE_INLINE_GROUP_RULE_OPTIONS = [
  ...CREATE_WAVE_INLINE_GROUP_QUICK_RULES,
  ...CREATE_WAVE_INLINE_GROUP_MORE_RULES,
] as const;

function CreateWaveInlineGroupCriteriaTabs({
  activeRule,
  disabled,
  identityActive,
  onIdentityToggle,
  onRuleToggle,
}: {
  readonly activeRule: CreateWaveInlineGroupRuleType | null;
  readonly disabled: boolean;
  readonly identityActive: boolean;
  readonly onIdentityToggle?: (() => void) | undefined;
  readonly onRuleToggle: (rule: CreateWaveInlineGroupRuleType) => void;
}) {
  const locale = useBrowserLocale();
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-1.5">
      {onIdentityToggle ? (
        <DraftChipButton
          label={t(locale, "waves.create.groups.identities")}
          disabled={disabled}
          active={identityActive}
          compact={true}
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
          compact={true}
          isToggle={activeRule !== null || identityActive}
          onClick={() => onRuleToggle(rule)}
        />
      ))}
    </div>
  );
}

export function CreateWaveInlineGroupRuleList({
  disabled,
  onIdentityOpen,
  onRuleOpen,
}: {
  readonly disabled: boolean;
  readonly onIdentityOpen?: (() => void) | undefined;
  readonly onRuleOpen: (rule: CreateWaveInlineGroupRuleType) => void;
}) {
  return (
    <div className="tw-space-y-3">
      <CreateWaveInlineGroupCriteriaTabs
        activeRule={null}
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
  disabled,
  onIdentityToggle,
  onRuleToggle,
  children,
}: {
  readonly activeRule: CreateWaveInlineGroupRuleType;
  readonly disabled: boolean;
  readonly onIdentityToggle?: (() => void) | undefined;
  readonly onRuleToggle: (rule: CreateWaveInlineGroupRuleType) => void;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-space-y-3">
      <CreateWaveInlineGroupCriteriaTabs
        activeRule={activeRule}
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
  disabled,
  onIdentityToggle,
  onRuleToggle,
}: {
  readonly children: ReactNode;
  readonly disabled: boolean;
  readonly onIdentityToggle: () => void;
  readonly onRuleToggle: (rule: CreateWaveInlineGroupRuleType) => void;
}) {
  return (
    <div className="tw-space-y-3">
      <CreateWaveInlineGroupCriteriaTabs
        activeRule={null}
        disabled={disabled}
        identityActive={true}
        onIdentityToggle={onIdentityToggle}
        onRuleToggle={onRuleToggle}
      />
      {children}
    </div>
  );
}
