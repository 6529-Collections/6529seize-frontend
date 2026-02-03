"use client";

import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { EditorState } from "lexical";
import { RootNode } from "lexical";
import { MentionNode } from "../lexical/nodes/MentionNode";
import { HashtagNode } from "../lexical/nodes/HashtagNode";
import { WaveMentionNode } from "../lexical/nodes/WaveMentionNode";
import ExampleTheme from "../lexical/ExampleTheme";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import type { NewMentionsPluginHandles } from "../lexical/plugins/mentions/MentionsPlugin";
import NewMentionsPlugin from "../lexical/plugins/mentions/MentionsPlugin";
import type { NewHastagsPluginHandles } from "../lexical/plugins/hashtags/HashtagsPlugin";
import NewHashtagsPlugin from "../lexical/plugins/hashtags/HashtagsPlugin";
import type { NewWaveMentionsPluginHandles } from "../lexical/plugins/waves/WaveMentionsPlugin";
import NewWaveMentionsPlugin from "../lexical/plugins/waves/WaveMentionsPlugin";
import type {
  CreateDropConfig,
  MentionedUser,
  MentionedWave,
  ReferencedNft,
} from "@/entities/IDrop";
import { MaxLengthPlugin } from "../lexical/plugins/MaxLengthPlugin";
import ToggleViewButtonPlugin from "../lexical/plugins/ToggleViewButtonPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";

