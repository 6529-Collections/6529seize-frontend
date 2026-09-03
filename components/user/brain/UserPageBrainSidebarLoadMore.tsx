"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { ProfileWaveActivityQueryState } from "@/hooks/useProfileWaveActivityWaves";
import { keepFocusedSidebarControlVisible } from "./userPageBrainSidebar.helpers";
import { getUserPageBrainSidebarMessage } from "./userPageBrainSidebar.messages";

interface UserPageBrainSidebarLoadMoreProps {
  readonly state: ProfileWaveActivityQueryState;
  readonly buttonClassName: string;
  readonly completionClassName: string;
  readonly containerClassName?: string | undefined;
  readonly errorClassName?: string | undefined;
  readonly showErrorMessage?: boolean | undefined;
}

export default function UserPageBrainSidebarLoadMore({
  state,
  buttonClassName,
  completionClassName,
  containerClassName = "",
  errorClassName = "",
  showErrorMessage = false,
}: UserPageBrainSidebarLoadMoreProps) {
  const locale = useBrowserLocale();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fetchInFlightRef = useRef(false);
  const pendingCompletionFocusRef = useRef(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const shouldShowCompletion =
    showCompletion && !state.hasNextPage && !state.isFetchNextPageError;

  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (button && globalThis.document.activeElement === button) {
      keepFocusedSidebarControlVisible(button);
    }
  }, [state.waves.length]);

  const focusCompletion = useCallback((element: HTMLOutputElement | null) => {
    if (!element || !pendingCompletionFocusRef.current) {
      return;
    }
    pendingCompletionFocusRef.current = false;
    element.focus();
  }, []);

  let buttonMessageKey:
    | "user.brain.sidebar.loadMore"
    | "user.brain.sidebar.loadingMore"
    | "user.brain.sidebar.retryLoadMore" = "user.brain.sidebar.loadMore";
  if (state.isFetchingNextPage) {
    buttonMessageKey = "user.brain.sidebar.loadingMore";
  } else if (state.isFetchNextPageError) {
    buttonMessageKey = "user.brain.sidebar.retryLoadMore";
  }

  const showButton = state.hasNextPage || state.isFetchNextPageError;

  return (
    <div className={containerClassName}>
      {showErrorMessage && state.isFetchNextPageError && (
        <p className={errorClassName}>
          {getUserPageBrainSidebarMessage(
            locale,
            "user.brain.sidebar.loadMoreError"
          )}
        </p>
      )}

      {showButton && (
        <button
          ref={buttonRef}
          type="button"
          onBlur={() => {
            pendingCompletionFocusRef.current = false;
          }}
          onClick={() => {
            if (state.isFetchingNextPage || fetchInFlightRef.current) {
              return;
            }
            fetchInFlightRef.current = true;
            pendingCompletionFocusRef.current =
              globalThis.document.activeElement === buttonRef.current;
            setShowCompletion(false);
            state
              .fetchNextPage()
              .then(({ isComplete }) => {
                if (isComplete) {
                  setShowCompletion(true);
                } else {
                  pendingCompletionFocusRef.current = false;
                }
              })
              .catch(() => {
                pendingCompletionFocusRef.current = false;
              })
              .finally(() => {
                fetchInFlightRef.current = false;
              });
          }}
          aria-busy={state.isFetchingNextPage}
          aria-disabled={state.isFetchingNextPage}
          className={buttonClassName}
        >
          {getUserPageBrainSidebarMessage(locale, buttonMessageKey)}
        </button>
      )}

      {shouldShowCompletion && (
        <output
          ref={focusCompletion}
          tabIndex={-1}
          className={completionClassName}
        >
          {getUserPageBrainSidebarMessage(
            locale,
            "user.brain.sidebar.allWavesLoaded"
          )}
        </output>
      )}
    </div>
  );
}
