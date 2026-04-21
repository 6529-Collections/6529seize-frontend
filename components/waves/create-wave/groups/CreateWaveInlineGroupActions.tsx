import { ActionButton } from "./CreateWaveInlineGroupButtons";

export default function CreateWaveInlineGroupActions({
  disabled,
  identityActive,
  ruleActive,
  searchActive,
  onAddIdentity,
  onAddRule,
  onUseExistingGroup,
}: {
  readonly disabled: boolean;
  readonly identityActive: boolean;
  readonly ruleActive: boolean;
  readonly searchActive: boolean;
  readonly onAddIdentity: () => void;
  readonly onAddRule: () => void;
  readonly onUseExistingGroup: () => void;
}) {
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2 md:tw-absolute md:tw-right-0 md:tw-top-0 md:tw-justify-end">
      <ActionButton
        label="Add identity"
        disabled={disabled}
        active={identityActive}
        isToggle={true}
        onClick={onAddIdentity}
      />
      <ActionButton
        label="Add rule"
        disabled={disabled}
        active={ruleActive}
        isToggle={true}
        onClick={onAddRule}
      />
      <ActionButton
        label="Use existing group"
        disabled={disabled}
        active={searchActive}
        isToggle={true}
        onClick={onUseExistingGroup}
      />
    </div>
  );
}