import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { ListNode, ListItemNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { CreateDropType, CreateDropViewType } from "../types";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import type { ClearEditorPluginHandles } from "../lexical/plugins/ClearEditorPlugin";
import ClearEditorPlugin from "../lexical/plugins/ClearEditorPlugin";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { MENTION_TRANSFORMER } from "../lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../lexical/transformers/HastagTransformer";
import { WAVE_MENTION_TRANSFORMER } from "../lexical/transformers/WaveMentionTransformer";
import type { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import CreateDropContentMissingMediaWarning from "./storm/CreateDropContentMissingMediaWarning";
import type { ApiWaveRequiredMetadata } from "@/generated/models/ApiWaveRequiredMetadata";
import CreateDropContentMissingMetadataWarning from "./storm/CreateDropContentMissingMetadataWarning";
import DragDropPastePlugin from "../lexical/plugins/DragDropPastePlugin";
import { ImageNode } from "../lexical/nodes/ImageNode";

import CreateDropParts from "./storm/CreateDropParts";
import CreateDropActionsRow from "./CreateDropActionsRow";
import { IMAGE_TRANSFORMER } from "../lexical/transformers/ImageTransformer";
import { SAFE_MARKDOWN_TRANSFORMERS } from "../lexical/transformers/markdownTransformers";
import EnterKeyPlugin from "../lexical/plugins/enter/EnterKeyPlugin";
import AutoFocusPlugin from "../lexical/plugins/AutoFocusPlugin";
import { EmojiNode } from "../lexical/nodes/EmojiNode";
import CreateDropEmojiPicker from "@/components/waves/CreateDropEmojiPicker";
import EmojiPlugin from "../lexical/plugins/emoji/EmojiPlugin";
import PlainTextPastePlugin from "../lexical/plugins/PlainTextPastePlugin";
import { exportDropMarkdown } from "@/components/waves/drops/normalizeDropMarkdown";

export interface CreateDropContentHandles {
  clearEditorState: () => void;
}

const CreateDropContent = forwardRef<
  CreateDropContentHandles,
  {
    readonly waveId: string | null;
    readonly viewType: CreateDropViewType;
    readonly editorState: EditorState | null;
    readonly type: CreateDropType;
    readonly drop: CreateDropConfig | null;
    readonly canAddPart: boolean;
    readonly canSubmit: boolean;
    readonly missingMedia: ApiWaveParticipationRequirement[];
    readonly missingMetadata: ApiWaveRequiredMetadata[];
    readonly onDrop?: (() => void) | undefined;
    readonly onEditorState: (editorState: EditorState) => void;
    readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
    readonly onMentionedUser: (
      mentionedUser: Omit<MentionedUser, "current_handle">
    ) => void;
    readonly onMentionedWave: (mentionedWave: MentionedWave) => void;
    readonly setFiles: (files: File[]) => void;
    readonly onViewClick: () => void;
    readonly onDropPart: () => void;
    readonly children?: React.ReactNode | undefined;
  }
>(
  (
    {
      viewType,
      editorState,
      type,
      drop,
      canAddPart,
      canSubmit,
      waveId,
      missingMedia,
      missingMetadata,
      onEditorState,
      onReferencedNft,
      onMentionedUser,
      onMentionedWave,
      onDrop,
      setFiles,
      onViewClick,
      onDropPart,
      children,
    },
    ref
  ) => {
    const editorConfig: InitialConfigType = {
      namespace: "User Drop",
      nodes: [
        MentionNode,
        HashtagNode,
        WaveMentionNode,
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
        EmojiNode,
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
    const onMentionedWaveAdded = (wave: MentionedWave) => {
      onMentionedWave(wave);
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
      if (!editorState) {
        setCharsCount(0);
        return;
      }
      const markdown = exportDropMarkdown(editorState, [
        ...SAFE_MARKDOWN_TRANSFORMERS,
        MENTION_TRANSFORMER,
        HASHTAG_TRANSFORMER,
        WAVE_MENTION_TRANSFORMER,
        IMAGE_TRANSFORMER,
      ]);
      setCharsCount(markdown.length);
    }, [editorState]);

    const [isStormMode, setIsStormMode] = useState(false);
    const breakIntoStorm = () => {
      onDropPart();
      setIsStormMode(true);
    };

    const mentionsPluginRef = useRef<NewMentionsPluginHandles | null>(null);
    const isMentionsOpen = () => !!mentionsPluginRef.current?.isMentionsOpen();

    const hashtagPluginRef = useRef<NewHastagsPluginHandles | null>(null);
    const isHashtagsOpen = () => !!hashtagPluginRef.current?.isHashtagsOpen();

    const waveMentionsPluginRef = useRef<NewWaveMentionsPluginHandles | null>(
      null
    );
    const isWaveMentionsOpen = () =>
      !!waveMentionsPluginRef.current?.isWaveMentionsOpen();

    const canSubmitWithEnter = () =>
      !isMentionsOpen() && !isHashtagsOpen() && !isWaveMentionsOpen();

    const canSubmitRef = useRef(canSubmit);
    const onDropRef = useRef(onDrop);

    useEffect(() => {
      canSubmitRef.current = canSubmit;
    }, [canSubmit]);

    useEffect(() => {
      onDropRef.current = onDrop;
    }, [onDrop]);

    const handleSubmit = useCallback(() => {
      if (!canSubmitRef.current || !onDropRef.current) {
        return;
      }
      onDropRef.current();
    }, []);

    return (
      <div className="tailwind-scope">
        {showToggleViewButton && (
          <ToggleViewButtonPlugin onViewClick={onViewClick} />
        )}
        <LexicalComposer initialConfig={editorConfig}>
          <div className="tw-flex tw-items-end tw-gap-x-3">
            <div className="tw-relative tw-w-full">
              <RichTextPlugin
                contentEditable={
                  <div className="tw-relative">
                    <ContentEditable
                      spellCheck={true}
                      autoCorrect="on"
                      className={`${
                        viewType === CreateDropViewType.COMPACT
                          ? "editor-input-one-liner tw-pr-12"
                          : "editor-input-multi-liner"
                      } tw-form-input tw-block tw-w-full tw-resize-none tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-py-3 tw-pl-3 tw-text-md tw-font-normal tw-leading-6 tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-700 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400`}
                    />
                    <div className="tw-absolute tw-right-2 tw-top-0 tw-flex tw-h-full tw-items-start tw-justify-center tw-py-2">
                      <CreateDropEmojiPicker />
                    </div>
                  </div>
                }
                placeholder={
                  <span className="editor-placeholder">
                    {getPlaceHolderText()}
                  </span>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />

              <OnChangePlugin onChange={onEditorStateChange} />
              <NewMentionsPlugin
                waveId={waveId}
                onSelect={onMentionedUserAdded}
                ref={mentionsPluginRef}
              />
              <NewWaveMentionsPlugin
                onSelect={onMentionedWaveAdded}
                ref={waveMentionsPluginRef}
              />
              <NewHashtagsPlugin
                onSelect={onHashtagAdded}
                ref={hashtagPluginRef}
              />
              <MaxLengthPlugin maxLength={25000} />
              <DragDropPastePlugin />
              <ListPlugin />
              <PlainTextPastePlugin />
              <MarkdownShortcutPlugin
                transformers={SAFE_MARKDOWN_TRANSFORMERS}
              />
              <TabIndentationPlugin />
              <LinkPlugin validateUrl={validateUrl} />
              <ClearEditorPlugin ref={clearEditorRef} />
              <EnterKeyPlugin
                handleSubmit={handleSubmit}
                canSubmitWithEnter={canSubmitWithEnter}
                disabled={false}
              />
              <AutoFocusPlugin />
              <EmojiPlugin />
            </div>
            {children && <div>{children}</div>}
          </div>
        </LexicalComposer>
        <CreateDropParts
          partsCount={drop?.parts.length ?? 0}
          currentPartCount={currentPartCount}
          charsCount={charsCount}
          isStormMode={isStormMode}
        />
        <CreateDropActionsRow
          canAddPart={canAddPart}
          isStormMode={isStormMode}
          setFiles={setFiles}
          breakIntoStorm={breakIntoStorm}
        />
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
