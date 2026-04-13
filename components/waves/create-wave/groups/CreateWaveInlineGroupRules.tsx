import type { ReactNode } from "react";
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

export function CreateWaveInlineGroupRuleList({
  disabled,
  onRuleOpen,
}: {
  readonly disabled: boolean;
  readonly onRuleOpen: (rule: CreateWaveInlineGroupRuleType) => void;
}) {
  return (
    <div className="tw-space-y-3">
      <div className="tw-flex tw-flex-wrap tw-gap-1.5">
        {CREATE_WAVE_INLINE_GROUP_RULE_OPTIONS.map((rule) => (
          <DraftChipButton
            key={rule}
            label={CREATE_WAVE_INLINE_GROUP_RULE_LABELS[rule]}
            disabled={disabled}
            compact={true}
            onClick={() => onRuleOpen(rule)}
          />
        ))}
      </div>
    </div>
  );
}

export function CreateWaveInlineGroupRuleEditorPanel({
  activeRule,
  disabled,
  onRuleToggle,
  children,
}: {
  readonly activeRule: CreateWaveInlineGroupRuleType;
  readonly disabled: boolean;
  readonly onRuleToggle: (rule: CreateWaveInlineGroupRuleType) => void;
  readonly children: ReactNode;
}) {
  return (
    <div className="tw-space-y-3">
      <div className="tw-flex tw-flex-wrap tw-gap-1.5">
        {CREATE_WAVE_INLINE_GROUP_RULE_OPTIONS.map((rule) => (
          <DraftChipButton
            key={rule}
            label={CREATE_WAVE_INLINE_GROUP_RULE_LABELS[rule]}
            disabled={disabled}
            active={activeRule === rule}
            compact={true}
            isToggle={true}
            onClick={() => onRuleToggle(rule)}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
