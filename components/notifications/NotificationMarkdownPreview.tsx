"use client";

import { E2eeEmojiProvider } from "@/components/e2ee/conversation/E2eeEmojiProvider";
import { E2eeMarkdown } from "@/components/e2ee/conversation/E2eeMarkdown";

const EMPTY = [] as const;

/** Every notification uses catalog-only emoji and non-interactive Markdown. */
export default function NotificationMarkdownPreview({
  text,
  messageId,
}: {
  readonly text: string;
  readonly messageId: string;
}) {
  return (
    <E2eeEmojiProvider>
      <E2eeMarkdown
        text={text}
        messageId={messageId}
        members={EMPTY}
        mentions={EMPTY}
        selfProfileId={null}
        preview
      />
    </E2eeEmojiProvider>
  );
}
