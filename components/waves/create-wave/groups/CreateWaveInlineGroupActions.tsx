import { ActionButton } from "./CreateWaveInlineGroupButtons";

export default function CreateWaveInlineGroupActions({
  disabled,
  onAddIdentity,
  onAddRule,
  onUseExistingGroup,
}: {
  readonly disabled: boolean;
  readonly onAddIdentity: () => void;
  readonly onAddRule: () => void;
  readonly onUseExistingGroup: () => void;
}) {
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2">
      <ActionButton
        label="Add identity"
        disabled={disabled}
        onClick={onAddIdentity}
      />
      <ActionButton label="Add rule" disabled={disabled} onClick={onAddRule} />
      <ActionButton
        label="Use existing group"
        disabled={disabled}
        onClick={onUseExistingGroup}
      />
    </div>
  );
}
