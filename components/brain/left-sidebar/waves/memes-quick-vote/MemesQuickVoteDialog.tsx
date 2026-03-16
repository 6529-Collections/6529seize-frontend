"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  getDefaultQuickVoteAmount,
  normalizeQuickVoteAmount,
} from "@/hooks/memesQuickVote.helpers";
import { useMemesQuickVoteQueue } from "@/hooks/useMemesQuickVoteQueue";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { useEffect, useMemo, useRef, useState } from "react";
import MemesQuickVoteControls from "./MemesQuickVoteControls";
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
  readonly isVoting: boolean;
  readonly latestUsedAmount: number | null;
  readonly queueLength: number;
  readonly recentAmounts: number[];
  readonly submitVote: ReturnType<typeof useMemesQuickVoteQueue>["submitVote"];
  readonly skipDrop: ReturnType<typeof useMemesQuickVoteQueue>["skipDrop"];
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
}

function MemesQuickVoteDialogContent({
  activeDrop,
  isMobile,
  isVoting,
  latestUsedAmount,
  queueLength,
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
  const normalizedLatestUsedAmount =
    latestUsedAmount === null
      ? null
      : normalizeQuickVoteAmount(latestUsedAmount, maxRating);
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

  const swipeVoteAmount =
    normalizedLatestUsedAmount ??
    normalizeQuickVoteAmount(customValue, maxRating);

  const handleVoteAmount = async (amount: number | string) => {
    await submitVote(activeDrop, amount);
  };

  const handleSkip = () => {
    skipDrop(activeDrop);
  };

  return (
    <div className="tw-grid tw-gap-6 md:tw-grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.95fr)] md:tw-items-start">
      <MemesQuickVotePreview
        drop={activeDrop}
        isBusy={isVoting}
        isMobile={isMobile}
        remainingCount={queueLength}
        swipeVoteAmount={swipeVoteAmount}
        uncastPower={uncastPower}
        votingLabel={votingLabel}
        onSkip={handleSkip}
        onVoteWithSwipe={() => {
          if (swipeVoteAmount === null) {
            return;
          }

          void handleVoteAmount(swipeVoteAmount);
        }}
      />

      <div className="md:tw-sticky md:tw-top-0">
        <MemesQuickVoteControls
          customValue={customValue}
          isCustomOpen={isCustomOpen}
          isSubmitting={isVoting}
          latestUsedAmount={normalizedLatestUsedAmount}
          quickAmounts={visibleQuickAmounts}
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
    isLoading,
    isReady,
    isVoting,
    latestUsedAmount,
    queue,
    recentAmounts,
    submitVote,
    skipDrop,
    uncastPower,
    votingLabel,
  } = useMemesQuickVoteQueue();

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

      if (isVoting) {
        return;
      }

      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, [isVoting, onClose]);

  useEffect(() => {
    if (!isOpen || isLoading) {
      return;
    }

    if (!isReady || !activeDrop) {
      onClose();
    }
  }, [activeDrop, isLoading, isOpen, isReady, onClose]);

  return (
    <dialog
      ref={dialogRef}
      data-session-id={sessionId}
      className="tailwind-scope tw-m-0 tw-h-screen tw-w-screen tw-max-w-none tw-border-none tw-bg-transparent tw-p-0"
      aria-label="Memes quick vote"
    >
      <div
        className="tw-flex tw-h-full tw-w-full tw-items-stretch tw-justify-center tw-bg-iron-950/85 md:tw-items-center md:tw-p-6"
        onClick={(event) => {
          if (event.target !== event.currentTarget || isVoting) {
            return;
          }

          onClose();
        }}
      >
        <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-bg-iron-950 md:tw-h-auto md:tw-max-h-[min(92vh,56rem)] md:tw-max-w-5xl md:tw-overflow-hidden md:tw-rounded-[2rem] md:tw-border md:tw-border-solid md:tw-border-white/10 md:tw-shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <header className="tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-b tw-border-solid tw-border-white/5 tw-p-5 md:tw-p-6">
            <div>
              <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-primary-300">
                Memes Wave
              </p>
              <h2 className="tw-mb-1 tw-text-2xl tw-font-semibold tw-text-white">
                Quick vote
              </h2>
              <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                Newest first. Skip keeps a meme for later.
              </p>
            </div>

            <button
              type="button"
              data-autofocus="true"
              onClick={onClose}
              disabled={isVoting}
              className="tw-inline-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-text-iron-300 tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white"
              aria-label="Close quick vote"
            >
              <XMarkIcon className="tw-size-5" />
            </button>
          </header>

          <div className="tw-flex-1 tw-overflow-y-auto tw-p-4 md:tw-p-6">
            {isLoading || !activeDrop ? (
              <div className="tw-flex tw-h-full tw-min-h-80 tw-items-center tw-justify-center">
                <div className="tw-text-center">
                  <p className="tw-mb-2 tw-text-lg tw-font-semibold tw-text-white">
                    Loading your queue
                  </p>
                  <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
                    Pulling unrated memes and your recent quick-vote amounts.
                  </p>
                </div>
              </div>
            ) : (
              <MemesQuickVoteDialogContent
                key={activeDrop.serial_no}
                activeDrop={activeDrop}
                isMobile={isMobile}
                isVoting={isVoting}
                latestUsedAmount={latestUsedAmount}
                queueLength={queue.length}
                recentAmounts={recentAmounts}
                submitVote={submitVote}
                skipDrop={skipDrop}
                uncastPower={uncastPower}
                votingLabel={votingLabel}
              />
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
