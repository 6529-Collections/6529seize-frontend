import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { EditorState, RootNode } from "lexical";
import { MentionNode } from "../../drop/lexical/nodes/MentionNode";
import { HashtagNode } from "../../drop/lexical/nodes/HashtagNode";
import ExampleTheme from "../../drop/lexical/ExampleTheme";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import NewMentionsPlugin from "../../drop/lexical/plugins/mentions/MentionsPlugin";
import NewHashtagsPlugin from "../../drop/lexical/plugins/hashtags/HashtagsPlugin";
import { MentionedUser, ReferencedNft } from "../../../../entities/IDrop";
import OneLinerPlugin from "../../drop/lexical/plugins/OneLinerPlugin";
import { MaxLengthPlugin } from "../../drop/lexical/plugins/MaxLengthPlugin";
import ToggleViewButtonPlugin from "../../drop/lexical/plugins/ToggleViewButtonPlugin";
import { CreateDropScreenType, CreateDropViewType } from "../CreateDrop";
import UploadMediaButtonPlugin from "../../drop/lexical/plugins/UploadMediaButtonPlugin";

export default function CreateDropContent({
  viewType,
  screenType,
  editorState,
  onEditorState,
  onReferencedNft,
  onMentionedUser,
  onViewClick,
}: {
  readonly viewType: CreateDropViewType;
  readonly screenType: CreateDropScreenType;
  readonly editorState: EditorState | null;
  readonly onEditorState: (editorState: EditorState) => void;
  readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
  readonly onMentionedUser: (mentionedUser: MentionedUser) => void;
  readonly onViewClick: () => void;
}) {
  const editorConfig: InitialConfigType = {
    namespace: "User Drop",
    nodes: [MentionNode, HashtagNode, RootNode],
    editorState,
    onError(error: Error): void {
      throw error;
    },
    theme: ExampleTheme,
  };

  const onEditorStateChange = (editorState: EditorState) =>
    onEditorState(editorState);

  const onMentionedUserAdded = (user: MentionedUser) => onMentionedUser(user);
  const onHashtagAdded = (hashtag: ReferencedNft) => onReferencedNft(hashtag);

  const onMediaClick = () => {
    console.log("Media clicked");
  };

  return (
    <div className="tailwind-scope">
      <LexicalComposer initialConfig={editorConfig}>
        <div>
          <div className="tw-relative tw-bg-[#1C1C21]">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={`${
                    viewType === CreateDropViewType.COMPACT
                      ? "editor-input-one-liner"
                      : "editor-input-multi-liner"
                  } tw-resize-none tw-text-md tw-caret-slate-400 tw-text-neutral-300 tw-relative tw-outline-none tw-py-[15px] tw-px-[10px]`}
                />
              }
              placeholder={
                <div className="editor-placeholder">Your awesome drop...</div>
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
            {screenType === CreateDropScreenType.MOBILE &&
              viewType === CreateDropViewType.COMPACT && (
                <UploadMediaButtonPlugin onMediaClick={onMediaClick} />
              )}
            <ToggleViewButtonPlugin onViewClick={onViewClick} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
