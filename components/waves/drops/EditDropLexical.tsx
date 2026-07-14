"use client";

import {
  $convertFromMarkdownString,
  type Transformer,
} from "@lexical/markdown";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  type EditorState,
  type LexicalNode,
  type RootNode,
  type TextNode,
} from "lexical";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { $isCodeNode, CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";

import ExampleTheme from "@/components/drops/create/lexical/ExampleTheme";
import { EmojiNode } from "@/components/drops/create/lexical/nodes/EmojiNode";
import { HashtagNode } from "@/components/drops/create/lexical/nodes/HashtagNode";
import {
  $createWaveMentionNode,
  WaveMentionNode,
} from "@/components/drops/create/lexical/nodes/WaveMentionNode";
import {
  $createMentionNode,
  $isMentionNode,
  MentionNode,
} from "@/components/drops/create/lexical/nodes/MentionNode";
import { GroupMentionNode } from "@/components/drops/create/lexical/nodes/GroupMentionNode";
import EmojiPlugin from "@/components/drops/create/lexical/plugins/emoji/EmojiPlugin";
import type { NewMentionsPluginHandles } from "@/components/drops/create/lexical/plugins/mentions/MentionsPlugin";
import NewMentionsPlugin from "@/components/drops/create/lexical/plugins/mentions/MentionsPlugin";
import type { NewWaveMentionsPluginHandles } from "@/components/drops/create/lexical/plugins/waves/WaveMentionsPlugin";
import NewWaveMentionsPlugin from "@/components/drops/create/lexical/plugins/waves/WaveMentionsPlugin";
import PlainTextPastePlugin from "@/components/drops/create/lexical/plugins/PlainTextPastePlugin";
import { HASHTAG_TRANSFORMER } from "@/components/drops/create/lexical/transformers/HastagTransformer";
import { SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE } from "@/components/drops/create/lexical/transformers/markdownTransformers";
import { MENTION_TRANSFORMER } from "@/components/drops/create/lexical/transformers/MentionTransformer";
import { GROUP_MENTION_TRANSFORMER } from "@/components/drops/create/lexical/transformers/GroupMentionTransformer";
import { getMentionedGroupsFromEditorState } from "@/components/drops/create/lexical/utils/groupMentionDetection";
import { WAVE_MENTION_TRANSFORMER } from "@/components/drops/create/lexical/transformers/WaveMentionTransformer";
import type { MentionedUser, MentionedWave } from "@/entities/IDrop";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiDropMentionedUser } from "@/generated/models/ApiDropMentionedUser";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import CreateDropEmojiPicker from "../CreateDropEmojiPicker";
import {
  addBlankLinePlaceholders,
  removeBlankLinePlaceholders,
} from "./blankLinePlaceholders";
import {
  exportDropMarkdown,
  normalizeDropMarkdown,
} from "./normalizeDropMarkdown";
import { areMentionedGroupsEqual } from "@/helpers/waves/drop-group-mentions";
import { normalizeTypedEmojiShortcuts } from "@/helpers/waves/typed-emoji-shortcuts";
import { containsDisallowedLink } from "@/components/drops/view/part/dropPartMarkdown/linkPreviewDetection";
import RootBlockGuardPlugin from "@/components/drops/create/lexical/plugins/RootBlockGuardPlugin";
import { $selectEndOfRootBlock } from "@/components/drops/create/lexical/utils/rootContent";

interface EditDropLexicalProps {
  readonly initialContent: string;
  readonly initialMentions: ApiDropMentionedUser[];
  readonly initialGroupMentions: ApiDropGroupMention[];
  readonly initialWaveMentions: ApiMentionedWave[];
  readonly canMentionAll: boolean;
  readonly waveId: string | null;
  readonly isSaving: boolean;
  readonly linkRestrictionMessage?: string | null | undefined;
  readonly onSave: (
    content: string,
    mentions: ApiDropMentionedUser[],
    mentionedGroups: ApiDropGroupMention[],
    mentionedWaves: ApiMentionedWave[]
  ) => void;
  readonly onCancel: () => void;
}

const MAX_MENTION_RECONSTRUCTION_PASSES = 20;

const BASE_EDIT_MARKDOWN_TRANSFORMERS = [
  ...SAFE_MARKDOWN_TRANSFORMERS_WITHOUT_CODE,
  MENTION_TRANSFORMER,
  HASHTAG_TRANSFORMER,
  WAVE_MENTION_TRANSFORMER,
];

const areMentionedUsersEqual = (
  left: ApiDropMentionedUser[],
  right: ApiDropMentionedUser[]
) => {
  const toComparable = (mentions: ApiDropMentionedUser[]) =>
    mentions
      .map(
        (mention) =>
          `${mention.mentioned_profile_id}:${mention.handle_in_content.toLowerCase()}`
      )
      .sort();
  return (
    JSON.stringify(toComparable(left)) === JSON.stringify(toComparable(right))
  );
};

