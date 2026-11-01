import type { E2eeConversation } from "@/lib/e2ee/types";
import { detectE2eePlatform } from "./e2eePlatform";

/**
 * Local desktop notifications for encrypted chats (6529 Desktop only). Like
 * the phone push they say only "New encrypted message": no sender, chat name
 * or text. They are raised on this computer from the engine's own state, so
 * nothing about the chat leaves it; a click opens the chat.
 */

interface DesktopNotificationTarget {
  readonly targetAddress?: string | null;
  readonly targetProfileId?: string | null;
  readonly targetProfileHandle?: string | null;
}

/** The native notification bridge 6529 Desktop's preload exposes. */
interface DesktopNotificationsBridge {
  showNotification(
    id: number,
    pfp: string,
    title: string,
    body: string,
    redirectPath: string,
    target?: DesktopNotificationTarget
  ): void;
}

/** The desktop app's notification bridge, or null in a browser or phone app. */
export function getDesktopNotificationsBridge(): DesktopNotificationsBridge | null {
  if (detectE2eePlatform() !== "desktop") {
    return null;
  }
  const candidate = (globalThis as { notifications?: unknown }).notifications;
  if (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof (candidate as Partial<DesktopNotificationsBridge>)
      .showNotification === "function"
  ) {
    return candidate as DesktopNotificationsBridge;
  }
  return null;
}

/** The newest countable message per chat that was already notified or seen. */
export type E2eeNoticeMarks = ReadonlyMap<string, number>;

interface E2eeDesktopNotice {
  readonly g: string;
  readonly seq: number;
}

/**
 * Chats whose newest message from someone else is new since `marks` and
 * still unread. Muted chats and the chat open in a focused window are marked
 * without a notice. `marks: null` takes the baseline (what this device
 * already had when the engine became ready) without notices. Returns the
 * notices and the new marks.
 */
export function collectE2eeDesktopNotices({
  marks,
  conversations,
  ownProfileId,
  muted,
  focusedChat,
}: {
  readonly marks: E2eeNoticeMarks | null;
  readonly conversations: readonly E2eeConversation[];
  readonly ownProfileId: string;
  readonly muted: ReadonlySet<string>;
  readonly focusedChat: string | null;
}): { readonly notices: E2eeDesktopNotice[]; readonly marks: E2eeNoticeMarks } {
  // Only chats listed now are kept, so chats left or removed drop out.
  const next = new Map<string, number>();
  const notices: E2eeDesktopNotice[] = [];
  for (const conversation of conversations) {
    const last = conversation.lastMessage;
    if (!last || last.pending) {
      continue;
    }
    // After the baseline, a chat never seen before (just joined) starts at 0.
    const seen = marks === null ? null : (marks.get(conversation.g) ?? 0);
    next.set(conversation.g, Math.max(seen ?? 0, last.seq));
    if (
      seen !== null &&
      last.seq > seen &&
      conversation.unread > 0 &&
      last.senderProfileId !== ownProfileId &&
      conversation.status === "active" &&
      !muted.has(conversation.g) &&
      focusedChat !== conversation.g
    ) {
      notices.push({ g: conversation.g, seq: last.seq });
    }
  }
  return { notices, marks: next };
}

const fnv1a = (text: string, seed: number): number => {
  let hash = seed;
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/**
 * A stable id per chat message for the desktop's de-duplication. Negative,
 * so it never equals a notification id from the server (positive), and 52
 * bits wide, so two messages practically never share one.
 */
export function e2eeNoticeId(notice: E2eeDesktopNotice): number {
  const key = `e2ee:${notice.g}:${notice.seq}`;
  const high = fnv1a(key, 0x811c9dc5) & 0xfffff;
  const low = fnv1a(key, 0x050c5d1f);
  return -(high * 0x1_0000_0000 + low + 1);
}
