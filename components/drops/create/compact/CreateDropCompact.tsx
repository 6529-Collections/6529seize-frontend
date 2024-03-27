import {
  CreateDropScreenType,
  CreateDropViewType,
} from "../utils/CreateDropWrapper";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import DropPfp from "../utils/DropPfp";
import CreateDropContent from "../utils/CreateDropContent";
import { EditorState } from "lexical";
import {
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import CreateDropCompactTitle from "./CreateDropCompactTitle";
import PrimaryButton from "../../../utils/buttons/PrimaryButton";

export default function CreateDropCompact({
  profile,
  editorState,
  screenType,
  file,
  title,
  metadata,
  onViewChange,
  onMetadataRemove,
  onEditorState,
  onMentionedUser,
  onReferencedNft,
  onFileChange,
  onDrop,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly screenType: CreateDropScreenType;
  readonly editorState: EditorState | null;
  readonly title: string | null;
  readonly file: File | null;
  readonly metadata: DropMetadata[];
  readonly onViewChange: (newV: CreateDropViewType) => void;
  readonly onMetadataRemove: (key: string) => void;
  readonly onEditorState: (editorState: EditorState | null) => void;
  readonly onMentionedUser: (newUser: MentionedUser) => void;
  readonly onReferencedNft: (newNft: ReferencedNft) => void;
  readonly onFileChange: (file: File | null) => void;
  readonly onDrop: () => void;
}) {
  return (
    <div className="tw-p-4 sm:tw-p-5 tw-bg-iron-900 tw-border tw-border-iron-700 tw-border-solid tw-rounded-xl">
      {title && (
        <CreateDropCompactTitle
          title={title}
          onEditClick={() => onViewChange(CreateDropViewType.FULL)}
        />
      )}
      <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2 sm:tw-gap-x-3">
        <div className="tw-mt-0.5">
          <DropPfp pfpUrl={profile.profile?.pfp_url} />
        </div>
        <div className="tw-w-full tw-flex tw-gap-x-2 sm:tw-gap-x-3">
          <div className="tw-w-full">
            <CreateDropContent
              screenType={screenType}
              viewType={CreateDropViewType.COMPACT}
              editorState={editorState}
              onEditorState={onEditorState}
              onMentionedUser={onMentionedUser}
              onReferencedNft={onReferencedNft}
              onViewClick={() => onViewChange(CreateDropViewType.FULL)}
              onFileChange={onFileChange}
            />
          </div>
          <div className="tw-self-end">
            <PrimaryButton onClick={onDrop}>Drop</PrimaryButton>
          </div>
        </div>
      </div>

      {file && (
        <div>
          <div className="tw-mt-2 tw-ml-[3.25rem] tw-flex tw-items-center tw-gap-x-2">
            <svg
              className="tw-w-auto tw-h-5"
              viewBox="0 0 384 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M67.1934 0H238.437L383.485 151.327V445.321C383.485 482.124 353.61 512 316.806 512H67.1934C30.39 512 0.514404 482.124 0.514404 445.321V66.679C0.514404 29.8756 30.39 0 67.1934 0Z"
                fill="#60606C"
              />
              <path
                opacity="0.302"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M238.221 0V150.028H383.486L238.221 0Z"
                fill="#ffffff"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M269.128 240H115.026C103.488 240 94 249.487 94 261.026V358.974C94 370.512 103.487 380 115.026 380H269.128C280.666 380 289.897 370.513 289.897 358.974V261.025C289.897 249.487 280.667 240 269.128 240ZM157.077 266.41C169.641 266.41 179.641 276.666 179.641 288.974C179.641 301.538 169.641 311.794 157.077 311.794C144.513 311.794 134.257 301.538 134.257 288.974C134.257 276.666 144.513 266.41 157.077 266.41ZM276.051 358.974C276.051 362.82 272.974 366.153 269.128 366.153H115.026C111.18 366.153 108.103 362.82 108.103 358.974V354.872L136.051 326.923L159.128 350C161.949 352.821 166.307 352.821 169.128 350L227.077 292.051L276.051 341.026V358.974Z"
                fill="white"
              />
            </svg>
            <svg
              className="tw-w-auto tw-h-5"
              viewBox="0 0 383 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M66.679 0H237.923L382.971 151.327V445.321C382.971 482.124 353.095 512 316.292 512H66.679C29.8756 512 0 482.124 0 445.321V66.679C0 29.8756 29.8756 0 66.679 0Z"
                fill="#60606C"
              />
              <path
                d="M195.197 214.174C192.413 212.596 189.002 212.61 186.23 214.21L113.03 256.472C125.427 263.629 184.486 297.727 191.223 301.616L269.441 256.245L195.197 214.174Z"
                fill="white"
              />
              <path
                d="M104.001 356.636C104.001 359.863 105.722 362.843 108.515 364.457L182.203 407V317.263L104 272.112L104.001 356.636Z"
                fill="white"
              />
              <path
                d="M278.466 356.636V271.889L200.264 317.251V407L273.951 364.457C276.746 362.843 278.466 359.863 278.466 356.636Z"
                fill="white"
              />
              <path
                opacity="0.302"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M237.707 0V150.028H382.972L237.707 0Z"
                fill="white"
              />
            </svg>
            <svg
              className="tw-w-auto tw-h-5"
              viewBox="0 0 383 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M66.679 0H237.923L382.971 151.327V445.321C382.971 482.124 353.095 512 316.292 512H66.679C29.8756 512 0 482.124 0 445.321V66.679C0 29.8756 29.8756 0 66.679 0Z"
                fill="#60606C"
              />
              <path
                opacity="0.302"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M237.707 0V150.028H382.972L237.707 0Z"
                fill="white"
              />
              <g clip-path="url(#clip0_8489_2290)">
                <path
                  d="M209.766 231.665C207.655 230.658 205.168 230.924 203.348 232.393L144.331 279.603H116.133C109.448 279.603 104 285.051 104 291.737V340.27C104 346.968 109.448 352.403 116.133 352.403H144.331L203.336 399.614C204.44 400.488 205.787 400.937 207.133 400.937C208.031 400.937 208.929 400.73 209.766 400.33C211.865 399.323 213.2 397.2 213.2 394.87V237.137C213.2 234.807 211.865 232.684 209.766 231.665Z"
                  fill="white"
                />
                <path
                  d="M243.909 273.1C241.519 270.746 237.685 270.782 235.331 273.148C232.977 275.539 233.002 279.373 235.38 281.739C244.552 290.79 249.6 302.96 249.6 316.003C249.6 329.047 244.552 341.216 235.38 350.268C233.002 352.61 232.977 356.456 235.331 358.846C236.52 360.047 238.085 360.642 239.638 360.642C241.179 360.642 242.72 360.059 243.909 358.882C255.412 347.562 261.733 332.323 261.733 316.003C261.733 299.684 255.412 284.444 243.909 273.1Z"
                  fill="white"
                />
                <path
                  d="M261.03 256.004C258.639 253.638 254.805 253.662 252.439 256.04C250.085 258.419 250.11 262.265 252.476 264.619C266.271 278.293 273.867 296.542 273.867 316.003C273.867 335.465 266.271 353.702 252.476 367.376C250.11 369.742 250.085 373.588 252.439 375.966C253.64 377.155 255.193 377.75 256.747 377.75C258.287 377.75 259.841 377.168 261.03 375.991C277.143 360.035 286 338.729 286 316.003C286 293.278 277.143 271.972 261.03 256.004Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_8489_2290">
                  <rect
                    width="182"
                    height="182"
                    fill="white"
                    transform="translate(104 225)"
                  />
                </clipPath>
              </defs>
            </svg>
            <svg
              className="tw-w-auto tw-h-5"
              viewBox="0 0 383 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M66.679 0H237.923L382.971 151.327V445.321C382.971 482.124 353.095 512 316.292 512H66.679C29.8756 512 0 482.124 0 445.321V66.679C0 29.8756 29.8756 0 66.679 0Z"
                fill="#60606C"
              />
              <path
                opacity="0.302"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M237.707 0V150.028H382.972L237.707 0Z"
                fill="white"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M118.75 237C107.92 237 99 245.92 99 256.75V276.5V375.25C99 386.08 107.92 395 118.75 395H243.833H263.583C272.382 395 279.916 389.118 282.433 381.1C283.014 379.25 283.333 377.281 283.333 375.25V355.5V276.5V256.75C283.333 245.92 274.413 237 263.583 237H118.75ZM118.75 250.167H131.917V269.917H112.167V256.75C112.167 256.286 112.213 255.834 112.295 255.4C112.895 252.363 115.5 250.167 118.75 250.167ZM145.083 250.167H164.833V269.917H145.083V250.167ZM178 250.167H204.333V269.917H178V250.167ZM217.5 250.167H237.25V269.917H217.5V250.167ZM250.417 250.167H263.583C267.297 250.167 270.167 253.036 270.167 256.75V269.917H250.417V250.167ZM178.077 289.68C179.241 289.691 180.381 290.01 181.382 290.605L214.298 310.355C215.273 310.94 216.079 311.768 216.639 312.757C217.199 313.746 217.493 314.863 217.493 316C217.493 317.137 217.199 318.254 216.639 319.243C216.079 320.232 215.273 321.06 214.298 321.645L181.382 341.395C180.383 341.992 179.243 342.315 178.079 342.329C176.915 342.343 175.769 342.048 174.756 341.474C173.743 340.9 172.9 340.068 172.314 339.063C171.727 338.057 171.418 336.914 171.417 335.75V296.25C171.418 295.086 171.729 293.943 172.316 292.938C172.903 291.933 173.746 291.101 174.76 290.528C175.771 289.958 176.916 289.665 178.077 289.68ZM112.167 362.083H131.917V381.833H118.75C115.036 381.833 112.167 378.964 112.167 375.25V362.083ZM145.083 362.083H164.833V381.833H145.083V362.083ZM178 362.083H204.333V381.833H178V362.083ZM217.5 362.083H237.25V381.833H217.5V362.083ZM250.417 362.083H270.167V375.25C270.167 378.964 267.297 381.833 263.583 381.833H250.417V362.083Z"
                fill="white"
              />
            </svg>

            <p className="tw-mb-0 tw-text-sm tw-font-normal tw-text-iron-50">
              {file.name}
            </p>
            <button
              onClick={() => onFileChange(null)}
              type="button"
              className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800"
            >
              <svg
                className="tw-w-5 tw-h-5 tw-text-red"
                viewBox="0 0 24 24"
                fill="none"
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
      )}
    </div>
  );
}
