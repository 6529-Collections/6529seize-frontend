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
    <div>
      <CreateDropSelectFile onFileChange={onFileChange} file={file} />
      <div className="tw-mt-4 tw-flex tw-justify-end">
        <PrimaryButton onClick={onDrop}>Drop</PrimaryButton>
      </div>
    </div>
  );
}
