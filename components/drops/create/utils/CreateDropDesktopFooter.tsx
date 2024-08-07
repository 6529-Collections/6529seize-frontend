import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import PrimaryButton from "../../../utils/buttons/PrimaryButton";
import { CreateDropType } from "../CreateDrop";

export default function CreateDropDesktopFooter({
  disabled,
  type,
  loading,
  onDrop,
}: {
  readonly disabled: boolean;
  readonly type: CreateDropType;
  readonly loading: boolean;
  readonly onDrop: () => void;
}) {
  const getText = () => {
    switch (type) {
      case CreateDropType.DROP:
        return "Drop";
      case CreateDropType.QUOTE:
        return "Quote";
      default:
        assertUnreachable(type);
        return "";
    }
  };
  return (
    <div className="tw-pt-4 tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-700">
      <div className="tw-gap-x-3 tw-flex tw-justify-end">
        <PrimaryButton onClick={onDrop} disabled={disabled} loading={loading}>
          {getText()}
        </PrimaryButton>
      </div>
    </div>
  );
}