const getMentionedUsersFromEditorState = (
  editorState: EditorState,
  candidates: ApiDropMentionedUser[]
): ApiDropMentionedUser[] =>
  editorState.read(() => {
    const handlesInEditor = new Set(
      $getRoot()
        .getAllTextNodes()
        .filter($isMentionNode)
        .map((node) => node.getTextContent().replace(/^@/, "").toLowerCase())
    );
    return candidates.filter((mention) =>
      handlesInEditor.has(mention.handle_in_content.toLowerCase())
    );
  });

const convertCodeNodesToFences = (root: RootNode) => {
  const stack: LexicalNode[] = [...root.getChildren()];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;

    if ($isCodeNode(node)) {
      const language = node.getLanguage() ?? "";
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
  currentNode: TextNode,
  nextNode: TextNode,
  mentionStart: RegExpMatchArray,
  mentionEnd: RegExpMatchArray
) {
  const fullMention = mentionStart[0] + mentionEnd[0];
  const mentionRegex = /@\[(\w+)\]/;
  const mentionMatch = mentionRegex.exec(fullMention);

  if (!mentionMatch) return false;

  const handle = mentionMatch[1];
  if (!handle) return false;
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

function reconstructSplitWaveMention(
  currentNode: TextNode,
  nextNode: TextNode,
  mentionStart: RegExpMatchArray,
  mentionEnd: RegExpMatchArray
) {
  const fullMention = mentionStart[0] + mentionEnd[0];
  const mentionRegex = /#\[([^\]]+)\]/;
  const mentionMatch = mentionRegex.exec(fullMention);

  if (!mentionMatch) return false;

  const waveName = mentionMatch[1];
  const mentionNode = $createWaveMentionNode(`#${waveName}`);

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
    if (!currentNode || !nextNode) {
      continue;
    }

    const currentText = currentNode.getTextContent();
    const nextText = nextNode.getTextContent();

    const mentionStart = currentText?.match(/@\[\w*$/);
    const mentionEnd = nextText?.match(/^\w*\]/);
    if (mentionStart && mentionEnd) {
      try {
        if (
          reconstructSplitMention(
            currentNode,
            nextNode,
            mentionStart,
            mentionEnd
          )
        ) {
          return true;
        }
      } catch (error) {
        console.warn("Failed to reconstruct split mention", error);
      }
    }

    const waveMentionStart = currentText?.match(/#\[[^\]]*$/);
    const waveMentionEnd = nextText?.match(/^[^\]]*\]/);
    if (waveMentionStart && waveMentionEnd) {
      try {
        if (
          reconstructSplitWaveMention(
            currentNode,
            nextNode,
            waveMentionStart,
            waveMentionEnd
          )
        ) {
          return true;
        }
      } catch (error) {
        console.warn("Failed to reconstruct split wave mention", error);
      }
    }
  }

  return false;
}

function InitialContentPlugin({
  initialContent,
  transformers,
}: {
  initialContent: string;
  transformers: Transformer[];
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const normalizedContent = normalizeDropMarkdown(initialContent);
      $convertFromMarkdownString(normalizedContent, transformers);

      const root = $getRoot();
      convertCodeNodesToFences(root);

      let needsAnotherPass = true;
      let passCount = 0;
      while (
        needsAnotherPass &&
        passCount < MAX_MENTION_RECONSTRUCTION_PASSES
      ) {
        const textNodes = root.getAllTextNodes();

        const hasUnprocessedMentions = textNodes.some((node) => {
          const text = node.getTextContent();
          return /@\[\w+\]/.test(text) || /#\[[^\]]+\]/.test(text);
        });

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

      $selectEndOfRootBlock(root);
    });
  }, [editor, initialContent, transformers]);

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
    return;
  }, [editor, isApp]);

  return null;
}

function KeyboardPlugin({
  onSave,
  onCancel,
  isSaving,
  isSaveBlocked,
  isMobileOrApp,
  mentionsRef,
  waveMentionsRef,
}: {
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isSaveBlocked: boolean;
  isMobileOrApp: boolean;
  mentionsRef: React.RefObject<NewMentionsPluginHandles | null>;
  waveMentionsRef: React.RefObject<NewWaveMentionsPluginHandles | null>;
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
        if (
          mentionsRef.current?.isMentionsOpen() ||
          waveMentionsRef.current?.isWaveMentionsOpen()
        ) {
          return false;
        }

        if (isMobileOrApp) {
          return true;
        }

        if (event?.shiftKey) {
          return false;
        }

        if (!isSaving && !isSaveBlocked) {
          onSave();
        }
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    return () => {
      removeEscapeListener();
      removeEnterListener();
    };
  }, [
    editor,
    onSave,
    onCancel,
    isSaving,
    isSaveBlocked,
    isMobileOrApp,
    mentionsRef,
    waveMentionsRef,
  ]);

  return null;
}

