import CreateDropSelectFileAudio from "./CreateDropSelectFileAudio";
import CreateDropSelectFileGLB from "./CreateDropSelectFileGLB";
import CreateDropSelectFileImage from "./CreateDropSelectFileImage";
import CreateDropSelectFileVideo from "./CreateDropSelectFileVideo";

export default function CreateDropSelectFile({
  file,
  onFileChange,
}: {
  readonly file: File | null;
  readonly onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="tw-inline-flex tw-space-x-4 tw-items-center">
      <div className="tw-inline-flex tw-space-x-2">
        <CreateDropSelectFileImage onFileChange={onFileChange} />
        <CreateDropSelectFileVideo onFileChange={onFileChange} />
        <CreateDropSelectFileGLB onFileChange={onFileChange} />
        <CreateDropSelectFileAudio onFileChange={onFileChange} />
      </div>
      {file && (
        <div>
          {file.name} <button onClick={() => onFileChange(null)}>X</button>
        </div>
      )}
    </div>
  );
}
