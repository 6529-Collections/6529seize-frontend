"use client";

import type { Drop } from "@/helpers/waves/drop.helpers";
import type { SupportedLocale } from "@/i18n/locales";
import { selectPluralCategory } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { Virtualizer } from "@tanstack/react-virtual";
import type { MutableRefObject } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  resolveChatScrollBehavior,
  type ChatEndScroller,
} from "./chatScrollBehavior";

// Within this many pixels of the end the list counts as at the live end.
export const CHAT_END_THRESHOLD_PX = 4;
// New messages are announced together after this period.
const ANNOUNCE_DELAY_MS = 1500;

/** The key of the row holding keyboard focus inside the scroller. */
export function useFocusedChatItemKey(
  scrollElement: HTMLElement | null
): string | null {
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!scrollElement) {
      return;
    }
    const handleFocusIn = (event: FocusEvent) => {
      const row =
        event.target instanceof Element
          ? event.target.closest("[data-chat-item-key]")
          : null;
      setFocusedKey(row?.getAttribute("data-chat-item-key") ?? null);
    };
    const handleFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !scrollElement.contains(next)) {
        setFocusedKey(null);
      }
    };
    scrollElement.addEventListener("focusin", handleFocusIn);
    scrollElement.addEventListener("focusout", handleFocusOut);
    return () => {
      scrollElement.removeEventListener("focusin", handleFocusIn);
      scrollElement.removeEventListener("focusout", handleFocusOut);
    };
  }, [scrollElement]);
  return focusedKey;
}

/**
 * Keeps the windowed chat at its newest message: it opens there, follows
 * appended messages while the reader is at the live end (never while a jump
 * owns the position), stays there when the scroller resizes, and gives
 * "scroll to latest" to the rest of the chat through `endScrollerRef`.
 */
export function useWindowedChatEnd({
  virtualizer,
  scrollElement,
  itemCount,
  newestKey,
  serialNo,
  endScrollerRef,
}: {
  readonly virtualizer: Virtualizer<HTMLDivElement, HTMLDivElement>;
  readonly scrollElement: HTMLDivElement | null;
  readonly itemCount: number;
  readonly newestKey: string | null;
  readonly serialNo: number | null;
  readonly endScrollerRef: MutableRefObject<ChatEndScroller | null>;
}): void {
  const didOpenAtEndRef = useRef(false);
  useLayoutEffect(() => {
    if (didOpenAtEndRef.current || itemCount === 0 || !scrollElement) {
      return;
    }
    didOpenAtEndRef.current = true;
    virtualizer.scrollToEnd();
  }, [itemCount, scrollElement, virtualizer]);

  useEffect(() => {
    endScrollerRef.current = (behavior) => {
      virtualizer.scrollToEnd({
        behavior: resolveChatScrollBehavior(behavior),
      });
    };
    return () => {
      endScrollerRef.current = null;
    };
  }, [endScrollerRef, virtualizer]);

  // Whether the reader is at the live end, from the element itself. The
  // virtualizer reads its offset back from scroll events, so during a burst
  // its own check can still see the position before the last follow and
  // stop following; the element already has the written position.
  const wasAtEndRef = useRef(true);

  const followedNewestKeyRef = useRef(newestKey);
  useLayoutEffect(() => {
    if (followedNewestKeyRef.current === newestKey) {
      return;
    }
    followedNewestKeyRef.current = newestKey;
    if (wasAtEndRef.current && serialNo === null && didOpenAtEndRef.current) {
      virtualizer.scrollToEnd();
    }
  }, [newestKey, serialNo, virtualizer]);

  // The composer, the keyboard or the bottom navigation can resize the
  // scroller. A reader at the live end stays there.
  useEffect(() => {
    if (!scrollElement) {
      return;
    }
    let observedHeight = scrollElement.clientHeight;
    const recordEnd = () => {
      // The browser can report a scroll caused by the resize itself before
      // the resize observer runs; the observer decides with the old height.
      if (scrollElement.clientHeight !== observedHeight) {
        return;
      }
      wasAtEndRef.current =
        scrollElement.scrollHeight -
          scrollElement.clientHeight -
          scrollElement.scrollTop <=
        CHAT_END_THRESHOLD_PX;
    };
    scrollElement.addEventListener("scroll", recordEnd, { passive: true });
    if (typeof ResizeObserver === "undefined") {
      return () => scrollElement.removeEventListener("scroll", recordEnd);
    }
    const observer = new ResizeObserver(() => {
      const resized = scrollElement.clientHeight !== observedHeight;
      observedHeight = scrollElement.clientHeight;
      if (resized && wasAtEndRef.current) {
        virtualizer.scrollToEnd();
      }
    });
    observer.observe(scrollElement);
    return () => {
      scrollElement.removeEventListener("scroll", recordEnd);
      observer.disconnect();
    };
  }, [scrollElement, virtualizer]);
}

const isTemporaryDrop = (drop: Drop) => drop.id.startsWith("temp-");

/**
 * How many drops after the previous newest one were appended at the end,
 * leaving out the reader's own pending sends.
 */
const countAppendedDrops = (
  orderedDrops: readonly Drop[],
  previousNewestKey: string | null
): number => {
  if (previousNewestKey === null) {
    return 0;
  }
  const index = orderedDrops.findIndex(
    (drop) => drop.stableKey === previousNewestKey
  );
  if (index === -1) {
    return 0;
  }
  return orderedDrops.slice(index + 1).filter((drop) => !isTemporaryDrop(drop))
    .length;
};

/**
 * The text of the chat's one polite live region: missed-history progress
 * (`announce`) and arrivals, counted together so a busy wave is announced
 * at most once per period instead of once per message.
 */
export function useChatAnnouncements({
  orderedDrops,
  newestKey,
  waveId,
  locale,
}: {
  readonly orderedDrops: readonly Drop[];
  readonly newestKey: string | null;
  readonly waveId: string | undefined;
  readonly locale: SupportedLocale;
}): { readonly message: string; readonly announce: (text: string) => void } {
  const [announcement, setAnnouncement] = useState<{
    readonly waveId: string | undefined;
    readonly message: string;
  } | null>(null);
  const announce = useCallback(
    (message: string) => setAnnouncement({ waveId, message }),
    [waveId]
  );

  const previousNewestKeyRef = useRef<string | null>(newestKey);
  const pendingArrivalsRef = useRef(0);
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announceArrivalsRef = useRef<(count: number) => void>(() => undefined);
  useEffect(() => {
    announceArrivalsRef.current = (count) =>
      announce(
        t(
          locale,
          selectPluralCategory(locale, count) === "one"
            ? "waves.chat.newMessages.one"
            : "waves.chat.newMessages.other",
          { count }
        )
      );
  }, [announce, locale]);
  useEffect(() => {
    const appended = countAppendedDrops(
      orderedDrops,
      previousNewestKeyRef.current
    );
    previousNewestKeyRef.current = newestKey;
    if (appended === 0) {
      return;
    }
    pendingArrivalsRef.current += appended;
    announceTimerRef.current ??= setTimeout(() => {
      announceTimerRef.current = null;
      const count = pendingArrivalsRef.current;
      pendingArrivalsRef.current = 0;
      if (count > 0) {
        announceArrivalsRef.current(count);
      }
    }, ANNOUNCE_DELAY_MS);
  }, [orderedDrops, newestKey]);
  useEffect(
    () => () => {
      if (announceTimerRef.current !== null) {
        clearTimeout(announceTimerRef.current);
      }
    },
    []
  );

  return {
    message:
      announcement !== null && announcement.waveId === waveId
        ? announcement.message
        : "",
    announce,
  };
}
