"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  getDefaultQuickVoteAmount,
  normalizeQuickVoteAmount,
} from "@/hooks/memesQuickVote.helpers";
import { useMemesQuickVoteQueue } from "@/hooks/useMemesQuickVoteQueue";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import MemesQuickVoteControls from "./MemesQuickVoteControls";
import MemesQuickVoteDialogSkeleton from "./MemesQuickVoteDialogSkeleton";
import MemesQuickVotePreview from "./MemesQuickVotePreview";

interface MemesQuickVoteDialogProps {
  readonly isOpen: boolean;
  readonly sessionId: number;
  readonly onClose: () => void;
}

interface MemesQuickVoteDialogContentProps {
  readonly activeDrop: NonNullable<
    ReturnType<typeof useMemesQuickVoteQueue>["activeDrop"]
  >;
  readonly isMobile: boolean;
  readonly latestUsedAmount: number | null;
  readonly onClose: () => void;
  readonly remainingCount: number;
  readonly recentAmounts: number[];
  readonly submitVote: ReturnType<typeof useMemesQuickVoteQueue>["submitVote"];
  readonly skipDrop: ReturnType<typeof useMemesQuickVoteQueue>["skipDrop"];
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
}

function MemesQuickVoteDialogContent({
  activeDrop,
  isMobile,
  latestUsedAmount,
  onClose,
  remainingCount,
  recentAmounts,
  submitVote,
  skipDrop,
  uncastPower,
  votingLabel,
}: MemesQuickVoteDialogContentProps) {
  const maxRating = activeDrop.context_profile_context?.max_rating ?? 0;
  const defaultAmount = useMemo(
    () => (maxRating > 0 ? getDefaultQuickVoteAmount(maxRating) : 1),
    [maxRating]
  );
  const [customValue, setCustomValue] = useState(() => `${defaultAmount}`);
  const [isCustomOpen, setIsCustomOpen] = useState(
    () => recentAmounts.length === 0
  );
  const [isAdvancing, setIsAdvancing] = useState(false);
  const normalizedLatestUsedAmount =
    latestUsedAmount === null
      ? null
      : normalizeQuickVoteAmount(latestUsedAmount, maxRating);
  const normalizedCustomAmount = normalizeQuickVoteAmount(
    customValue,
    maxRating
  );
  const visibleQuickAmounts = useMemo(() => {
    if (maxRating <= 0) {
      return [];
    }

    return Array.from(
      new Set(
        recentAmounts
          .map((amount) => normalizeQuickVoteAmount(amount, maxRating))
          .filter((amount): amount is number => amount !== null)
      )
    ).sort((left, right) => left - right);
  }, [maxRating, recentAmounts]);

  const swipeVoteAmount = isCustomOpen
    ? normalizedCustomAmount
    : (normalizedLatestUsedAmount ?? normalizedCustomAmount);

  const queueVoteAmount = async (amount: number | string) => {
    const wasQueued = await submitVote(activeDrop, amount);

    if (!wasQueued) {
      setIsAdvancing(false);
    }
  };

  const handleVoteAmount = async (amount: number | string) => {
    if (isAdvancing) {
      return;
    }

    setIsAdvancing(true);
    await queueVoteAmount(amount);
  };

  const queueSkip = () => {
    skipDrop(activeDrop);
  };

  const handleSkip = () => {
    if (isAdvancing) {
      return;
    }

    setIsAdvancing(true);
    queueSkip();
  };

  return (
    <div className="tw-flex tw-h-full tw-flex-col sm:tw-grid sm:tw-min-h-0 sm:tw-grid-cols-[minmax(0,1.22fr)_minmax(25rem,1fr)] sm:tw-items-stretch">
      {isMobile && (
        <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-solid tw-border-white/5 tw-bg-black/40 tw-px-4 tw-pb-3 tw-pt-3 tw-backdrop-blur-xl sm:tw-hidden">
          <button
            type="button"
            onClick={onClose}
            data-autofocus="true"
            className="tw-inline-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.05] tw-text-zinc-400 tw-shadow-inner tw-transition-colors active:tw-bg-white/10"
            aria-label="Close quick vote"
          >
            <XMarkIcon className="tw-size-5 tw-shrink-0" />
          </button>

          <div className="tw-flex tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-px-3">
            <span className="tw-truncate tw-text-[13px] tw-font-bold tw-leading-tight tw-text-zinc-300">
              {formatNumberWithCommas(remainingCount)} unexplored
            </span>
          </div>

          <div className="tw-size-10 tw-shrink-0" aria-hidden="true" />
        </div>
      )}

      {isMobile ? (
        <div className="tw-relative tw-z-10 tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-flex-col tw-overflow-hidden">
          <div className="tw-h-full">
            <MemesQuickVotePreview
              drop={activeDrop}
              isBusy={isAdvancing}
              isMobile={isMobile}
              remainingCount={remainingCount}
              swipeVoteAmount={swipeVoteAmount}
              uncastPower={uncastPower}
              votingLabel={votingLabel}
              onAdvanceStart={() => {
                setIsAdvancing(true);
              }}
              onSkip={queueSkip}
              onVoteWithSwipe={() => {
                if (swipeVoteAmount === null) {
                  setIsAdvancing(false);
                  return;
                }

                void queueVoteAmount(swipeVoteAmount);
              }}
            />
          </div>

          <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-z-20 sm:tw-hidden">
            <MemesQuickVoteControls
              customValue={customValue}
              drop={activeDrop}
              isCustomOpen={isCustomOpen}
              isSubmitting={isAdvancing}
              latestUsedAmount={normalizedLatestUsedAmount}
              remainingCount={remainingCount}
              quickAmounts={visibleQuickAmounts}
              uncastPower={uncastPower}
              votingLabel={votingLabel}
              onCustomChange={(value) => {
                if (value === "") {
                  setCustomValue("");
                  return;
                }

                setCustomValue(value.replace(/[^\d]/g, ""));
              }}
              onCustomSubmit={async () => {
                await handleVoteAmount(customValue);
              }}
              onOpenCustom={() => {
                setIsCustomOpen((current) => !current);
              }}
              onSkip={handleSkip}
              onVoteAmount={handleVoteAmount}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="tw-min-h-0 tw-flex-1 sm:tw-min-h-0 sm:tw-border-y-0 sm:tw-border-b-0 sm:tw-border-l-0 sm:tw-border-r sm:tw-border-solid sm:tw-border-white/10">
            <MemesQuickVotePreview
              drop={activeDrop}
              isBusy={isAdvancing}
              isMobile={isMobile}
              remainingCount={remainingCount}
              swipeVoteAmount={swipeVoteAmount}
              uncastPower={uncastPower}
              votingLabel={votingLabel}
              onAdvanceStart={() => {
                setIsAdvancing(true);
              }}
              onSkip={queueSkip}
              onVoteWithSwipe={() => {
                if (swipeVoteAmount === null) {
                  setIsAdvancing(false);
                  return;
                }

                void queueVoteAmount(swipeVoteAmount);
              }}
            />
          </div>

          <div className="tw-shrink-0 sm:tw-min-h-0 sm:tw-self-stretch">
            <MemesQuickVoteControls
              customValue={customValue}
              drop={activeDrop}
              isCustomOpen={isCustomOpen}
              isSubmitting={isAdvancing}
              latestUsedAmount={normalizedLatestUsedAmount}
              remainingCount={remainingCount}
              quickAmounts={visibleQuickAmounts}
              uncastPower={uncastPower}
              votingLabel={votingLabel}
              onCustomChange={(value) => {
                if (value === "") {
                  setCustomValue("");
                  return;
                }

                setCustomValue(value.replace(/[^\d]/g, ""));
              }}
              onCustomSubmit={async () => {
                await handleVoteAmount(customValue);
              }}
              onOpenCustom={() => {
                setIsCustomOpen((current) => !current);
              }}
              onSkip={handleSkip}
              onVoteAmount={handleVoteAmount}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MemesQuickVoteDialogDoneState() {
  return (
    <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center tw-py-8">
      <div className="tw-w-full tw-max-w-xl tw-rounded-[1.75rem] tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-6 tw-py-10 tw-text-center tw-shadow-[0_24px_60px_rgba(0,0,0,0.35)] tw-backdrop-blur-sm">
        <p className="tw-mb-2 tw-text-lg tw-font-semibold tw-text-white">
          You are done
        </p>
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
          No unrated memes are left in quick vote right now.
        </p>
      </div>
    </div>
  );
}

function MemesQuickVoteDialogErrorState({
  onRetry,
}: {
  readonly onRetry: () => void;
}) {
  return (
    <div className="tw-flex tw-min-h-full tw-items-center tw-justify-center tw-py-8">
      <div className="tw-w-full tw-max-w-xl tw-rounded-[1.75rem] tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-px-6 tw-py-10 tw-text-center tw-shadow-[0_24px_60px_rgba(0,0,0,0.35)] tw-backdrop-blur-sm">
        <p className="tw-mb-2 tw-text-lg tw-font-semibold tw-text-white">
          Couldn&apos;t load your queue
        </p>
        <p className="tw-mb-4 tw-text-sm tw-text-iron-400">
          Quick vote couldn&apos;t reach the leaderboard. Try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-white tw-transition-colors desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-white/10"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function MemesQuickVoteDialog({
  isOpen,
  sessionId,
  onClose,
}: MemesQuickVoteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const previousBodyOverflowRef = useRef("");
  const isMobile = useIsMobileScreen();
  const {
    activeDrop,
    hasDiscoveryError,
    isExhausted,
    isLoading,
    latestUsedAmount,
    recentAmounts,
    remainingCount,
    retryDiscovery,
    submitVote,
    skipDrop,
    uncastPower,
    votingLabel,
  } = useMemesQuickVoteQueue({ enabled: isOpen, sessionId });

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (!isOpen) {
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = previousBodyOverflowRef.current;
      previouslyFocusedElementRef.current?.focus();
      return;
    }

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
    previousBodyOverflowRef.current = document.body.style.overflow;

    if (!dialog.open) {
      dialog.showModal();
    }

    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const autofocusTarget = dialog.querySelector<HTMLElement>(
        "[data-autofocus='true']"
      );
      autofocusTarget?.focus();
    });

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current;
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleCancel = (event: Event) => {
      event.preventDefault();

      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [onClose]);

  let dialogBody: ReactNode;

  if (isExhausted) {
    dialogBody = <MemesQuickVoteDialogDoneState />;
  } else if (!activeDrop && hasDiscoveryError) {
    dialogBody = <MemesQuickVoteDialogErrorState onRetry={retryDiscovery} />;
  } else if (!activeDrop && isLoading) {
    dialogBody = <MemesQuickVoteDialogSkeleton />;
  } else if (!activeDrop) {
    dialogBody = <MemesQuickVoteDialogSkeleton />;
  } else {
    dialogBody = (
      <MemesQuickVoteDialogContent
        key={`${sessionId}:${activeDrop.serial_no}`}
        activeDrop={activeDrop}
        isMobile={isMobile}
        latestUsedAmount={latestUsedAmount}
        onClose={onClose}
        remainingCount={remainingCount}
        recentAmounts={recentAmounts}
        submitVote={submitVote}
        skipDrop={skipDrop}
        uncastPower={uncastPower}
        votingLabel={votingLabel}
      />
    );
  }

  return (
    <dialog
      ref={dialogRef}
      data-session-id={sessionId}
      className="tailwind-scope tw-fixed tw-inset-0 tw-m-0 tw-h-screen tw-max-h-none tw-w-screen tw-max-w-none tw-border-none tw-bg-transparent tw-p-0"
      aria-label="Memes quick vote"
    >
      <div
        className="tw-flex tw-h-full tw-w-full tw-items-end tw-justify-center tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px] sm:tw-items-center sm:tw-p-6"
        onClick={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }

          onClose();
        }}
      >
        <div className="tw-relative tw-flex tw-h-[100svh] tw-max-h-[100svh] tw-w-full tw-flex-col tw-overflow-hidden tw-bg-[#0a0a0a] tw-shadow-[0_0_80px_rgba(0,0,0,0.8)] sm:tw-h-[38rem] sm:tw-max-h-[min(calc(100vh-3rem),38rem)] sm:tw-max-w-[68rem] sm:tw-rounded-2xl sm:tw-border sm:tw-border-solid sm:tw-border-white/10">
          <button
            type="button"
            data-autofocus={isMobile ? undefined : "true"}
            onClick={onClose}
            className="tw-absolute tw-right-4 tw-top-[calc(env(safe-area-inset-top,0px)+0.75rem)] tw-z-20 tw-hidden tw-size-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.05] tw-text-zinc-400 tw-shadow-inner tw-backdrop-blur-md tw-transition-colors active:tw-bg-white/10 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-text-white sm:tw-right-6 sm:tw-top-6 sm:tw-inline-flex"
            aria-label="Close quick vote"
          >
            <XMarkIcon className="tw-size-5 tw-shrink-0" />
          </button>

          <div className="tw-relative tw-z-10 tw-min-h-0 tw-flex-1 tw-overflow-y-auto [scrollbar-width:none] sm:tw-p-0 [&::-webkit-scrollbar]:tw-hidden">
            {dialogBody}
          </div>
        </div>
      </div>
    </dialog>
  );
}
