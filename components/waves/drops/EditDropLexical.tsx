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
import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown";
import {
  $getRoot,
  EditorState,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  TextNode,
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  type LexicalNode,
  type RootNode,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { ListNode, ListItemNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CodeHighlightNode, CodeNode, $isCodeNode } from "@lexical/code";
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
import { SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE } from "@/components/drops/create/lexical/transformers/markdownTransformers";
import PlainTextPastePlugin from "@/components/drops/create/lexical/plugins/PlainTextPastePlugin";

interface EditDropLexicalProps {
  readonly initialContent: string;
  readonly initialMentions: ApiDropMentionedUser[];
  readonly waveId: string | null;
  readonly isSaving: boolean;
  readonly onSave: (content: string, mentions: ApiDropMentionedUser[]) => void;
  readonly onCancel: () => void;
}

const MAX_MENTION_RECONSTRUCTION_PASSES = 20;

const EDIT_MARKDOWN_TRANSFORMERS = [
  ...SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE,
  MENTION_TRANSFORMER,
  HASHTAG_TRANSFORMER,
];

const convertCodeNodesToFences = (root: RootNode) => {
  const stack: LexicalNode[] = [...root.getChildren()];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;

    if ($isCodeNode(node)) {
      const language = node.getLanguage?.() ?? "";
      const safeLanguage = language.trim().replaceAll(/[`\n\r]/g, "");
      const codeText = node.getTextContent();
      const normalizedCode = codeText.endsWith("\n")
        ? codeText
        : `${codeText}\n`;
      const maxExistingFence = (codeText.match(/`+/g) ?? []).reduce(
        (max, match) => Math.max(max, match.length),
        0
      );
      const fenceLength = Math.max(3, maxExistingFence + 1);
      const fence = "`".repeat(fenceLength);
      const openFence = safeLanguage ? `${fence}${safeLanguage}` : fence;
      const fencedMarkdown = `${openFence}\n${normalizedCode}${fence}`;

      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(fencedMarkdown));
      node.replace(paragraph);

      continue;
    }

    if ($isElementNode(node)) {
      stack.push(...node.getChildren());
    }
  }
};

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

  const beforeMention = currentText.substring(
    0,
    currentText.length - mentionStart[0].length
  );
  const afterMention = nextText.substring(mentionEnd[0].length);

  if (beforeMention) {
    currentNode.setTextContent(beforeMention);
    currentNode.insertAfter(mentionNode);
  } else {
    currentNode.remove();
    nextNode.insertBefore(mentionNode);
  }

  if (afterMention) {
    nextNode.setTextContent(afterMention);
  } else {
    nextNode.remove();
  }

  return true;
}

function processSplitMentions(textNodes: Array<TextNode>): boolean {
  for (let i = 0; i < textNodes.length - 1; i++) {
    const currentNode = textNodes[i];
    const nextNode = textNodes[i + 1];

    const currentText = currentNode.getTextContent();
    const nextText = nextNode.getTextContent();

    const mentionStart = currentText.match(/@\[\w*$/);
    const mentionEnd = nextText.match(/^\w*\]/);

    if (mentionStart && mentionEnd) {
      try {
        if (
          reconstructSplitMention(currentNode, nextNode, mentionStart, mentionEnd)
        ) {
          return true;
        }
      } catch (error) {
        console.warn("Failed to reconstruct split mention", error);
      }
    }
  }

  return false;
}

function InitialContentPlugin({ initialContent }: { initialContent: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(initialContent, EDIT_MARKDOWN_TRANSFORMERS);

      const root = $getRoot();
      convertCodeNodesToFences(root);

      let needsAnotherPass = true;
      let passCount = 0;
      while (
        needsAnotherPass &&
        passCount < MAX_MENTION_RECONSTRUCTION_PASSES
      ) {
        const textNodes = root.getAllTextNodes();

        const hasUnprocessedMentions = textNodes.some((node) =>
          /@\[\w+\]/.test(node.getTextContent())
        );

        if (hasUnprocessedMentions) {
          break;
        }

        needsAnotherPass = processSplitMentions(textNodes);
        passCount += 1;
      }

      if (needsAnotherPass && passCount >= MAX_MENTION_RECONSTRUCTION_PASSES) {
        console.warn(
          "Mention reconstruction reached max passes without converging"
        );
      }

      root.selectEnd();
    });
  }, [editor, initialContent]);

  return null;
}

function FocusPlugin({ isApp }: { isApp: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const focusEditor = () => {
      editor.focus();
      requestAnimationFrame(() => {
        const contentEditable = document.querySelector(
          '[contenteditable="true"]'
        ) as HTMLElement;
        if (contentEditable && document.activeElement !== contentEditable) {
          contentEditable.focus();
          contentEditable.click();
        }
      });
    };

    if (isApp) {
      const timeouts = [
        setTimeout(focusEditor, 100),
        setTimeout(focusEditor, 350),
        setTimeout(focusEditor, 600),
      ];

      return () => timeouts.forEach(clearTimeout);
    } else {
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
        if (mentionsRef.current?.isMentionsOpen()) {
          return false;
        }

        if (event?.shiftKey) {
          return false;
        }

        if (!isSaving) {
          editor.getEditorState().read(() => {
            const currentMarkdown =
              $convertToMarkdownString(EDIT_MARKDOWN_TRANSFORMERS);
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
      const markdown = $convertToMarkdownString(EDIT_MARKDOWN_TRANSFORMERS);

      if (markdown.trim() === initialContent.trim()) {
        onCancel();
        return;
      }

      onSave(markdown, mentionedUsers);
    });
  }, [editorState, mentionedUsers, onSave, initialContent, onCancel]);

  return (
    <div className="tw-w-full" data-editor-mode="true">
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
          <MarkdownShortcutPlugin
            transformers={SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE}
          />
          <PlainTextPastePlugin />
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
