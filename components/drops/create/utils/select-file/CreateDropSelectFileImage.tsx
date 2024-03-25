import { useRef } from "react";

export default function CreateDropSelectFileImage({
  onFileChange,
}: {
  readonly onFileChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label htmlFor="create-drop-image-input">
        <svg
          className="tw-cursor-pointer tw-h-5 tw-w-5 tw-text-iron-300"
          viewBox="0 0 512 512"
          fill="currentColor"
          aria-hidden="true"
        >
          <g>
            <path d="m412 476h-312c-55.141 0-100-44.86-100-100v-240c0-55.14 44.859-100 100-100h312c55.141 0 100 44.86 100 100v240c0 55.14-44.859 100-100 100zm-312-400c-33.084 0-60 26.916-60 60v240c0 33.084 26.916 60 60 60h312c33.084 0 60-26.916 60-60v-240c0-33.084-26.916-60-60-60z"></path>
            <path d="m176 236c-33.084 0-60-26.916-60-60s26.916-60 60-60 60 26.916 60 60-26.916 60-60 60zm0-80c-11.028 0-20 8.972-20 20s8.972 20 20 20 20-8.972 20-20-8.972-20-20-20z"></path>
            <path d="m401.857 390.142-105.857-105.858-65.857 65.858c-7.811 7.811-20.475 7.811-28.285 0l-25.858-25.858-61.857 65.858c-18.697 18.697-47.008-9.559-28.285-28.284l76-80c7.811-7.811 20.475-7.811 28.285 0l25.857 25.858 65.857-65.858c7.811-7.811 20.475-7.811 28.285 0l120 120c18.955 18.957-9.835 46.733-28.285 28.284z"></path>
          </g>
        </svg>
        <input
          id="create-drop-image-input"
          ref={inputRef}
          type="file"
          className="tw-hidden"
          accept="image/*"
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
