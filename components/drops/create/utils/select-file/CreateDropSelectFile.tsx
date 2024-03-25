import CreateDropSelectFileAudio from "./CreateDropSelectFileAudio";
import CreateDropSelectFileGLB from "./CreateDropSelectFileGLB";
import CreateDropSelectFileImage from "./CreateDropSelectFileImage";
import CreateDropSelectFileVideo from "./CreateDropSelectFileVideo";

export default function CreateDropSelectFile({
  onFileChange,
}: {
  readonly onFileChange: (file: File) => void;
}) {
  return (
    <div className="tw-inline-flex tw-space-x-2">
      <CreateDropSelectFileImage onFileChange={onFileChange} />
      <CreateDropSelectFileVideo onFileChange={onFileChange} />
      <CreateDropSelectFileGLB onFileChange={onFileChange} />
      <CreateDropSelectFileAudio onFileChange={onFileChange} />
    </div>
  );
}
