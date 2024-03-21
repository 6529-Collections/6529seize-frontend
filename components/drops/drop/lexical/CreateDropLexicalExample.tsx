import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";

import ExampleTheme from "./ExampleTheme";

import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import NewMentionsPlugin from "./plugins/mentions/MentionsPlugin";
import { MentionNode } from "./nodes/MentionNode";
import { EditorState, LexicalEditor } from "lexical";
import { useEffect, useState } from "react";
import { HashtagNode } from "./nodes/HashtagNode";
import NewHashtagsPlugin from "./plugins/hashtags/HashtagsPlugin";
import { MentionedUser, ReferencedNft } from "../../../../entities/IDrop";

function Placeholder() {
  return <div className="editor-placeholder">Your awesome drop...</div>;
}

const editorConfig = {
  namespace: "React.js Demo",
  nodes: [MentionNode, HashtagNode],
  // Handling of errors during update
  onError(error: Error): void {
    throw error;
  },
  // The editor theme
  theme: ExampleTheme,
};

export default function CreateDropLexicalExample({
  mentionedUsers,
  referencedNft,
  onContent,
  onReferencedNfts,
  onMentionedUsers,
}: {
  readonly mentionedUsers: MentionedUser[];
  readonly referencedNft: ReferencedNft[];
  readonly onContent: (content: string | null) => void;
  readonly onReferencedNfts: (referencedNfts: ReferencedNft[]) => void;
  readonly onMentionedUsers: (mentionedUsers: MentionedUser[]) => void;
}) {
  const onChange = (
    editorState: EditorState,
    editor: LexicalEditor,
    tags: Set<string>
  ) => {
    editorState?.read(() => {
      const markdown = $convertToMarkdownString(TRANSFORMERS);
      if (typeof markdown === "string") {
        onContent(markdown);
      } else {
        onContent(null);
      }
    });
  };

  const atMention = (user: MentionedUser) => {
    const isAdded = mentionedUsers.some(
      (mentionedUser) =>
        mentionedUser.mentioned_profile_id === user.mentioned_profile_id
    );
    if (!isAdded) {
      onMentionedUsers([...mentionedUsers, user]);
    }
  };
  const atHashTag = (hashtag: ReferencedNft) => {
    const isAdded = referencedNft.some(
      (nft) =>
        nft.tokenId === hashtag.tokenId && nft.contract === hashtag.contract
    );
    if (!isAdded) {
      onReferencedNfts([...referencedNft, hashtag]);
    }
  };
  return (
    <div className="tailwind-scope">
      <LexicalComposer initialConfig={editorConfig}>
        <div>
          <div className="tw-relative tw-bg-[#1C1C21] tw-w-[30rem]">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="editor-input tw-h-[11rem] tw-resize-none tw-text-md tw-caret-slate-400 tw-text-neutral-300 tw-relative tw-outline-none tw-py-[15px] tw-px-[10px]" />
              }
              placeholder={<Placeholder />}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <OnChangePlugin onChange={onChange} />
            <NewMentionsPlugin onSelect={atMention} />
            <NewHashtagsPlugin onSelect={atHashTag} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
