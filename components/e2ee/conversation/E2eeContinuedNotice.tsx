"use client";

import Link from "next/link";
import { getEncryptedConversationRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { groupConversationThreads } from "@/lib/e2ee/dm-conversations";
import type { E2eeConversation } from "@/lib/e2ee/types";
import { E2eeBanner } from "../ui/E2eeBanner";

interface ContinuedFrom {
  /** The earlier conversation, when this device has it. */
  readonly g: string | null;
}

/**
 * Whether `conversation` continues one made under an earlier encryption
 * suite (D172): a group or DM whose `predecessor` is set, or the current
 * session of a DM thread that also holds a superseded session.
 */
function getContinuedFrom(
  conversation: E2eeConversation,
  conversations: readonly E2eeConversation[],
  selfProfileId: string | null
): ContinuedFrom | null {
  if (conversation.status === "superseded") {
    return null;
  }
  const predecessor = conversation.predecessor ?? null;
  if (predecessor !== null) {
    return {
      g: conversations.some((item) => item.g === predecessor)
        ? predecessor
        : null,
    };
  }
  if (conversation.kind !== "dm") {
    return null;
  }
  const thread = groupConversationThreads(conversations, selfProfileId).find(
    (item) => item.key.startsWith("dm:") && item.current.g === conversation.g
  );
  const earlier = thread?.sessions.find(
    (session) => session.status === "superseded"
  );
  return earlier ? { g: earlier.g } : null;
}

/**
 * Opens the timeline of a conversation that continues a read-only one. It
 * is part of the reading order, not a live region: it is there whenever the
 * conversation opens, so nothing new needs announcing.
 */
export function E2eeContinuedNotice({
  conversation,
  conversations,
  selfProfileId,
}: {
  readonly conversation: E2eeConversation;
  readonly conversations: readonly E2eeConversation[];
  readonly selfProfileId: string | null;
}) {
  const locale = useBrowserLocale();
  const from = getContinuedFrom(conversation, conversations, selfProfileId);
  if (!from) {
    return null;
  }
  return (
    <div className="tw-px-4 tw-pb-3">
      <E2eeBanner
        tone="info"
        live={false}
        action={
          from.g ? (
            <Link
              href={getEncryptedConversationRoute(from.g)}
              className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-min-h-8 tw-items-center tw-rounded-lg tw-text-sm tw-text-primary-300 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {t(locale, "e2ee.superseded.noticeLink")}
            </Link>
          ) : undefined
        }
      >
        {t(locale, "e2ee.superseded.notice")}
      </E2eeBanner>
    </div>
  );
}
