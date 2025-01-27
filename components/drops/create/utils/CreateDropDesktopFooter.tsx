import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import PrimaryButton from "../../../utils/button/PrimaryButton";
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
        <PrimaryButton 
          onClicked={onDrop} 
          disabled={disabled} 
          loading={loading}
          padding="tw-px-4 tw-py-2.5"
        >
          {getText()}
        </PrimaryButton>
      </div>
    </div>
  );
}
