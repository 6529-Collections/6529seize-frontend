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
import OneLinerPlugin from "../lexical/plugins/OneLinerPlugin";
import { MaxLengthPlugin } from "../lexical/plugins/MaxLengthPlugin";
import ToggleViewButtonPlugin from "../lexical/plugins/ToggleViewButtonPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import UploadMediaButtonPlugin from "../lexical/plugins/UploadMediaButtonPlugin";
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
import CreateDropSelectFileVideo from "./file/CreateDropSelectFileVideo";
import CreateDropSelectFileAudio from "./file/CreateDropSelectFileAudio";
import CreateDropSelectFileImage from "./file/CreateDropSelectFileImage";

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
        // NftNode,
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
    ) => onMentionedUser(user);
    const onHashtagAdded = (hashtag: ReferencedNft) => onReferencedNft(hashtag);

    const showToggleViewButton = viewType === CreateDropViewType.COMPACT;

    const getPlaceHolderText = () => {
      switch (type) {
        case CreateDropType.DROP:
          return "Start a drop...";
        case CreateDropType.QUOTE:
          return "Quote this drop...";
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
    const currentTotalPartsCharCount =
      drop?.parts.reduce((acc, part) => acc + (part.content?.length ?? 0), 0) ??
      0;

    const [charsCount, setCharsCount] = useState(0);
    useEffect(() => {
      editorState?.read(() =>
        setCharsCount(
          $convertToMarkdownString([
            ...TRANSFORMERS,
            MENTION_TRANSFORMER,
            HASHTAG_TRANSFORMER,
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
              <AutoFocusPlugin />
              <OnChangePlugin onChange={onEditorStateChange} />
              <NewMentionsPlugin onSelect={onMentionedUserAdded} />
              <NewHashtagsPlugin onSelect={onHashtagAdded} />
              {viewType === CreateDropViewType.COMPACT && <OneLinerPlugin />}
              <MaxLengthPlugin maxLength={25000} />
              {/*   {viewType === CreateDropViewType.COMPACT && (
                <UploadMediaButtonPlugin onFileChange={onFileChange} />
              )} */}
              {showToggleViewButton && (
                <ToggleViewButtonPlugin onViewClick={onViewClick} />
              )}
              {viewType === CreateDropViewType.FULL && (
                <Tippy content="Add storm">
                  <button
                    onClick={onDropPart}
                    disabled={!canAddPart}
                    type="button"
                    aria-label="Add storm"
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
                <Tippy content="Add storm">
                  <button
                    onClick={onDropPart}
                    disabled={!canAddPart}
                    type="button"
                    aria-label="Add storm"
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
        <div className="tw-mt-2 tw-pb-2 tw-flex tw-items-center tw-gap-x-6 tw-text-xs tw-font-medium tw-text-iron-400">
          {currentPartCount > 1 && (
            <p className="tw-mb-0">
              <>
                <span className="tw-font-semibold tw-text-iron-500">
                  Part:{" "}
                  <span className="tw-text-iron-50">{currentPartCount}</span>,
                </span>
                <span className="tw-pl-1">
                  length: {formatNumberWithCommas(charsCount)}
                </span>
              </>
            </p>
          )}
          {/* <p className="tw-mb-0">
            <span className="tw-font-semibold tw-text-iron-500">Drops:</span>
            <span className="tw-pl-1 tw-text-iron-50">
              <span>4</span>/<span>5</span>
            </span>
          </p> */}
          {/* <div className="tw-inline-flex tw-gap-x-0.5 tw-text-iron-400">
            <div className="tw-font-semibold tw-text-iron-300">
              {formatNumberWithCommas(currentTotalPartsCharCount + charsCount)}
            </div>
            <div>/</div>
            <div>{formatNumberWithCommas(24000)}</div>
          </div> */}
        </div>
        <div className="tw-mt-2 tw-flex tw-items-center tw-gap-x-6">
          <CreateDropSelectFileAudio onFileChange={onFileChange} />
          <CreateDropSelectFileVideo onFileChange={onFileChange} />
          <CreateDropSelectFileImage onFileChange={onFileChange} />
          {/* <div className="tw-inline-flex tw-items-center tw-gap-x-2">
            <svg
              className="tw-size-4 tw-flex-shrink-0 tw-text-yellow"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tw-text-xs tw-text-yellow">
              Audio file is required
            </span>
          </div> */}
        </div>
      </div>
    );
  }
);

CreateDropContent.displayName = "CreateDropContent";
export default CreateDropContent;
