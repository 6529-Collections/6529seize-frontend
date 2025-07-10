"use client"

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {
  TRANSFORMERS,
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import {
  $getRoot,
  EditorState,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { ListNode, ListItemNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";

import {
  MentionNode,
  $createMentionNode,
} from "../../drops/create/lexical/nodes/MentionNode";
import { HashtagNode } from "../../drops/create/lexical/nodes/HashtagNode";
import { MENTION_TRANSFORMER } from "../../drops/create/lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../../drops/create/lexical/transformers/HastagTransformer";
import ExampleTheme from "../../drops/create/lexical/ExampleTheme";
import NewMentionsPlugin, {
  NewMentionsPluginHandles,
} from "../../drops/create/lexical/plugins/mentions/MentionsPlugin";
import { MentionedUser } from "../../../entities/IDrop";
import { ApiDropMentionedUser } from "../../../generated/models/ApiDropMentionedUser";
import CreateDropEmojiPicker from "../CreateDropEmojiPicker";
import useDeviceInfo from "../../../hooks/useDeviceInfo";
import EmojiPlugin from "../../drops/create/lexical/plugins/emoji/EmojiPlugin";
import { EmojiNode } from "../../drops/create/lexical/nodes/EmojiNode";

interface EditDropLexicalProps {
  initialContent: string;
  initialMentions: ApiDropMentionedUser[];
  waveId: string | null;
  isSaving: boolean;
  onSave: (content: string, mentions: ApiDropMentionedUser[]) => void;
  onCancel: () => void;
}

// Plugin to set initial content from markdown
function reconstructSplitMention(
  currentNode: any,
  nextNode: any,
  mentionStart: RegExpMatchArray,
  mentionEnd: RegExpMatchArray
) {
  const fullMention = mentionStart[0] + mentionEnd[0];
  const mentionRegex = /@\[(\w+)\]/;
  const mentionMatch = mentionRegex.exec(fullMention);

  if (!mentionMatch) return false;

  const handle = mentionMatch[1];
  const mentionNode = $createMentionNode(`@${handle}`);

  const currentText = currentNode.getTextContent();
  const nextText = nextNode.getTextContent();

  // Calculate text before and after mention
  const beforeMention = currentText.substring(
    0,
    currentText.length - mentionStart[0].length
  );
  const afterMention = nextText.substring(mentionEnd[0].length);

  // Update or remove current node
  if (beforeMention) {
    currentNode.setTextContent(beforeMention);
    currentNode.insertAfter(mentionNode);
  } else {
    currentNode.remove();
    nextNode.insertBefore(mentionNode);
  }

  // Update or remove next node
  if (afterMention) {
    nextNode.setTextContent(afterMention);
  } else {
    nextNode.remove();
  }

  return true;
}

function processSplitMentions(textNodes: any[]) {
  for (let i = 0; i < textNodes.length - 1; i++) {
    const currentNode = textNodes[i];
    const nextNode = textNodes[i + 1];

    const currentText = currentNode.getTextContent();
    const nextText = nextNode.getTextContent();

    // Check for @[ at end of current node and word] at start of next
    const mentionStart = currentText.match(/@\[\w*$/);
    const mentionEnd = nextText.match(/^\w*\]/);

    if (mentionStart && mentionEnd) {
      if (
        reconstructSplitMention(currentNode, nextNode, mentionStart, mentionEnd)
      ) {
        break; // Refresh needed after tree modification
      }
    }
  }
}

function InitialContentPlugin({ initialContent }: { initialContent: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(initialContent, [
        ...TRANSFORMERS,
        MENTION_TRANSFORMER,
        HASHTAG_TRANSFORMER,
      ]);

      // Post-process: reconstruct mentions split across text nodes
      const root = $getRoot();
      const textNodes = root.getAllTextNodes();

      // Check if any text nodes still contain @[...] patterns (missed by transformer due to splitting)
      const hasUnprocessedMentions = textNodes.some((node) =>
        /@\[\w+\]/.test(node.getTextContent())
      );

      if (!hasUnprocessedMentions) {
        // Look for mention patterns split across adjacent nodes
        processSplitMentions(textNodes);
      }
    });
  }, [editor, initialContent]);

  return null;
}

// Plugin to handle keyboard shortcuts
// Plugin to handle focus on mount
function FocusPlugin({ isApp }: { isApp: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const focusEditor = () => {
      // Try Lexical's focus first
      editor.focus();

      // Also try DOM focus as fallback
      requestAnimationFrame(() => {
        const contentEditable = document.querySelector(
          '[contenteditable="true"]'
        ) as HTMLElement;
        if (contentEditable && document.activeElement !== contentEditable) {
          contentEditable.focus();
          contentEditable.click(); // For mobile keyboard
        }
      });
    };

    if (isApp) {
      // Multiple timing strategies for mobile reliability
      const timeouts = [
        setTimeout(focusEditor, 100), // Quick attempt
        setTimeout(focusEditor, 350), // After menu close
        setTimeout(focusEditor, 600), // Final attempt
      ];

      return () => timeouts.forEach(clearTimeout);
    } else {
      // Desktop: immediate focus
      focusEditor();
    }
  }, [editor, isApp]);

  return null;
}

