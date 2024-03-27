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
    <div className="tw-flex tw-space-x-4 tw-items-center">
      <div className="tw-flex tw-items-center tw-space-x-6">
        <CreateDropSelectFileImage onFileChange={onFileChange} />
        <CreateDropSelectFileVideo onFileChange={onFileChange} />
        <CreateDropSelectFileGLB onFileChange={onFileChange} />
        <CreateDropSelectFileAudio onFileChange={onFileChange} />
      </div>
      {file && (
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-50">
            {file.name}
          </p>
          <button
            onClick={() => onFileChange(null)}
            type="button"
            aria-label="Remove file"
            className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800"
          >
            <svg
              className="tw-w-5 tw-h-5 tw-text-red"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
