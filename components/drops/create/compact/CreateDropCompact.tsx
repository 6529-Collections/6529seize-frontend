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
import CreateDropSelectedFileIcon from "../utils/select-file/CreateDropSelectedFileIcon";

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
      {/* {title && (
        <CreateDropCompactTitle
          title={title}
          onEditClick={() => onViewChange(CreateDropViewType.FULL)}
        />
      )} */}
      <div className="tw-inline-flex tw-w-full tw-items-start tw-gap-x-2 sm:tw-gap-x-3">
        <DropPfp pfpUrl={profile.profile?.pfp_url} />
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
          {/* <div className="tw-self-end">
            <button
              type="button"
              className="tw-group tw-border-t tw-border-solid tw-border-white/[0.15] hover:tw-border-none hover:tw-shadow-drop-btn-active hover:tw-bg-gradient-radial tw-bg-iron-700 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-px-4 tw-h-[44px] tw-text-sm tw-font-semibold tw-text-white tw-border-0 focus:tw-outline-none tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-text-iron-400 group-hover:tw-text-iron-100 tw-h-4 tw-w-4 tw-transition tw-duration-300 tw-ease-out"
                enable-background="new 0 0 512.026 512.026"
                aria-hidden="true"
                height="512"
                viewBox="0 0 512.026 512.026"
                width="512"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path
                    fill="currentColor"
                    d="m184.08 168.475c0-6.176 0-24.972-32.198-75.789-15.122-23.868-30.016-43.309-30.643-44.125l-11.896-15.491-11.896 15.491c-.627.816-15.52 20.258-30.643 44.125-32.197 50.817-32.197 69.613-32.197 75.789 0 41.21 33.526 74.736 74.736 74.736s74.737-33.526 74.737-74.736z"
                  ></path>
                  <path
                    fill="currentColor"
                    d="m453.366 47.887c-11.097-17.514-22.038-31.796-22.499-32.396l-11.896-15.491-11.896 15.491c-.46.6-11.402 14.882-22.499 32.396-10.326 16.297-24.053 39.969-24.053 57.313 0 32.229 26.22 58.448 58.448 58.448s58.448-26.22 58.448-58.448c0-17.345-13.727-41.016-24.053-57.313z"
                  ></path>
                  <path
                    fill="currentColor"
                    d="m291.862 151.462-11.896-15.491-11.896 15.491c-1.22 1.589-30.217 39.44-59.705 85.981-40.649 64.156-61.26 111.838-61.26 141.721 0 73.26 59.602 132.862 132.862 132.862s132.861-59.602 132.861-132.862c0-29.883-20.611-77.565-61.26-141.721-29.489-46.541-58.485-84.392-59.706-85.981z"
                  ></path>
                </g>
              </svg>
            </button>
            <button
              type="button"
              className="tw-bg-gradient-radial tw-shadow-drop-btn-active tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-px-4 tw-h-[44px] tw-text-sm tw-font-semibold tw-text-white tw-border-0 focus:tw-outline-none tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-text-iron-100 tw-h-4 tw-w-4"
                enable-background="new 0 0 512.026 512.026"
                aria-hidden="true"
                height="512"
                viewBox="0 0 512.026 512.026"
                width="512"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path
                    fill="currentColor"
                    d="m184.08 168.475c0-6.176 0-24.972-32.198-75.789-15.122-23.868-30.016-43.309-30.643-44.125l-11.896-15.491-11.896 15.491c-.627.816-15.52 20.258-30.643 44.125-32.197 50.817-32.197 69.613-32.197 75.789 0 41.21 33.526 74.736 74.736 74.736s74.737-33.526 74.737-74.736z"
                  ></path>
                  <path
                    fill="currentColor"
                    d="m453.366 47.887c-11.097-17.514-22.038-31.796-22.499-32.396l-11.896-15.491-11.896 15.491c-.46.6-11.402 14.882-22.499 32.396-10.326 16.297-24.053 39.969-24.053 57.313 0 32.229 26.22 58.448 58.448 58.448s58.448-26.22 58.448-58.448c0-17.345-13.727-41.016-24.053-57.313z"
                  ></path>
                  <path
                    fill="currentColor"
                    d="m291.862 151.462-11.896-15.491-11.896 15.491c-1.22 1.589-30.217 39.44-59.705 85.981-40.649 64.156-61.26 111.838-61.26 141.721 0 73.26 59.602 132.862 132.862 132.862s132.861-59.602 132.861-132.862c0-29.883-20.611-77.565-61.26-141.721-29.489-46.541-58.485-84.392-59.706-85.981z"
                  ></path>
                </g>
              </svg>
            </button> 
          </div> */}
          <div className="tw-self-end">
            <PrimaryButton onClick={onDrop}>Drop</PrimaryButton>
          </div>
        </div>
      </div>

      {file && (
        <div>
          <div className="tw-mt-3 tw-ml-[3.25rem]">
            <div className="tw-w-full tw-px-4 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out">
              <div className="tw-flex tw-items-center tw-gap-x-1 tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-x-3 tw-truncate">
                  <CreateDropSelectedFileIcon file={file} />

                  <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-50 tw-truncate">
                    {file.name}
                  </p>
                </div>
                <button
                  onClick={() => onFileChange(null)}
                  type="button"
                  className="-tw-mb-0.5 tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-bg-transparent tw-border-0 tw-rounded-full hover:tw-bg-iron-800"
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
          </div>
        </div>
      )}
    </div>
  );
}
