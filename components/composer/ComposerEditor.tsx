"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  LexicalComposer,
  type InitialConfigType,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import type { EditorState } from "lexical";
import type { Transformer } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import { EmojiNode } from "@/components/drops/create/lexical/nodes/EmojiNode";
import EmojiPlugin from "@/components/drops/create/lexical/plugins/emoji/EmojiPlugin";
import RootBlockGuardPlugin from "@/components/drops/create/lexical/plugins/RootBlockGuardPlugin";
import PlainTextPastePlugin from "@/components/drops/create/lexical/plugins/PlainTextPastePlugin";
import { MarkdownShortcutPlugin } from "@/components/drops/create/lexical/plugins/MarkdownShortcutPlugin";
import { COMPOSER_INPUT_CLASS_NAME } from "@/components/waves/composerPresentation";

export const COMPOSER_RICH_TEXT_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode,
  HorizontalRuleNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  EmojiNode,
];

/** Shared editing surface. Network, persistence and send adapters stay with each composer. */
export function ComposerEditor({
  initialConfig,
  placeholder,
  onEditorState,
  transformers,
  inputProps,
  picker,
  children,
  validateUrl,
}: {
  readonly initialConfig: InitialConfigType;
  readonly placeholder: string;
  readonly onEditorState: (state: EditorState) => void;
  readonly transformers: Transformer[];
  readonly inputProps?:
    | Omit<ComponentProps<typeof ContentEditable>, "placeholder">
    | undefined;
  readonly picker: ReactNode;
  readonly children: ReactNode;
  readonly validateUrl?: ((url: string) => boolean) | undefined;
}) {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="tw-relative tw-w-full tw-min-w-0">
        <RichTextPlugin
          contentEditable={
            <div className="tw-relative">
              <ContentEditable
                spellCheck
                autoCorrect="on"
                ariaLabel={placeholder}
                style={{ touchAction: "manipulation" }}
                className={`editor-input-one-liner tw-form-input ${COMPOSER_INPUT_CLASS_NAME} tw-font-normal tw-caret-primary-400 tw-scrollbar-thin tw-scrollbar-track-iron-900 tw-scrollbar-thumb-iron-600`}
                {...inputProps}
              />
              {picker}
            </div>
          }
          placeholder={
            <span className="tw-pointer-events-none tw-absolute tw-left-[13px] tw-top-[9px] tw-block tw-max-w-[calc(100%-3.5rem)] tw-truncate tw-text-sm tw-leading-6 tw-text-iron-500">
              {placeholder}
            </span>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin
          onChange={onEditorState}
          ignoreHistoryMergeTagChange={false}
        />
        <RootBlockGuardPlugin />
        <ListPlugin />
        <PlainTextPastePlugin />
        <MarkdownShortcutPlugin transformers={transformers} />
        <TabIndentationPlugin />
        <LinkPlugin {...(validateUrl ? { validateUrl } : {})} />
        <EmojiPlugin />
        {children}
      </div>
    </LexicalComposer>
  );
}
