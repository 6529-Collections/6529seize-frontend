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
                        ? "editor-input-one-liner tw-pr-[7.5rem]"
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
              {viewType === CreateDropViewType.COMPACT && (
                <UploadMediaButtonPlugin onFileChange={onFileChange} />
              )}
              {showToggleViewButton && (
                <ToggleViewButtonPlugin onViewClick={onViewClick} />
              )}
              {viewType === CreateDropViewType.FULL && (
                <button
                  onClick={onDropPart}
                  disabled={!canAddPart}
                  type="button"
                  title="add storm"
                  aria-label="Add storm"
                  className="tw-absolute tw-group tw-top-2 tw-right-3 tw-p-2.5 tw-flex tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-rounded-lg tw-text-iron-400 hover:tw-text-primary-400 tw-ease-out tw-transition tw-duration-300"
                >
                  <svg
                    className="tw-h-4 tw-w-4"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.2495 2H8.49395C8.31447 2 8.22473 2 8.14551 2.02733C8.07544 2.05149 8.01163 2.09093 7.95868 2.14279C7.89881 2.20143 7.85868 2.2817 7.77841 2.44223L3.57841 10.8422C3.38673 11.2256 3.29089 11.4173 3.31391 11.5731C3.33401 11.7091 3.40927 11.8309 3.52197 11.9097C3.65104 12 3.86534 12 4.29395 12H10.4995L7.49953 22L19.6926 9.35531C20.104 8.9287 20.3097 8.7154 20.3217 8.53288C20.3321 8.37446 20.2667 8.22049 20.1454 8.11803C20.0057 8 19.7094 8 19.1167 8H11.9995L14.2495 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              {viewType === CreateDropViewType.COMPACT && (
                <button
                  onClick={onDropPart}
                  disabled={!canAddPart}
                  type="button"
                  title="add storm"
                  aria-label="Add storm"
                  className="tw-absolute tw-group tw-top-1 tw-right-11 tw-p-2 tw-flex tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-rounded-lg tw-text-iron-400 hover:tw-text-primary-400 tw-ease-out tw-transition tw-duration-300"
                >
                  <svg
                    className="tw-h-5 tw-w-5"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.2495 2H8.49395C8.31447 2 8.22473 2 8.14551 2.02733C8.07544 2.05149 8.01163 2.09093 7.95868 2.14279C7.89881 2.20143 7.85868 2.2817 7.77841 2.44223L3.57841 10.8422C3.38673 11.2256 3.29089 11.4173 3.31391 11.5731C3.33401 11.7091 3.40927 11.8309 3.52197 11.9097C3.65104 12 3.86534 12 4.29395 12H10.4995L7.49953 22L19.6926 9.35531C20.104 8.9287 20.3097 8.7154 20.3217 8.53288C20.3321 8.37446 20.2667 8.22049 20.1454 8.11803C20.0057 8 19.7094 8 19.1167 8H11.9995L14.2495 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
              <ListPlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <TabIndentationPlugin />
              <LinkPlugin validateUrl={validateUrl} />
              <ClearEditorPlugin ref={clearEditorRef} />
            </div>
          </div>
        </LexicalComposer>
        <div className="tw-mt-2 tw-flex tw-items-center tw-justify-between tw-gap-x-6 tw-text-xs tw-font-medium tw-text-iron-400">
          <p className="tw-mb-0">
            <span className="tw-font-semibold tw-text-iron-300">
              Part: {currentPartCount},
            </span>
            <span className="tw-pl-1">
              length: {formatNumberWithCommas(charsCount)}
            </span>
          </p>
          <div className="tw-inline-flex tw-gap-x-0.5 tw-text-iron-400">
            <div className="tw-font-semibold tw-text-iron-300">
              {formatNumberWithCommas(currentTotalPartsCharCount + charsCount)}
            </div>
            <div>/</div>
            <div>{formatNumberWithCommas(32768)}</div>
          </div>

          {/*   <div className="tw-flex tw-justify-end">
            <button
              type="button"
              className="tw-bg-iron-800 tw-border-iron-700 tw-text-iron-300 tw-shadow tw-border tw-border-solid tw-px-2.5 tw-py-2 tw-text-xs tw-font-semibold tw-rounded-lg tw-inline-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-ease-out tw-transition tw-duration-300"
            >
              <svg
                className="tw-flex-shrink-0 tw-w-4 tw-h-4 tw-mr-2"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.2495 2H8.49395C8.31447 2 8.22473 2 8.14551 2.02733C8.07544 2.05149 8.01163 2.09093 7.95868 2.14279C7.89881 2.20143 7.85868 2.2817 7.77841 2.44223L3.57841 10.8422C3.38673 11.2256 3.29089 11.4173 3.31391 11.5731C3.33401 11.7091 3.40927 11.8309 3.52197 11.9097C3.65104 12 3.86534 12 4.29395 12H10.4995L7.49953 22L19.6926 9.35531C20.104 8.9287 20.3097 8.7154 20.3217 8.53288C20.3321 8.37446 20.2667 8.22049 20.1454 8.11803C20.0057 8 19.7094 8 19.1167 8H11.9995L14.2495 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Start a storm</span>
            </button>
          </div> */}
        </div>
      </div>
    );
  }
);

CreateDropContent.displayName = "CreateDropContent";
export default CreateDropContent;
