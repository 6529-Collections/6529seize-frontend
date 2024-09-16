import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { EditorState, RootNode } from "lexical";

import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";

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

import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";

import {
  CreateDropConfig,
  MentionedUser,
  ReferencedNft,
} from "../../../entities/IDrop";
import { MentionNode } from "../../drops/create/lexical/nodes/MentionNode";
import { HashtagNode } from "../../drops/create/lexical/nodes/HashtagNode";
import { ImageNode } from "../../drops/create/lexical/nodes/ImageNode";
import ExampleTheme from "../../drops/create/lexical/ExampleTheme";
import { assertUnreachable } from "../../../helpers/AllowlistToolHelpers";
import ClearEditorPlugin, {
  ClearEditorPluginHandles,
} from "../../drops/create/lexical/plugins/ClearEditorPlugin";
import { MENTION_TRANSFORMER } from "../../drops/create/lexical/transformers/MentionTransformer";
import { HASHTAG_TRANSFORMER } from "../../drops/create/lexical/transformers/HastagTransformer";
import { IMAGE_TRANSFORMER } from "../../drops/create/lexical/transformers/ImageTransformer";
import NewMentionsPlugin, {
  NewMentionsPluginHandles,
} from "../../drops/create/lexical/plugins/mentions/MentionsPlugin";
import NewHashtagsPlugin, {
  NewHastagsPluginHandles,
} from "../../drops/create/lexical/plugins/hashtags/HashtagsPlugin";
import { MaxLengthPlugin } from "../../drops/create/lexical/plugins/MaxLengthPlugin";
import DragDropPastePlugin from "../../drops/create/lexical/plugins/DragDropPastePlugin";
import EnterKeyPlugin from "../../drops/create/lexical/plugins/enter/EnterKeyPlugin";

import { ActiveDropAction } from "./WaveDetailedContent";
import { AnimatePresence, motion } from "framer-motion";
import { useClickAway, useKeyPressEvent } from "react-use";

export interface CreateDropInputHandles {
  clearEditorState: () => void;
  focus: () => void;
}

const CreateDropInput = forwardRef<
  CreateDropInputHandles,
  {
    readonly editorState: EditorState | null;
    readonly type: ActiveDropAction | null;
    readonly drop: CreateDropConfig | null;
    readonly canSubmit: boolean;
    readonly canAddPart: boolean;
    readonly setIsStormMode: (isStormMode: boolean) => void;
    readonly onDrop?: () => void;
    readonly onEditorState: (editorState: EditorState) => void;
    readonly onReferencedNft: (referencedNft: ReferencedNft) => void;
    readonly onMentionedUser: (
      mentionedUser: Omit<MentionedUser, "current_handle">
    ) => void;
    readonly setFiles: (files: File[]) => void;
    readonly onDropPart: () => void;
    readonly onAddMetadataClick: () => void;
  }
>(
  (
    {
      editorState,
      type,
      drop,
      canSubmit,
      canAddPart,
      onEditorState,
      onReferencedNft,
      onMentionedUser,
      onDrop,
      setFiles,
      onDropPart,
      setIsStormMode,
      onAddMetadataClick,
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

    const getPlaceHolderText = () => {
      if (!type) return "Create a drop";
      switch (type) {
        case ActiveDropAction.REPLY:
          return "Drop a reply";
        case ActiveDropAction.QUOTE:
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
    const editorRef = useRef<HTMLDivElement>(null);
    const clearEditorState = () => {
      clearEditorRef.current?.clearEditorState();
    };

    useImperativeHandle(ref, () => ({
      clearEditorState,
      focus: () => {
        (
          editorRef.current?.querySelector(
            '[contenteditable="true"]'
          ) as HTMLElement
        )?.focus();
      },
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files: File[] = Array.from(e.target.files);
        setFiles(files);
      }
    };
    const dropdownRef = useRef<HTMLDivElement>(null);

    useClickAway(dropdownRef, () => {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    });

    useKeyPressEvent("Escape", () => {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
      setIsDropdownOpen(!isDropdownOpen);
    };

    return (
      <div className="tailwind-scope" ref={editorRef}>
        <LexicalComposer initialConfig={editorConfig}>
          <div className="tw-flex tw-items-end tw-gap-x-3">
            <div className="tw-relative tw-w-full">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className="editor-input-one-liner tw-pr-24 tw-resize-none tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-700 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-950 focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out 
                  tw-pl-3 tw-py-2.5"
                    autoFocus={true}
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
                onSelect={onMentionedUserAdded}
                ref={mentionsPluginRef}
              />
              <NewHashtagsPlugin
                onSelect={onHashtagAdded}
                ref={hashtagPluginRef}
              />
              <MaxLengthPlugin maxLength={25000} />
              <DragDropPastePlugin />
              <ListPlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <TabIndentationPlugin />
              <LinkPlugin validateUrl={validateUrl} />
              <ClearEditorPlugin ref={clearEditorRef} />
              <EnterKeyPlugin
                handleSubmit={handleSubmit}
                canSubmitWithEnter={canSubmitWithEnter}
              />
              <div className="tw-flex tw-items-center tw-absolute tw-top-3 tw-right-9">
                <button
                  onClick={breakIntoStorm}
                  disabled={!canAddPart}
                  type="button"
                  className="tw-border-0 tw-bg-transparent tw-cursor-pointer tw-flex tw-items-center tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300 tw-mr-2"
                >
                  <svg
                    className="tw-h-4 tw-w-4 tw-flex-shrink-0 -tw-mr-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 5V19M5 12H19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <svg
                    className="tw-h-[1.15rem] tw-w-[1.15rem] tw-flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 4H3M20 8L6 8M18 12L9 12M15 16L8 16M17 20H12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div ref={dropdownRef}>
                <div
                  className="tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-p-2 tw-group tw-absolute tw-top-0.5 tw-right-2 tw-rounded-lg tw-border-none tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50 tw-ease-out tw-transition tw-duration-300"
                  onClick={toggleDropdown}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="tw-size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="tw-absolute tw-right-0 tw-top-10 tw-z-10 tw-w-40 tw-origin-top-right tw-rounded-lg tw-bg-iron-950 tw-py-2 tw-px-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 tw-focus:tw-outline-none tw-space-y-1"
                    >
                      <label className="tw-px-2 tw-py-1.5 tw-text-sm tw-flex tw-items-center tw-gap-x-2 hover:tw-bg-primary-500 tw-rounded-md tw-cursor-pointer tw-text-iron-400 hover:tw-text-iron-50 tw-transition-all tw-duration-300 tw-ease-out">
                        <svg
                          className="tw-flex-shrink-0 tw-h-5 tw-w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                          />
                        </svg>
                        <input
                          type="file"
                          className="tw-hidden"
                          accept="image/*,video/*,audio/*"
                          multiple
                          onChange={handleFileChange}
                        />
                        <span>Upload a file</span>
                      </label>

                      <div
                        className="tw-px-2 tw-py-1.5 tw-text-sm tw-flex tw-items-center tw-gap-x-2 hover:tw-bg-primary-500 tw-rounded-md tw-cursor-pointer tw-text-iron-400 hover:tw-text-iron-50 tw-transition-all tw-duration-300 tw-ease-out"
                        onClick={() => {
                          onAddMetadataClick();
                          setIsDropdownOpen(false);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="tw-flex-shrink-0 tw-h-5 tw-w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                          />
                        </svg>
                        <span className="tw-text-sm">Add metadata</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </LexicalComposer>
      </div>
    );
  }
);

CreateDropInput.displayName = "CreateDropInput";
export default CreateDropInput;
