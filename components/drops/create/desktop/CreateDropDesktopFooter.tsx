import CreateDropSelectFile from "../utils/select-file/CreateDropSelectFile";


export default function CreateDropDesktopFooter(
  { 
    onFileChange
  }: {
    readonly onFileChange: (file: File) => void;
  }
) {
  return (
    <div className="tw-w-full tw-inline-flex tw-justify-between">
      <CreateDropSelectFile onFileChange={onFileChange} />
      <button>Drop</button>
    </div>
  );
}
