import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import PrimaryButton from "../../../utils/buttons/PrimaryButton";
import { CreateDropType } from "../CreateDrop";
import CreateDropSelectFile from "./select-file/CreateDropSelectFile";
import CreateDropChallengeAcceptButton from "./challenge/CreateDropChallengeAcceptButton";

export default function CreateDropDesktopFooter({
  file,
  disabled,
  type,
  loading,
  onFileChange,
  onDrop,
}: {
  readonly file: File | null;
  readonly disabled: boolean;
  readonly type: CreateDropType;
  readonly loading: boolean;
  readonly onFileChange: (file: File | null) => void;
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
      <CreateDropSelectFile onFileChange={onFileChange} file={file} />
      <div className="tw-mt-4 tw-gap-x-3 tw-flex tw-justify-end">
        {/* <CreateDropChallengeAcceptButton /> */}
        <PrimaryButton onClick={onDrop} disabled={disabled} loading={loading}>
          {getText()}
        </PrimaryButton>
      </div>
    </div>
  );
}
