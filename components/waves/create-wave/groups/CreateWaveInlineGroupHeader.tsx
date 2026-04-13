import {
  CREATE_WAVE_INLINE_GROUP_RULE_LABELS,
  type CreateWaveInlineGroupRuleType,
} from "./createWaveInlineGroupBuilder";
import { DraftChipButton } from "./CreateWaveInlineGroupButtons";

export default function CreateWaveInlineGroupHeader({
  currentStateLabel,
  showModeChips,
  identityChipLabel,
  disabled,
  isIdentityPanel,
  isRulePanel,
  isSearchPanel,
  configuredRules,
  onIdentityToggle,
  onRuleOpen,
  onRulesToggle,
  onSearchToggle,
}: {
  readonly currentStateLabel: string;
  readonly showModeChips: boolean;
  readonly identityChipLabel: string;
  readonly disabled: boolean;
  readonly isIdentityPanel: boolean;
  readonly isRulePanel: boolean;
  readonly isSearchPanel: boolean;
  readonly configuredRules: readonly CreateWaveInlineGroupRuleType[];
  readonly onIdentityToggle: () => void;
  readonly onRuleOpen: (rule: CreateWaveInlineGroupRuleType) => void;
  readonly onRulesToggle: () => void;
  readonly onSearchToggle: () => void;
}) {
  return (
    <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-3">
      <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
        Current state
      </p>
      <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50">
        {currentStateLabel}
      </p>
      {showModeChips && (
        <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
            Draft
          </span>
          <DraftChipButton
            label={identityChipLabel}
            disabled={disabled}
            active={isIdentityPanel}
            isToggle={true}
            onClick={onIdentityToggle}
          />
          {!isRulePanel &&
            configuredRules.map((rule) => (
              <DraftChipButton
                key={rule}
                label={CREATE_WAVE_INLINE_GROUP_RULE_LABELS[rule]}
                disabled={disabled}
                onClick={() => onRuleOpen(rule)}
              />
            ))}
          <DraftChipButton
            label="Add rule"
            disabled={disabled}
            active={isRulePanel}
            isToggle={true}
            onClick={onRulesToggle}
          />
          <DraftChipButton
            label="Use existing group"
            disabled={disabled}
            active={isSearchPanel}
            isToggle={true}
            onClick={onSearchToggle}
          />
        </div>
      )}
    </div>
  );
}
