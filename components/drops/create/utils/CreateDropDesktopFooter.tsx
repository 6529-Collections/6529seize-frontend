import PrimaryButton from "../../../utils/buttons/PrimaryButton";
import CreateDropSelectFile from "./select-file/CreateDropSelectFile";

export default function CreateDropDesktopFooter({
  file,
  onFileChange,
  onDrop,
}: {
  readonly file: File | null;
  readonly onFileChange: (file: File | null) => void;
  readonly onDrop: () => void;
}) {
  return (
    <div className="tw-w-full tw-inline-flex tw-justify-between tw-items-center">
      <CreateDropSelectFile onFileChange={onFileChange} file={file} />
      <PrimaryButton onClick={onDrop}>Drop</PrimaryButton>
    </div>
  );
}
