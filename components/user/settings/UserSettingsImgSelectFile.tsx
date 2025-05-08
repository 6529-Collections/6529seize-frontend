import { useContext, useRef, useState, useEffect } from "react";
import { AuthContext } from "../../auth/Auth";

const ACCEPTED_FORMATS = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

const ACCEPTED_FORMATS_DISPLAY = ACCEPTED_FORMATS.map(
  (format) => `.${format.replace("image/", "")}`
).join(", ");

const FILE_SIZE_LIMIT = 2097152;

export default function UserSettingsImgSelectFile({
  imageToShow,
  setFile,
}: {
  readonly imageToShow: string | null;
  readonly setFile: (file: File) => void;
}) {
  const { setToast } = useContext(AuthContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);
  const onFileChange = (file: File) => {
    setError(null);
    if (ACCEPTED_FORMATS.indexOf(file.type) === -1) {
      setError(null);
      setToast({
        type: "error",
        message: "Invalid file type",
      });
    } else if (file.size > FILE_SIZE_LIMIT) {
      setError("File size must be less than 2MB");
      setShake(true);
    } else {
      setError(null);
      setFile(file);
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e?.dataTransfer?.files?.length) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const [dragging, setDragging] = useState(false);

  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragging(true);
    } else if (e.type === "dragleave") {
      setDragging(false);
    } else if (e.type === "drop") {
      setDragging(false);
    }
  };

  useEffect(() => {
    if (shake) {
      const timeout = setTimeout(() => setShake(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [shake]);

  return (
    <div
      onDrop={handleDrop}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      className="tw-group tw-flex tw-items-center tw-justify-center tw-w-full"
    >
      <label
        className={`
        ${
          dragging
            ? "tw-border-iron-600 tw-bg-iron-800"
            : "tw-bg-iron-900 tw-border-iron-700"
        }
      tw-relative tw-flex tw-flex-col tw-items-center tw-justify-center tw-w-full tw-h-64 tw-border-2 tw-border-dashed tw-rounded-lg tw-cursor-pointer  hover:tw-border-iron-600 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out ${shake ? 'tw-animate-shake' : ''}
      `}
      >
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-pt-5 tw-pb-6">
          {imageToShow && (
            <div className="tw-h-40 tw-w-40">
              <img
                src={imageToShow}
                alt="Profile image"
                className="tw-h-full tw-w-full tw-object-contain tw-rounded-sm"
              />
            </div>
          )}
          {!imageToShow && (
            <>
              <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-900 group-hover:tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out">
                <div className="tw-flex tw-items-center tw-justify-center tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-50">
                  <svg
                    className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-text-iron-50"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 16.2422C2.79401 15.435 2 14.0602 2 12.5C2 10.1564 3.79151 8.23129 6.07974 8.01937C6.54781 5.17213 9.02024 3 12 3C14.9798 3 17.4522 5.17213 17.9203 8.01937C20.2085 8.23129 22 10.1564 22 12.5C22 14.0602 21.206 15.435 20 16.2422M8 16L12 12M12 12L16 16M12 12V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <p className="tw-mt-4 tw-mb-2 tw-text-sm tw-font-normal tw-text-iron-400">
                <span className="tw-font-medium tw-text-white">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="tw-text-xs tw-font-normal tw-text-iron-400">
                JPEG, JPG, PNG, GIF, WEBP
              </p>
            </>
          )}
          {error && (
            <p className="tw-absolute tw-bottom-2 tw-left-0 tw-w-full tw-text-center tw-text-xs tw-font-medium tw-text-red">
              {error}
            </p>
          )}
        </div>
        <input
          id="pfp-upload-input"
          ref={inputRef}
          type="file"
          className="tw-hidden"
          accept={ACCEPTED_FORMATS_DISPLAY}
          onChange={(e: any) => {
            if (e.target.files) {
              const f = e.target.files[0];
              onFileChange(f);
            }
          }}
        />
      </label>
    </div>
  );
}
