"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
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
    <div className="tw-grid tw-gap-6 md:tw-grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.95fr)] md:tw-items-stretch">
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

      <div className="md:tw-sticky md:tw-top-0 md:tw-self-stretch">
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
  );
}

function MemesQuickVoteDialogDoneState() {
  return (
    <div className="tw-flex tw-h-full tw-min-h-80 tw-items-center tw-justify-center">
      <div className="tw-max-w-md tw-text-center">
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
    <div className="tw-flex tw-h-full tw-min-h-80 tw-items-center tw-justify-center">
      <div className="tw-max-w-md tw-text-center">
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
      className="tailwind-scope tw-m-0 tw-h-screen tw-w-screen tw-max-w-none tw-border-none tw-bg-transparent tw-p-0"
      aria-label="Memes quick vote"
    >
      <div
        className="tw-flex tw-h-full tw-w-full tw-items-stretch tw-justify-center tw-bg-iron-950/85 md:tw-items-center md:tw-p-6"
        onClick={(event) => {
          if (event.target !== event.currentTarget) {
            return;
          }

          onClose();
        }}
      >
        <div className="tw-relative tw-flex tw-h-full tw-w-full tw-flex-col tw-bg-iron-950 md:tw-h-auto md:tw-max-h-[min(92vh,56rem)] md:tw-max-w-5xl md:tw-overflow-hidden md:tw-rounded-[2rem] md:tw-border md:tw-border-solid md:tw-border-white/10 md:tw-shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <button
            type="button"
            data-autofocus="true"
            onClick={onClose}
            className="tw-absolute tw-right-3 tw-top-[calc(env(safe-area-inset-top,0px)+0.75rem)] tw-z-10 tw-inline-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/90 tw-text-iron-300 tw-shadow-[0_18px_40px_rgba(0,0,0,0.35)] tw-backdrop-blur-sm tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-white md:tw-right-4 md:tw-top-4"
            aria-label="Close quick vote"
          >
            <XMarkIcon className="tw-size-5" />
          </button>

          <div className="tw-flex-1 tw-overflow-y-auto tw-p-4 tw-pt-16 md:tw-p-6">
            {dialogBody}
          </div>
        </div>
      </div>
    </dialog>
  );
}
