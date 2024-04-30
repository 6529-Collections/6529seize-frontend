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
    <div>
      <div className="tw-mt-4 tw-gap-x-3 tw-flex tw-justify-end">
        <PrimaryButton onClick={onDrop} disabled={disabled} loading={loading}>
          {getText()}
        </PrimaryButton>
      </div>
    </div>
  );
}
