"use client";

import {
  createContext,
  memo,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef,
} from "react";
import type { Components } from "react-markdown";
import type { Plugin } from "unified";
import { MessageMarkdown } from "@/components/markdown/MessageMarkdown";
import type { E2eeMember } from "@/lib/e2ee/types";
import { findMember } from "../e2eeFormat";
import { E2eeProfileLink } from "../ui/E2eeProfileLink";
import { E2eeEmojiText } from "./E2eeEmojiText";
import { splitMentions } from "./e2eeMentions";

interface PrivateTextContext {
  readonly members: readonly E2eeMember[];
  readonly mentions: readonly string[];
  readonly selfProfileId: string | null;
  readonly preview?: boolean;
}

const TextContext = createContext<PrivateTextContext>({
  members: [],
  mentions: [],
  selfProfileId: null,
});

interface TextTree {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: TextTree[];
}

/** Decorate only prose. Code and link labels must never become profile links. */
function wrapProse(node: TextTree): void {
  if (!node.children || ["code", "pre", "a"].includes(node.tagName ?? ""))
    return;
  node.children = node.children.map((child) => {
    if (child.type === "text" && child.value?.trim()) {
      return {
        type: "element",
        tagName: "span",
        properties: {},
        children: [child],
      };
    }
    wrapProse(child);
    return child;
  });
}

const rehypePrivateText: Plugin = () => (tree) => wrapProse(tree as TextTree);

function Prose({ children }: ComponentPropsWithoutRef<"span">) {
  const { members, mentions, selfProfileId, preview } = useContext(TextContext);
  if (typeof children !== "string") return <span>{children}</span>;
  if (preview) return <E2eeEmojiText text={children} size="sm" />;
  return splitMentions(children, members, mentions).map((segment) =>
    segment.kind === "mention" ? (
      <E2eeProfileLink
        key={segment.start}
        member={findMember(members, segment.profileId)}
        className={`tw-rounded tw-px-0.5 tw-font-semibold tw-text-primary-300 ${segment.profileId === selfProfileId ? "tw-bg-primary-500/25" : ""}`}
      >
        {segment.value}
      </E2eeProfileLink>
    ) : (
      <E2eeEmojiText key={segment.start} text={segment.value} />
    )
  );
}

const COMPONENTS: Components = { span: Prose };
const TEXT_PLUGINS = [rehypePrivateText];

/** The encrypted adapter supplies only local mentions and catalog emoji. */
export const E2eeMarkdown = memo(
  ({
    text,
    messageId,
    members,
    mentions,
    selfProfileId,
    preview = false,
    inlinePreview = false,
  }: PrivateTextContext & {
    readonly text: string;
    readonly messageId: string;
    readonly inlinePreview?: boolean;
  }) => {
    const context = useMemo(
      () => ({
        members,
        mentions,
        selfProfileId,
        preview: preview || inlinePreview,
      }),
      [members, mentions, selfProfileId, preview, inlinePreview]
    );
    return (
      <TextContext.Provider value={context}>
        <MessageMarkdown
          text={text}
          messageId={messageId}
          privacy="private"
          preview={preview}
          inlinePreview={inlinePreview}
          components={COMPONENTS}
          textPlugins={TEXT_PLUGINS}
        />
      </TextContext.Provider>
    );
  }
);

E2eeMarkdown.displayName = "E2eeMarkdown";
