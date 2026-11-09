"use client";

import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { useHorizontalSwipe } from "./useHorizontalSwipe";

const SWIPE_REPLY_DISTANCE = 96;

interface SwipeToReplyOptions {
  readonly enabled: boolean;
  readonly canReply: boolean;
  readonly scope: string;
  readonly onReply: () => void;
  readonly onStart?: () => void;
  readonly rootRef?: RefObject<HTMLDivElement | null>;
}

function clearSwipeFeedback(root: HTMLDivElement | null) {
  root?.style.removeProperty("--message-swipe-transform");
  root?.style.removeProperty("--message-swipe-time-opacity");
  root?.removeAttribute("data-reply-swiping");
  root?.removeAttribute("data-reply-ready");
}

function clearContentStyles(content: HTMLDivElement | null) {
  content?.style.removeProperty("will-change");
  content?.style.removeProperty("transition");
}

export function useSwipeToReply({
  enabled,
  canReply,
  scope,
  onReply,
  onStart,
  rootRef: providedRootRef,
}: SwipeToReplyOptions) {
  const fallbackRootRef = useRef<HTMLDivElement>(null);
  const rootRef = providedRootRef ?? fallbackRootRef;
  const contentRef = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);

  const onTouchStart = useHorizontalSwipe(
    {
      enabled,
      direction: -1,
      threshold: SWIPE_REPLY_DISTANCE,
      onStart: () => {
        const previousAnimation = animation.current;
        animation.current = null;
        previousAnimation?.cancel();
        contentRef.current?.style.setProperty("will-change", "transform");
        contentRef.current?.style.setProperty("transition", "none");
        rootRef.current?.setAttribute("data-reply-swiping", "true");
        onStart?.();
      },
      onMove: (distance, ready) => {
        const root = rootRef.current;
        if (!root) return;
        const offset = Math.min(distance, 148);
        root.style.setProperty(
          "--message-swipe-transform",
          `translate3d(-${offset}px, 0, 0)`
        );
        root.style.setProperty(
          "--message-swipe-time-opacity",
          String(Math.min(1, distance / 64))
        );
        const readyValue = String(ready && canReply);
        if (root.dataset["replyReady"] !== readyValue) {
          root.dataset["replyReady"] = readyValue;
        }
      },
      onEnd: (committed, distance) => {
        const root = rootRef.current;
        const content = contentRef.current;
        clearSwipeFeedback(root);
        const reducedMotion = globalThis.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        if (
          content &&
          !reducedMotion &&
          typeof content.animate === "function"
        ) {
          const settle = content.animate(
            [
              { transform: `translate3d(-${Math.min(distance, 148)}px, 0, 0)` },
              { transform: "translate3d(0, 0, 0)" },
            ],
            { duration: 160, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
          );
          animation.current = settle;
          const releaseContentStyles = () => {
            if (animation.current !== settle) return;
            animation.current = null;
            clearContentStyles(content);
          };
          void settle.finished.then(releaseContentStyles, releaseContentStyles);
        } else {
          clearContentStyles(content);
        }
        // Keep composer focus within the release event, as with a tap on Reply.
        if (committed && canReply) onReply();
      },
    },
    scope
  );

  // The recognizer cancels its active drag first. That can begin a settle,
  // which this cleanup then cancels before the DOM is reused for another row.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    return () => {
      const previousAnimation = animation.current;
      animation.current = null;
      previousAnimation?.cancel();
      clearSwipeFeedback(root);
      clearContentStyles(content);
    };
  }, [rootRef, scope]);

  return { rootRef, contentRef, onTouchStart };
}
