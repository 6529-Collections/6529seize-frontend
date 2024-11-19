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
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import NewMentionsPlugin, {
  NewMentionsPluginHandles,
} from "../lexical/plugins/mentions/MentionsPlugin";
import NewHashtagsPlugin, {
  NewHastagsPluginHandles,
} from "../lexical/plugins/hashtags/HashtagsPlugin";
import {
  CreateDropConfig,
  MentionedUser,
  ReferencedNft,
} from "../../../../entities/IDrop";
import { MaxLengthPlugin } from "../lexical/plugins/MaxLengthPlugin";
import ToggleViewButtonPlugin from "../lexical/plugins/ToggleViewButtonPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
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
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { MENTION_TRANSFORMER } from "../lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../lexical/transformers/HastagTransformer";
import { ApiWaveParticipationRequirement } from "../../../../generated/models/ApiWaveParticipationRequirement";
import CreateDropContentMissingMediaWarning from "./storm/CreateDropContentMissingMediaWarning";
import { ApiWaveRequiredMetadata } from "../../../../generated/models/ApiWaveRequiredMetadata";
import CreateDropContentMissingMetadataWarning from "./storm/CreateDropContentMissingMetadataWarning";
import DragDropPastePlugin from "../lexical/plugins/DragDropPastePlugin";
import { ImageNode } from "../lexical/nodes/ImageNode";

import CreateDropParts from "./storm/CreateDropParts";
import CreateDropActionsRow from "./CreateDropActionsRow";
import { IMAGE_TRANSFORMER } from "../lexical/transformers/ImageTransformer";
import EnterKeyPlugin from "../lexical/plugins/enter/EnterKeyPlugin";
import AutoFocusPlugin from "../lexical/plugins/AutoFocusPlugin";

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
    readonly onDrop?: () => void;
    readonly onEditorState: (editorState: EditorState) => void;
    readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
    readonly onMentionedUser: (
      mentionedUser: Omit<MentionedUser, "current_handle">
    ) => void;
    readonly setFiles: (files: File[]) => void;
    readonly onViewClick: () => void;
    readonly onDropPart: () => void;
    readonly children?: React.ReactNode;
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
      editorState?.read(() =>
        setCharsCount(
          $convertToMarkdownString([
            ...TRANSFORMERS,
            MENTION_TRANSFORMER,
            HASHTAG_TRANSFORMER,
            IMAGE_TRANSFORMER,
          ])?.length ?? 0
        )
      );
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

    const canSubmitWithEnter = () => !isMentionsOpen() && !isHashtagsOpen();

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
        <LexicalComposer initialConfig={editorConfig}>
          <div className="tw-flex tw-items-end tw-gap-x-3">
            <div className="tw-relative tw-w-full">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className={`${
                      viewType === CreateDropViewType.COMPACT
                        ? "editor-input-one-liner tw-pr-12"
                        : "editor-input-multi-liner"
                    } tw-resize-none tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-800 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-900 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
                  tw-pl-3 tw-py-3`}
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

              <OnChangePlugin onChange={onEditorStateChange} />
              <NewMentionsPlugin
                waveId={waveId}
                onSelect={onMentionedUserAdded}
                ref={mentionsPluginRef}
              />
              <NewHashtagsPlugin
                onSelect={onHashtagAdded}
                ref={hashtagPluginRef}
              />
              <MaxLengthPlugin maxLength={25000} />
              <DragDropPastePlugin />
              {showToggleViewButton && (
                <ToggleViewButtonPlugin onViewClick={onViewClick} />
              )}
              <ListPlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <TabIndentationPlugin />
              <LinkPlugin validateUrl={validateUrl} />
              <ClearEditorPlugin ref={clearEditorRef} />
              <EnterKeyPlugin
                handleSubmit={handleSubmit}
                canSubmitWithEnter={canSubmitWithEnter}
                disabled={false}
              />
              <AutoFocusPlugin />
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
