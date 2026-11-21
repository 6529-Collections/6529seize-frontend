"use client";

import type { ComponentPropsWithoutRef } from "react";
import type { Components } from "react-markdown";
import { E2eeEmojiProvider } from "@/components/e2ee/conversation/E2eeEmojiProvider";
import { E2eeEmojiText } from "@/components/e2ee/conversation/E2eeEmojiText";
import { MessageMarkdown } from "@/components/markdown/MessageMarkdown";
import { rehypeWrapMarkdownProse } from "@/components/markdown/wrapProse";

function PreviewProse({ children }: ComponentPropsWithoutRef<"span">) {
  return typeof children === "string" ? (
    <E2eeEmojiText text={children} size="sm" />
  ) : (
    <span>{children}</span>
  );
}

const COMPONENTS: Components = { span: PreviewProse };
const TEXT_PLUGINS = [rehypeWrapMarkdownProse];

/** Every notification uses catalog-only emoji and non-interactive Markdown. */
export default function NotificationMarkdownPreview({
  text,
  messageId,
  drop = false,
}: {
  readonly text: string;
  readonly messageId: string;
  readonly drop?: boolean;
}) {
  return (
    <E2eeEmojiProvider>
      <MessageMarkdown
        text={text}
        messageId={messageId}
        privacy={drop ? "public" : "private"}
        preview={drop ? "drop" : true}
        components={COMPONENTS}
        textPlugins={TEXT_PLUGINS}
      />
    </E2eeEmojiProvider>
  );
}