const EditDropLexical: React.FC<EditDropLexicalProps> = ({
  initialContent,
  initialMentions,
  initialGroupMentions,
  initialWaveMentions,
  canMentionAll,
  waveId,
  isSaving,
  linkRestrictionMessage = null,
  onSave,
  onCancel,
}) => {
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const mentionedUsersRef = useRef<ApiDropMentionedUser[]>(initialMentions);
  const [mentionedWaves, setMentionedWaves] =
    useState<ApiMentionedWave[]>(initialWaveMentions);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorStateRef = useRef<EditorState | null>(null);
  const mentionsRef = useRef<NewMentionsPluginHandles>(null);
  const saveInProgressRef = useRef(false);
  const waveMentionsRef = useRef<NewWaveMentionsPluginHandles>(null);
  const { isApp, isMobileDevice } = useDeviceInfo();
  const isMobileOrApp = isMobileDevice || isApp;
  const normalizedInitialContent = useMemo(
    () => normalizeDropMarkdown(initialContent),
    [initialContent]
  );
  const editorInitialContent = useMemo(
    () => addBlankLinePlaceholders(normalizedInitialContent),
    [normalizedInitialContent]
  );
  const hasInitialAllGroupMention = initialGroupMentions.includes(
    ApiDropGroupMention.All
  );
  const canResolveAllGroupMention = canMentionAll || hasInitialAllGroupMention;
  const importMarkdownTransformers = useMemo(
    () =>
      hasInitialAllGroupMention
        ? [...BASE_EDIT_MARKDOWN_TRANSFORMERS, GROUP_MENTION_TRANSFORMER]
        : BASE_EDIT_MARKDOWN_TRANSFORMERS,
    [hasInitialAllGroupMention]
  );
  const exportMarkdownTransformers = useMemo(
    () =>
      canResolveAllGroupMention
        ? [...BASE_EDIT_MARKDOWN_TRANSFORMERS, GROUP_MENTION_TRANSFORMER]
        : BASE_EDIT_MARKDOWN_TRANSFORMERS,
    [canResolveAllGroupMention]
  );
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
      GroupMentionNode,
      HashtagNode,
      WaveMentionNode,
      EmojiNode,
    ],
  };

  const handleEditorChange = useCallback((editorState: EditorState) => {
    editorStateRef.current = editorState;
    setEditorState(editorState);
  }, []);

  const currentMarkdown = useMemo(() => {
    if (!editorState) {
      return normalizedInitialContent;
    }

    return removeBlankLinePlaceholders(
      exportDropMarkdown(editorState, exportMarkdownTransformers)
    );
  }, [editorState, exportMarkdownTransformers, normalizedInitialContent]);
  const isSaveBlockedByLinks =
    !!linkRestrictionMessage && containsDisallowedLink(currentMarkdown);

  const handleMentionSelect = useCallback(
    (user: Omit<MentionedUser, "current_handle">) => {
      const newMention: ApiDropMentionedUser = {
        mentioned_profile_id: user.mentioned_profile_id,
        handle_in_content: user.handle_in_content,
      };

      if (
        mentionedUsersRef.current.some(
          (mention) =>
            mention.mentioned_profile_id === newMention.mentioned_profile_id
        )
      ) {
        return;
      }
      const next = [...mentionedUsersRef.current, newMention];
      mentionedUsersRef.current = next;
    },
    []
  );

  const handleWaveMentionSelect = useCallback((wave: MentionedWave) => {
    const newMention: ApiMentionedWave = {
      wave_id: wave.wave_id,
      wave_name_in_content: wave.wave_name_in_content,
    };

    setMentionedWaves((prev) => {
      if (prev.some((m) => m.wave_id === newMention.wave_id)) {
        return prev;
      }
      return [...prev, newMention];
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (saveInProgressRef.current || isSaving || isSaveBlockedByLinks) return;
    saveInProgressRef.current = true;
    try {
      const expansion = await mentionsRef.current?.expandMentionAliases();
      if (expansion && !expansion.completed) return;
      const latestEditorState =
        expansion?.editorState ?? editorStateRef.current ?? editorState;
      if (!latestEditorState) return;

      const sanitizedMarkdown = removeBlankLinePlaceholders(
        exportDropMarkdown(latestEditorState, exportMarkdownTransformers)
      );
      const sanitizedMentionedGroups = getMentionedGroupsFromEditorState(
        latestEditorState,
        canResolveAllGroupMention
      );
      const currentMentionedUsers = getMentionedUsersFromEditorState(
        latestEditorState,
        mentionedUsersRef.current
      );
      mentionedUsersRef.current = currentMentionedUsers;

      if (
        sanitizedMarkdown.trim() === normalizedInitialContent.trim() &&
        areMentionedGroupsEqual(
          sanitizedMentionedGroups,
          initialGroupMentions
        ) &&
        areMentionedUsersEqual(currentMentionedUsers, initialMentions)
      ) {
        onCancel();
        return;
      }

      onSave(
        normalizeTypedEmojiShortcuts(sanitizedMarkdown),
        currentMentionedUsers,
        sanitizedMentionedGroups,
        mentionedWaves
      );
    } finally {
      saveInProgressRef.current = false;
    }
  }, [
    editorState,
    exportMarkdownTransformers,
    mentionedWaves,
    canResolveAllGroupMention,
    initialGroupMentions,
    initialMentions,
    isSaving,
    isSaveBlockedByLinks,
    onSave,
    normalizedInitialContent,
    onCancel,
  ]);

  return (
    <div className="tw-w-full" data-editor-mode="true">
      <LexicalComposer initialConfig={initialConfig}>
        <div ref={editorRef} className="tw-relative">
          <RichTextPlugin
            contentEditable={
              <div className="tw-relative">
                <ContentEditable
                  className="tw-min-h-[40px] tw-w-full tw-resize-none tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-py-2.5 tw-pl-3 tw-pr-10 tw-text-sm tw-text-iron-100 tw-outline-none tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 focus:tw-border-primary-400 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
                  style={{
                    fontFamily: "inherit",
                    lineHeight: "1.4",
                  }}
                />
                <CreateDropEmojiPicker top="tw-top-1" />
              </div>
            }
            placeholder={
              <div className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-2 tw-text-sm tw-text-iron-500">
                Edit message...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={handleEditorChange} />
          <HistoryPlugin />
          <PlainTextPastePlugin />
          <MarkdownShortcutPlugin
            transformers={BASE_EDIT_MARKDOWN_TRANSFORMERS}
          />
          <ListPlugin />
          <LinkPlugin />
          <NewMentionsPlugin
            ref={mentionsRef}
            waveId={waveId}
            onSelect={handleMentionSelect}
            canMentionAll={canMentionAll}
          />
          <NewWaveMentionsPlugin
            ref={waveMentionsRef}
            onSelect={handleWaveMentionSelect}
          />
          <EmojiPlugin />
          <RootBlockGuardPlugin />
          <InitialContentPlugin
            initialContent={editorInitialContent}
            transformers={importMarkdownTransformers}
          />
          <FocusPlugin isApp={isApp} />
          <KeyboardPlugin
            onSave={handleSave}
            onCancel={onCancel}
            isSaving={isSaving}
            isSaveBlocked={isSaveBlockedByLinks}
            isMobileOrApp={isMobileOrApp}
            mentionsRef={mentionsRef}
            waveMentionsRef={waveMentionsRef}
          />
        </div>
      </LexicalComposer>

      {!isApp && (
        <div className="tw-mt-1 tw-flex tw-items-center tw-text-xs tw-text-iron-400">
          {!isMobileDevice && <>escape to </>}
          <button
            onClick={onCancel}
            className="tw-cursor-pointer tw-rounded-md tw-border-0 tw-bg-transparent tw-px-[3px] tw-font-medium tw-text-primary-400 tw-transition focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 desktop-hover:hover:tw-underline"
          >
            cancel
          </button>{" "}
          {isMobileDevice ? "• " : "• enter to "}
          <button
            onClick={handleSave}
            disabled={isSaveBlockedByLinks || isSaving}
            title={isSaveBlockedByLinks ? linkRestrictionMessage : undefined}
            className={`tw-rounded-md tw-border-0 tw-bg-transparent tw-px-[3px] tw-font-medium tw-text-primary-400 tw-transition focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 ${
              isSaveBlockedByLinks || isSaving
                ? "tw-cursor-not-allowed tw-opacity-50"
                : "tw-cursor-pointer desktop-hover:hover:tw-underline"
            }`}
          >
            save
          </button>
        </div>
      )}

      {isApp && (
        <div className="tw-mb-2 tw-mt-3">
          <div className="tw-flex tw-gap-x-2">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-iron-300 tw-transition-colors tw-duration-150 active:tw-bg-iron-700 disabled:tw-opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isSaveBlockedByLinks}
              title={isSaveBlockedByLinks ? linkRestrictionMessage : undefined}
              className="tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-white tw-transition-colors tw-duration-150 active:tw-bg-primary-600 disabled:tw-opacity-50"
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
