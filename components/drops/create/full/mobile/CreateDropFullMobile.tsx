import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import CreateDropFullMobileWrapper from "./CreateDropFullMobileWrapper";

import { EditorState } from "lexical";
import {
  CreateDropConfig,
  DropMetadata,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import CreateDropContent, {
  CreateDropContentHandles,
} from "../../utils/CreateDropContent";
import CreateDropFullMobileMetadata from "./CreateDropFullMobileMetadata";
import CreateDropSelectFile from "../../utils/file/CreateDropSelectFile";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { CreateDropType, CreateDropViewType } from "../../CreateDrop";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";
import CreateDropStormView from "../../utils/storm/CreateDropStormView";

enum TITLE_STATE {
  BUTTON = "BUTTON",
  INPUT = "INPUT",
}

export interface CreateDropFullMobileHandles {
  clearEditorState: () => void;
}

const CreateDropFullMobile = forwardRef<
  CreateDropFullMobileHandles,
  {
    readonly profile: IProfileAndConsolidations;
    readonly title: string | null;
    readonly editorState: EditorState | null;
    readonly metadata: DropMetadata[];
    readonly file: File | null;
    readonly canSubmit: boolean;
    readonly canAddPart: boolean;
    readonly type: CreateDropType;
    readonly loading: boolean;
    readonly showSubmit: boolean;
    readonly drop: CreateDropConfig | null;
    readonly onEditorState: (editorState: EditorState | null) => void;
    readonly onMetadataEdit: (param: DropMetadata) => void;
    readonly onMetadataRemove: (key: string) => void;
    readonly onMentionedUser: (
      newUser: Omit<MentionedUser, "current_handle">
    ) => void;
    readonly onReferencedNft: (newNft: ReferencedNft) => void;
    readonly onTitle: (newV: string | null) => void;
    readonly onFileChange: (file: File | null) => void;
    readonly onViewChange: (newV: CreateDropViewType) => void;
    readonly onDrop: () => void;
    readonly onDropPart: () => void;
  }
>(
  (
    {
      profile,
      title,
      editorState,
      metadata,
      file,
      canSubmit,
      canAddPart,
      type,
      loading,
      showSubmit,
      drop,
      onEditorState,
      onMetadataEdit,
      onMetadataRemove,
      onMentionedUser,
      onReferencedNft,
      onTitle,
      onFileChange,
      onViewChange,
      onDrop,
      onDropPart,
    },
    ref
  ) => {
    const onViewClick = () => onViewChange(CreateDropViewType.COMPACT);
    const [isOpen, setIsOpen] = useState(true);

    const onClose = () => setIsOpen(false);

    const [titleState, setTitleState] = useState<TITLE_STATE>(
      title?.length ? TITLE_STATE.INPUT : TITLE_STATE.BUTTON
    );

    const getSubmitText = () => {
      switch (type) {
        case CreateDropType.DROP:
          return "Drop";
        case CreateDropType.QUOTE:
          return "Quote";
        default:
          assertUnreachable(type);
          return "";
      }
    };

    const editorRef = useRef<CreateDropContentHandles | null>(null);
    const clearEditorState = () => editorRef.current?.clearEditorState();
    useImperativeHandle(ref, () => ({
      clearEditorState,
    }));

    return (
      <CreateDropFullMobileWrapper
        isOpen={isOpen}
        type={type}
        onClose={onClose}
        onViewClick={onViewClick}
      >
        <div className="tw-relative tw-flex-1 tw-space-y-4 tw-divide-y tw-divide-iron-800 tw-divide-x-0 tw-divide-solid">
          {!!drop?.parts.length && <CreateDropStormView drop={drop} />}
          <div className="tw-relative tw-px-4 sm:tw-px-6 tw-space-y-4">
            <div className="tw-flex tw-justify-end -tw-mb-2">
              {titleState === TITLE_STATE.BUTTON && (
                <button
                  onClick={() => setTitleState(TITLE_STATE.INPUT)}
                  type="button"
                  className="tw-text-xs tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 
              tw-px-2.5 tw-py-2 tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
                >
                  <svg
                    className="tw-w-4 tw-h-4 tw-mr-1 -tw-ml-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 5V19M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Add title</span>
                </button>
              )}
            </div>
            {titleState === TITLE_STATE.INPUT && (
              <input
                type="text"
                placeholder="Drop title"
                value={title ?? ""}
                onChange={(e) => onTitle(e.target.value)}
                maxLength={250}
                className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-2.5 tw-pr-3 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
              />
            )}
            <CreateDropContent
              ref={editorRef}
              viewType={CreateDropViewType.FULL}
              editorState={editorState}
              type={type}
              drop={drop}
              onEditorState={onEditorState}
              onMentionedUser={onMentionedUser}
              onReferencedNft={onReferencedNft}
              onViewClick={onViewClick}
              onFileChange={onFileChange}
            />
            {/* 
            <button type="button" onClick={onDropPart} disabled={!canAddPart} className={`${canAddPart? "tw-bg-iron-800" : ""} tw-font-medium tw-text-sm tw-rounded-lg tw-inline-flex tw-items-center tw-justify-center tw-gap-x-2 tailwind-scope`}>
              <svg
                enable-background="new 0 0 57.691 55.692"
                className="tw-cursor-pointer tw-h-[1.15rem] tw-w-[1.15rem] tw-text-iron-400 group-hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
                viewBox="0 0 57.691 55.692"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="currentColor"
                  d="m28.846 32.184c-16.176 0-28.846-7.069-28.846-16.093 0-9.023 12.67-16.091 28.846-16.091s28.846 7.068 28.846 16.091c-.001 9.024-12.671 16.093-28.846 16.093zm0-28.492c-13.635 0-25.154 5.678-25.154 12.399 0 6.722 11.52 12.4 25.154 12.4s25.154-5.678 25.154-12.4c0-6.721-11.52-12.399-25.154-12.399z"
                ></path>
                <path
                  fill="currentColor"
                  d="m6.964 26.289c-.849 0-1.613-.59-1.802-1.453-.125-.575-.188-1.161-.188-1.741 0-7.551 10.485-13.466 23.872-13.466 9.411 0 17.942 3.058 21.733 7.79.638.795.51 1.958-.286 2.595-.796.638-1.957.51-2.595-.286-3.07-3.832-10.646-6.406-18.853-6.406-12.071 0-20.181 5.054-20.181 9.774 0 .321.034.633.104.954.217.997-.414 1.98-1.41 2.197-.131.027-.263.042-.394.042z"
                ></path>
                <path
                  fill="currentColor"
                  d="m11.744 28.962c-.372 0-.748-.112-1.074-.346-.828-.595-1.019-1.748-.424-2.576 2.952-4.114 10.253-6.772 18.6-6.772 5.032 0 9.814.977 13.468 2.75.918.445 1.301 1.549.855 2.467s-1.554 1.299-2.467.854c-3.161-1.534-7.372-2.379-11.856-2.379-6.975 0-13.389 2.151-15.6 5.232-.36.502-.927.77-1.502.77z"
                ></path>
                <path
                  fill="currentColor"
                  d="m28.846 41.065c-9.177 0-16.969-3.086-19.391-7.679-.476-.902-.13-2.018.771-2.494s2.018-.129 2.494.772c1.459 2.767 7.606 5.708 16.125 5.708s14.666-2.941 16.125-5.708c.475-.901 1.589-1.249 2.494-.772.901.477 1.247 1.592.771 2.494-2.421 4.593-10.213 7.679-19.389 7.679z"
                ></path>
                <path
                  fill="currentColor"
                  d="m28.846 49.266c-6.179 0-11.683-2.031-13.696-5.055-.565-.848-.336-1.994.513-2.56.849-.564 1.995-.337 2.56.513 1.101 1.652 5.198 3.409 10.624 3.409s9.523-1.757 10.624-3.409c.564-.848 1.711-1.077 2.56-.513.849.565 1.078 1.712.513 2.56-2.016 3.023-7.52 5.055-13.698 5.055z"
                ></path>
                <path
                  fill="currentColor"
                  d="m28.846 55.692c-7.899 0-12.239-8.456-16.834-17.407-2.733-5.327-5.561-10.835-9.32-15.296-.656-.779-.558-1.944.223-2.601.778-.658 1.944-.559 2.602.222 4.029 4.781 7.085 10.736 9.781 15.99 4.24 8.263 7.903 15.4 13.548 15.4.943 0 1.823-.184 2.69-.563.932-.41 2.022.016 2.431.951.408.935-.018 2.023-.952 2.432-1.325.578-2.727.872-4.169.872z"
                ></path>
              </svg>
              <span>Add storm</span>
            </button> */}
            <CreateDropSelectFile onFileChange={onFileChange} file={file} />
            <CreateDropFullMobileMetadata
              metadata={metadata}
              onMetadataEdit={onMetadataEdit}
              onMetadataRemove={onMetadataRemove}
            />
          </div>
          {showSubmit && (
            <div className="tw-px-4 sm:tw-px-6 tw-pt-4">
              <div className="tw-flex tw-gap-x-3">
                <button
                  type="button"
                  disabled={!canSubmit || loading}
                  onClick={onDrop}
                  className={`${
                    !canSubmit
                      ? "tw-opacity-50 tw-text-iron-200"
                      : "tw-text-white hover:tw-ring-primary-600 hover:tw-bg-primary-600"
                  } tw-relative tw-w-full tw-items-center tw-justify-center tw-inline-flex tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold  tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-rounded-lg tw-shadow-sm  tw-transition tw-duration-300 tw-ease-out`}
                >
                  <div className={loading ? "tw-opacity-0" : ""}>
                    {getSubmitText()}
                  </div>
                  {loading && (
                    <div className="tw-absolute">
                      <CircleLoader />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </CreateDropFullMobileWrapper>
    );
  }
);

CreateDropFullMobile.displayName = "CreateDropFullMobile";
export default CreateDropFullMobile;
