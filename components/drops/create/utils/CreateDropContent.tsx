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
    readonly onEditorState: (editorState: EditorState) => void;
    readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
    readonly onMentionedUser: (
      mentionedUser: Omit<MentionedUser, "current_handle">
    ) => void;
    readonly onFileChange: (file: File) => void;
    readonly onViewClick: () => void;
  }
>(
  (
    {
      viewType,
      editorState,
      type,
      drop,
      onEditorState,
      onReferencedNft,
      onMentionedUser,
      onFileChange,
      onViewClick,
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
                        ? "editor-input-one-liner tw-pr-32"
                        : "editor-input-multi-liner tw-pr-10"
                    } tw-resize-none tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
                  tw-pl-3.5  tw-py-2.5`}
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
              {viewType === CreateDropViewType.COMPACT && (
                <button
                  type="button"
                  title="add storm"
                  aria-label="Add storm"
                  className="tw-absolute tw-group tw-top-[0.3rem] tw-right-3 tw-p-2 tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-border-0 tw-bg-transparent"
                >
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
        <div className="tw-mt-2 tw-flex tw-items-center tw-justify-between tw-text-xs tw-font-medium tw-text-iron-400">
          <p className="tw-mb-0">
            <span className="tw-font-semibold tw-text-iron-300">
              Part: {currentPartCount},
            </span>{" "}
            length: {formatNumberWithCommas(charsCount)}
          </p>
          <div className="tw-inline-flex tw-gap-x-0.5 tw-text-iron-400">
            <div className="tw-font-semibold tw-text-iron-300">
              {formatNumberWithCommas(currentTotalPartsCharCount + charsCount)}
            </div>
            <div>/</div>
            <div>{formatNumberWithCommas(32768)}</div>
          </div>
        </div>
      </div>
    );
  }
);

CreateDropContent.displayName = "CreateDropContent";
export default CreateDropContent;
