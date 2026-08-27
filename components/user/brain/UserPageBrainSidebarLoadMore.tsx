"use client";

import { useCallback, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { ProfileWaveActivityQueryState } from "@/hooks/useProfileWaveActivityWaves";
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
  const [showCompletion, setShowCompletion] = useState(false);
  const shouldShowCompletion =
    showCompletion && !state.hasNextPage && !state.isFetchNextPageError;

  const focusCompletion = useCallback(
    (element: HTMLParagraphElement | null) => {
      element?.focus();
    },
    []
  );

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
          onClick={() => {
            const shouldFocusCompletion =
              globalThis.document.activeElement === buttonRef.current;
            setShowCompletion(false);
            state
              .fetchNextPage()
              .then(({ isComplete }) => {
                if (isComplete && shouldFocusCompletion) {
                  setShowCompletion(true);
                }
              })
              .catch(() => undefined);
          }}
          disabled={state.isFetchingNextPage}
          className={buttonClassName}
        >
          {getUserPageBrainSidebarMessage(locale, buttonMessageKey)}
        </button>
      )}

      {shouldShowCompletion && (
        <p ref={focusCompletion} tabIndex={-1} className={completionClassName}>
          {getUserPageBrainSidebarMessage(
            locale,
            "user.brain.sidebar.allWavesLoaded"
          )}
        </p>
      )}
    </div>
  );
}
