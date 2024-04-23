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
import { MentionedUser, ReferencedNft } from "../../../../entities/IDrop";
import OneLinerPlugin from "../lexical/plugins/OneLinerPlugin";
import { MaxLengthPlugin } from "../lexical/plugins/MaxLengthPlugin";
import ToggleViewButtonPlugin from "../lexical/plugins/ToggleViewButtonPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import UploadMediaButtonPlugin from "../lexical/plugins/UploadMediaButtonPlugin";
import { CreateDropViewType } from "./CreateDropWrapper";
import { TRANSFORMERS } from "@lexical/markdown";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { CreateDropType } from "../CreateDrop";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";

export default function CreateDropContent({
  viewType,
  editorState,
  type,
  onEditorState,
  onReferencedNft,
  onMentionedUser,
  onFileChange,
  onViewClick,
}: {
  readonly viewType: CreateDropViewType;
  readonly editorState: EditorState | null;
  readonly type: CreateDropType;
  readonly onEditorState: (editorState: EditorState) => void;
  readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
  readonly onMentionedUser: (mentionedUser: Omit<MentionedUser, 'current_handle'>) => void;
  readonly onFileChange: (file: File) => void;
  readonly onViewClick: () => void;
}) {
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

  const onMentionedUserAdded = (user: Omit<MentionedUser, 'current_handle'>) => onMentionedUser(user);
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
                      ? "editor-input-one-liner"
                      : "editor-input-multi-liner"
                  } tw-resize-none  tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
                  tw-pl-3.5 tw-pr-20 tw-py-2.5`}
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
            <ListPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <TabIndentationPlugin />
            <LinkPlugin validateUrl={validateUrl} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