function KeyboardPlugin({
  onSave,
  onCancel,
  isSaving,
  initialContent,
  mentionsRef,
}: {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  initialContent: string;
  mentionsRef: React.RefObject<NewMentionsPluginHandles | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeEscapeListener = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        onCancel();
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    const removeEnterListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        // Check if mentions dropdown is open
        if (mentionsRef.current?.isMentionsOpen()) {
          // Let the mentions plugin handle the Enter key
          return false;
        }

        if (event?.shiftKey) {
          // Allow Shift+Enter for new lines
          return false;
        }

        if (!isSaving) {
          // Check if content has changed (similar to original logic)
          editor.getEditorState().read(() => {
            const currentMarkdown = $convertToMarkdownString([
              ...TRANSFORMERS,
              MENTION_TRANSFORMER,
              HASHTAG_TRANSFORMER,
            ]);
            // If no changes, just cancel (silent exit)
            if (currentMarkdown.trim() === initialContent.trim()) {
              onCancel();
            } else {
              onSave();
            }
          });
        }
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    return () => {
      removeEscapeListener();
      removeEnterListener();
    };
  }, [editor, onSave, onCancel, isSaving, initialContent, mentionsRef]);

  return null;
}

const EditDropLexical: React.FC<EditDropLexicalProps> = ({
  initialContent,
  initialMentions,
  waveId,
  isSaving,
  onSave,
  onCancel,
}) => {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [mentionedUsers, setMentionedUsers] =
    useState<ApiDropMentionedUser[]>(initialMentions);
  const editorRef = useRef<HTMLDivElement>(null);
  const mentionsRef = useRef<NewMentionsPluginHandles>(null);
  const { isApp } = useDeviceInfo();

  const initialConfig: InitialConfigType = {
    namespace: "EditDropLexical",
    theme: ExampleTheme,
    onError: (error: Error) => {
      console.error(error);
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      HorizontalRuleNode,
      AutoLinkNode,
      LinkNode,
      MentionNode,
      HashtagNode,
      EmojiNode,
    ],
  };

  const handleEditorChange = useCallback((editorState: EditorState) => {
    setEditorState(editorState);
  }, []);

  const handleMentionSelect = useCallback(
    (user: Omit<MentionedUser, "current_handle">) => {
      const newMention: ApiDropMentionedUser = {
        mentioned_profile_id: user.mentioned_profile_id,
        handle_in_content: user.handle_in_content,
      };

      setMentionedUsers((prev) => {
        // Avoid duplicates
        if (
          prev.some(
            (m) => m.mentioned_profile_id === newMention.mentioned_profile_id
          )
        ) {
          return prev;
        }
        return [...prev, newMention];
      });
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!editorState) return;

    editorState.read(() => {
      const markdown = $convertToMarkdownString([
        ...TRANSFORMERS,
        MENTION_TRANSFORMER,
        HASHTAG_TRANSFORMER,
      ]);

      // If no changes, silently exit edit mode without API call
      if (markdown.trim() === initialContent.trim()) {
        onCancel();
        return;
      }

      onSave(markdown, mentionedUsers);
    });
  }, [editorState, mentionedUsers, onSave, initialContent, onCancel]);

  return (
    <div className="tw-w-full">
      <LexicalComposer initialConfig={initialConfig}>
        <div ref={editorRef} className="tw-relative">
          <RichTextPlugin
            contentEditable={
              <div className="tw-relative">
                <ContentEditable
                  className="tw-w-full tw-py-2.5 tw-pl-3 tw-pr-10 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-text-iron-100 tw-text-sm tw-resize-none tw-outline-none focus:tw-border-primary-400 tw-overflow-x-hidden tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-min-h-[40px]"
                  style={{
                    fontFamily: "inherit",
                    lineHeight: "1.4",
                  }}
                />
                <CreateDropEmojiPicker top="tw-top-1" />
              </div>
            }
            placeholder={
              <div className="tw-absolute tw-top-2 tw-left-3 tw-text-iron-500 tw-text-sm tw-pointer-events-none">
                Edit message...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleEditorChange} />
          <HistoryPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <ListPlugin />
          <LinkPlugin />
          <NewMentionsPlugin
            ref={mentionsRef}
            waveId={waveId}
            onSelect={handleMentionSelect}
          />
          <EmojiPlugin />
          <InitialContentPlugin initialContent={initialContent} />
          <FocusPlugin isApp={isApp} />
          <KeyboardPlugin
            onSave={handleSave}
            onCancel={onCancel}
            isSaving={isSaving}
            initialContent={initialContent}
            mentionsRef={mentionsRef}
          />
        </div>
      </LexicalComposer>

      {!isApp && (
        <div className="tw-flex tw-items-center tw-mt-1 tw-text-xs tw-text-iron-400">
          escape to{" "}
          <button
            onClick={onCancel}
            className="tw-bg-transparent tw-px-[3px] tw-border-0 tw-cursor-pointer tw-text-primary-400 desktop-hover:hover:tw-underline tw-transition tw-font-medium focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-rounded-md"
          >
            cancel
          </button>{" "}
          • enter to{" "}
          <button
            onClick={handleSave}
            className="tw-bg-transparent tw-px-[3px] tw-border-0 tw-cursor-pointer tw-text-primary-400 desktop-hover:hover:tw-underline tw-transition tw-font-medium focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-rounded-md"
          >
            save
          </button>
        </div>
      )}

      {isApp && (
        <div className="tw-mt-3 tw-mb-2">
          <div className="tw-flex tw-gap-x-2">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="tw-bg-iron-800 tw-text-iron-300 tw-border-0 tw-rounded-lg tw-py-1.5 tw-px-3 tw-font-medium tw-text-sm active:tw-bg-iron-700 tw-transition-colors tw-duration-150 disabled:tw-opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="tw-bg-primary-500 tw-text-white tw-border-0 tw-rounded-lg tw-py-1.5 tw-px-3 tw-font-medium tw-text-sm active:tw-bg-primary-600 tw-transition-colors tw-duration-150 disabled:tw-opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditDropLexical;
