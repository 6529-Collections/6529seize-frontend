import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { EditorState, RootNode } from "lexical";
import { MentionNode } from "../lexical/nodes/MentionNode";
import { HashtagNode } from "../lexical/nodes/HashtagNode";
import ExampleTheme from "../lexical/ExampleTheme";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import NewMentionsPlugin from "../lexical/plugins/mentions/MentionsPlugin";
import NewHashtagsPlugin from "../lexical/plugins/hashtags/HashtagsPlugin";
import {
  CreateDropConfig,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import { MaxLengthPlugin } from "../lexical/plugins/MaxLengthPlugin";
import ToggleViewButtonPlugin from "../lexical/plugins/ToggleViewButtonPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";

import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { CreateDropType, CreateDropViewType } from "../CreateDrop";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import ClearEditorPlugin, {
  ClearEditorPluginHandles,
} from "../lexical/plugins/ClearEditorPlugin";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { MENTION_TRANSFORMER } from "../lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../lexical/transformers/HastagTransformer";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import Tippy from "@tippyjs/react";
import { WaveParticipationRequirement } from "../../../../generated/models/WaveParticipationRequirement";
import CreateDropContentMissingMediaWarning from "./storm/CreateDropContentMissingMediaWarning";
import { WaveRequiredMetadata } from "../../../../generated/models/WaveRequiredMetadata";
import CreateDropContentMissingMetadataWarning from "./storm/CreateDropContentMissingMetadataWarning";
import DragDropPastePlugin from "../lexical/plugins/DragDropPastePlugin";
import { ImageNode } from "../lexical/nodes/ImageNode";
import { IMAGE_TRANSFORMER } from "../lexical/transformers/ImageTransformer";

export interface CreateDropContentHandles {
  clearEditorState: () => void;
}

const CreateDropContent = forwardRef<
  CreateDropContentHandles,
  {
    readonly viewType: CreateDropViewType;
    readonly editorState: EditorState | null;
    readonly type: CreateDropType;
    readonly drop: CreateDropConfig | null;
    readonly canAddPart: boolean;
    readonly missingMedia: WaveParticipationRequirement[];
    readonly missingMetadata: WaveRequiredMetadata[];
    readonly onEditorState: (editorState: EditorState) => void;
    readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
    readonly onMentionedUser: (
      mentionedUser: Omit<MentionedUser, "current_handle">
    ) => void;
    readonly onFileChange: (file: File) => void;
    readonly onViewClick: () => void;
    readonly onDropPart: () => void;
  }
>(
  (
    {
      viewType,
      editorState,
      type,
      drop,
      canAddPart,
      missingMedia,
      missingMetadata,
      onEditorState,
      onReferencedNft,
      onMentionedUser,
      onFileChange,
      onViewClick,
      onDropPart,
    },
    ref
  ) => {
    const editorConfig: InitialConfigType = {
      namespace: "User Drop",
      nodes: [
        MentionNode,
        HashtagNode,
        RootNode,
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
        HorizontalRuleNode,
        ImageNode,
      ],
      editorState,
      onError(error: Error): void {
        throw error;
      },
      theme: ExampleTheme,
    };

    const onEditorStateChange = (editorState: EditorState) =>
      onEditorState(editorState);

    const onMentionedUserAdded = (
      user: Omit<MentionedUser, "current_handle">
    ) => {
      onMentionedUser(user);
    };
    const onHashtagAdded = (hashtag: ReferencedNft) => onReferencedNft(hashtag);

    const showToggleViewButton = viewType === CreateDropViewType.COMPACT;

    const getPlaceHolderText = () => {
      switch (type) {
        case CreateDropType.DROP:
          return "Drop a post";
        case CreateDropType.QUOTE:
          return "Quote a drop";
        default:
          assertUnreachable(type);
          return "";
      }
    };

    const urlRegExp = new RegExp(
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
    );
    function validateUrl(url: string): boolean {
      return url === "https://" || urlRegExp.test(url);
    }

    const clearEditorRef = useRef<ClearEditorPluginHandles | null>(null);

    const clearEditorState = () => {
      clearEditorRef.current?.clearEditorState();
    };

    useImperativeHandle(ref, () => ({
      clearEditorState,
    }));

    const currentPartCount = (drop?.parts.length ?? 0) + 1;
    const [charsCount, setCharsCount] = useState(0);
    useEffect(() => {
      editorState?.read(() =>
        setCharsCount(
          $convertToMarkdownString([
            ...TRANSFORMERS,
            MENTION_TRANSFORMER,
            HASHTAG_TRANSFORMER,
            IMAGE_TRANSFORMER,
          ])?.length ?? 0
        )
      );
    }, [editorState]);

    return (
      <div className="tailwind-scope">
        <LexicalComposer initialConfig={editorConfig}>
          <div>
            <div className="tw-relative">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className={`${
                      viewType === CreateDropViewType.COMPACT
                        ? "editor-input-one-liner tw-pr-24"
                        : "editor-input-multi-liner tw-pr-10"
                    } tw-resize-none tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
                  tw-pl-3.5 tw-py-2.5`}
                  />
                }
                placeholder={
                  <span className="editor-placeholder">
                    {getPlaceHolderText()}
                  </span>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <AutoFocusPlugin defaultSelection="rootStart" />
              <OnChangePlugin onChange={onEditorStateChange} />
              <NewMentionsPlugin onSelect={onMentionedUserAdded} />
              <NewHashtagsPlugin onSelect={onHashtagAdded} />
              <MaxLengthPlugin maxLength={25000} />
              <DragDropPastePlugin />
              {showToggleViewButton && (
                <ToggleViewButtonPlugin onViewClick={onViewClick} />
              )}
              {viewType === CreateDropViewType.FULL && (
                <Tippy content="Break into storm">
                  <button
                    onClick={onDropPart}
                    disabled={!canAddPart}
                    type="button"
                    aria-label="Break into storm"
                    className={`tw-absolute tw-group tw-top-2 tw-right-3 tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-rounded-lg tw-ease-out tw-transition tw-duration-300 
                    ${
                      !canAddPart
                        ? "tw-cursor-default tw-text-iron-600"
                        : "tw-cursor-pointer tw-text-iron-400 hover:tw-text-primary-400"
                    }`}
                  >
                    <svg
                      className="tw-h-4 tw-w-4 tw-flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
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
                    <svg
                      className="tw-h-4 tw-w-4 tw-flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </Tippy>
              )}
              {viewType === CreateDropViewType.COMPACT && (
                <Tippy content="Break into storm">
                  <button
                    onClick={onDropPart}
                    disabled={!canAddPart}
                    type="button"
                    aria-label="Break into storm"
                    className={`tw-absolute tw-group tw-top-1 tw-right-11 tw-p-2 tw-flex tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-rounded-lg tw-ease-out tw-transition tw-duration-300 
                    ${
                      !canAddPart
                        ? "tw-text-iron-600 tw-cursor-default"
                        : "tw-cursor-pointer tw-text-iron-400 hover:tw-text-primary-400"
                    }`}
                  >
                    <svg
                      className="tw-h-4 tw-w-4 tw-flex-shrink-0 -tw-mr-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
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
                    <svg
                      className="tw-h-5 tw-w-5 tw-flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </Tippy>
              )}
              <ListPlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <TabIndentationPlugin />
              <LinkPlugin validateUrl={validateUrl} />
              <ClearEditorPlugin ref={clearEditorRef} />
            </div>
          </div>
        </LexicalComposer>
        <div className="tw-flex tw-w-full tw-justify-between tw-items-center tw-gap-x-6 tw-text-xs tw-font-medium tw-text-iron-400">
          <p className="tw-mb-0 tw-mt-1.5 tw-pb-2 ">
            {!!drop?.parts.length && (
              <>
                <span className="tw-font-semibold tw-text-iron-500">
                  Part:{" "}
                  <span className="tw-text-iron-50">{currentPartCount}</span>,
                </span>
                <span
                  className={`${charsCount > 240 && "tw-text-error"} tw-pl-1`}
                >
                  length: {formatNumberWithCommas(charsCount)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-6">
          <label>
            <div
              role="button"
              aria-label="Select audio file"
              className="tw-cursor-pointer tw-flex tw-items-center tw-gap-x-2 tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
            >
              <svg
                className="tw-flex-shrink-0 tw-h-5 tw-w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                aria-hidden="true"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              <input
                type="file"
                className="tw-hidden"
                accept="image/*,video/*,audio/*"
                onChange={(e: any) => {
                  if (e.target.files) {
                    const f = e.target.files[0];
                    onFileChange(f);
                  }
                }}
              />
              <span className="tw-text-sm tw-font-medium">Upload Media</span>
            </div>
          </label>
        </div>
        {(!!missingMedia.length || !!missingMetadata.length) && (
          <div className="tw-mt-4 tw-flex tw-items-center tw-gap-x-6">
            {!!missingMedia.length && (
              <CreateDropContentMissingMediaWarning
                missingMedia={missingMedia}
              />
            )}
            {!!missingMetadata.length && (
              <CreateDropContentMissingMetadataWarning
                missingMetadata={missingMetadata}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

CreateDropContent.displayName = "CreateDropContent";
export default CreateDropContent;
