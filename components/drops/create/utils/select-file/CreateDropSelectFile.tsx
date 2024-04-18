import CreateDropSelectedFileIcon from "./CreateDropSelectedFileIcon";
import CreateDropSelectFileAudio from "./CreateDropSelectFileAudio";

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
    <div>
      <label className="tw-block tw-font-medium tw-text-iron-300 tw-text-sm">
        Upload Media
      </label>
      <div className="tw-mt-1.5 tw-flex tw-items-center tw-gap-x-2 lg:tw-gap-x-1">
        <CreateDropSelectFileImage onFileChange={onFileChange} />
        <CreateDropSelectFileVideo onFileChange={onFileChange} />
        <CreateDropSelectFileAudio onFileChange={onFileChange} />
      </div>

      {file && (
        <div className="tw-mt-2 tw-w-full tw-px-2 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-700  tw-bg-iron-800 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out">
          <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-x-1 tw-truncate">
            <p className="tw-mb-0 tw-max-w-xl tw-text-sm tw-font-medium tw-text-iron-50 tw-truncate">
              {file.name}
            </p>
            <div className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-full tw-bg-transparent hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out">
              <button
                onClick={() => onFileChange(null)}
                aria-label="Remove file"
                className="tw-group tw-bg-transparent tw-border-none"
              >
                <svg
                  className="tw-w-5 tw-h-5 tw-text-red group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out"
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
          </div>
          <div className="tw-mt-2 tw-flex tw-gap-x-3">
            <div className="tw-h-full tw-w-full">
              <img
                src="https://d3lqz0a4bldqgf.cloudfront.net/drops/author_7c6c885e-87b2-11ee-9661-02424e2c14ad/9aecc1ce-14ba-4266-8644-3aca20639bc6.gif"
                alt=""
                className="tw-w-full tw-h-full tw-object-center tw-object-contain"
              />
            </div>
            {/*   <CreateDropSelectedFileIcon file={file} /> */}
          </div>
        </div>
      )}
    </div>
  );
}
