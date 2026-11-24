"use client";

import {
  useState,
  useEffect,
  useContext,
  forwardRef,
  useImperativeHandle,
  useRef,
  useId,
} from "react";
import mojs from "@mojs/core";
import styles from "./VoteButton.module.css";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { commonApiPost } from "@/services/api/common-api";
import type { DropRateChangeRequest } from "@/entities/IDrop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  VoteActionButton,
  getVoteActionLabel,
} from "@/components/voting/VoteActionButton";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWavesPausedReason } from "@/hooks/useWavesMovePhase";
import { useChainWavesWriters } from "@/components/chain-waves/useChainWavesWriters";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import { withViewerVote } from "@/lib/chain-waves/optimistic";
import { AuthContext } from "@/components/auth/Auth";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  SingleWaveDropVoteSize,
  SingleWaveDropVoteSubmissionMode,
} from "./SingleWaveDropVote.types";
import { applyWaveDropVoteUpdate } from "@/hooks/waves/invalidateWaveApprovalStatusQueries";

type ThemeColors = {
  primary: string;
  secondary: string;
};

export interface SingleWaveDropVoteSubmitHandles {
  handleClick: () => Promise<void>;
}

type VoteAnimationTimeline = {
  replay: () => void;
};

const defaultTheme: ThemeColors = {
  primary: "rgba(255, 255, 255, 0.9)",
  secondary: "rgba(255, 255, 255, 0.3)",
};

const rankingThemes: { [key: number]: ThemeColors } = {
  1: { primary: "rgba(255, 215, 0, 0.9)", secondary: "rgba(255, 215, 0, 0.3)" },
  2: {
    primary: "rgba(192, 192, 192, 0.9)",
    secondary: "rgba(192, 192, 192, 0.3)",
  },
  3: {
    primary: "rgba(205, 127, 50, 0.9)",
    secondary: "rgba(205, 127, 50, 0.3)",
  },
};

const DEFAULT_DROP_RATE_CATEGORY = "Rep";
const VOTE_BUTTON_TRANSITION_MS = 300;
const BACKGROUND_MODAL_CLOSE_BUFFER_MS = 150;

interface Props {
  readonly drop: ApiDrop;
  readonly newRating: number;
  readonly voteLabel: string;
  readonly onVoteApplied?:
    | ((drop: ApiDrop) => void | Promise<void>)
    | undefined;
  readonly onVoteSuccess?: (() => void) | undefined;
  readonly onVoteRequestStarted?: (() => void) | undefined;
  readonly size?: SingleWaveDropVoteSize | undefined;
  readonly submissionMode?: SingleWaveDropVoteSubmissionMode | undefined;
  readonly submitBlockReason?: string | null | undefined;
  readonly submitLabelOverride?: string | undefined;
}

const SingleWaveDropVoteSubmit = forwardRef<
  SingleWaveDropVoteSubmitHandles,
  Props
>(
  (
    {
      drop,
      newRating,
      voteLabel,
      onVoteApplied,
      onVoteSuccess,
      onVoteRequestStarted,
      size = SingleWaveDropVoteSize.NORMAL,
      submissionMode = SingleWaveDropVoteSubmissionMode.WAIT_FOR_CONFIRMATION,
      submitBlockReason = null,
      submitLabelOverride,
    }: Props,
    ref
  ) => {
    const locale = useBrowserLocale();
    const pausedReason = useWavesPausedReason("votes");
    const chainWriters = useChainWavesWriters();
    const position = drop.rank;
    const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
      useContext(AuthContext);
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSpinnerExiting, setIsSpinnerExiting] = useState(false);
    const [isTextExiting, setIsTextExiting] = useState(false);
    const [processingVote, setProcessingVote] = useState<{
      amount: number;
      label: string;
    } | null>(null);
    const isProcessing = processingVote !== null;
    const animationTimelineRef = useRef<VoteAnimationTimeline | null>(null);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
    const delayCancelersRef = useRef<(() => void)[]>([]);
    const isMountedRef = useRef(true);
    const backgroundCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const backgroundSuccessTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const backgroundCloseFiredRef = useRef(false);
    const randomID = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const tlDuration = VOTE_BUTTON_TRANSITION_MS;
    const particlesDuration = 800;
    const particlesDelay = 50;
    const particleCount = 12;
    const backgroundModalCloseDelay =
      particlesDuration +
      particlesDelay * (particleCount - 1) +
      BACKGROUND_MODAL_CLOSE_BUFFER_MS;
    const totalParticlesTime =
      particlesDuration + particlesDelay * particleCount + 2500;

    const rateChangeMutation = useMutation({
      mutationFn: async (param: { rate: number }): Promise<ApiDrop> => {
        if (chainWriters) {
          // On the 6529 Network the vote carries its own signature; the
          // caches show it until 6529.io's index reads it from the chain.
          await chainWriters.vote({ dropId: drop.id, amount: param.rate });
          return withViewerVote(drop, param.rate);
        }
        return await commonApiPost<DropRateChangeRequest, ApiDrop>({
          endpoint: `drops/${drop.id}/ratings`,
          body: {
            rating: param.rate,
            category: DEFAULT_DROP_RATE_CATEGORY,
          },
        });
      },
      onSuccess: (updatedDrop) => {
        applyWaveDropVoteUpdate(queryClient, updatedDrop, drop.wave.id, {
          contextProfile: activeProfileProxy
            ? undefined
            : connectedProfile?.handle,
          fromChain: chainWriters !== null,
        });
      },
      onError: (error) => {
        // Cancelled at the wallet prompt: nothing was sent.
        if (isUserRejectedSigningError(error)) {
          return;
        }
        setToast({
          type: "error",
          title: "Couldn't submit your vote.",
          description: "Please try again.",
          details: getToastErrorDetails(error),
        });
      },
    });

    const theme =
      position !== null && position > 0 && position <= 3
        ? rankingThemes[position]
        : defaultTheme;

    const getVoteError = () => {
      if (submitBlockReason) {
        return submitBlockReason;
      }

      if (pausedReason) {
        return pausedReason;
      }

      if (!Number.isFinite(newRating)) {
        return "Enter a valid vote.";
      }

      if (drop.wave.forbid_negative_votes && newRating < 0) {
        return "Negative votes are not allowed in this wave.";
      }

      return null;
    };

    useEffect(() => {
      const triangleBurst = new mojs.Burst({
        parent: `.vote-button-container-${randomID}`,
        radius: { 50: 110 },
        count: 8,
        angle: 45,
        children: {
          shape: "polygon",
          radius: { 8: 0 },
          scale: 1,
          stroke: theme?.primary,
          strokeWidth: 2,
          angle: 210,
          delay: 30,
          speed: 0.2,
          easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
          duration: particlesDuration,
          isShowEnd: false,
        },
      });

      const circleBurst = new mojs.Burst({
        parent: `.vote-button-container-${randomID}`,
        radius: { 30: 90 },
        count: 10,
        angle: 0,
        children: {
          shape: "circle",
          fill: [theme?.primary, theme?.secondary],
          delay: "stagger(0, 50)",
          speed: 0.2,
          radius: { 4: 0 },
          easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
          duration: particlesDuration,
          isShowEnd: false,
        },
      });

      const smallBurst = new mojs.Burst({
        parent: `.vote-button-container-${randomID}`,
        radius: { 20: 70 },
        count: particleCount,
        angle: 90,
        children: {
          shape: "circle",
          fill: [theme?.secondary, theme?.primary],
          delay: `stagger(0, ${particlesDelay})`,
          speed: 0.3,
          radius: { 3: 0 },
          easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
          duration: particlesDuration,
          isShowEnd: false,
        },
      });

      const scaleButton = new mojs.Html({
        el: `#vote-button-${randomID}`,
        duration: tlDuration,
        scale: { 1.3: 1 },
        easing: mojs.easing.out,
      });

      const animationTimeline = new mojs.Timeline();
      animationTimeline.add([
        circleBurst,
        triangleBurst,
        smallBurst,
        scaleButton,
      ]);
      animationTimelineRef.current = animationTimeline;

      const button = document.getElementById(`vote-button-${randomID}`);
      if (button) {
        button.style.transform = "scale(1, 1)";
      }

      return () => {
        animationTimelineRef.current = null;
      };
    }, [
      particleCount,
      particlesDelay,
      particlesDuration,
      randomID,
      theme?.primary,
      theme?.secondary,
      tlDuration,
    ]);

    // Cleanup timeouts on unmount
    useEffect(() => {
      isMountedRef.current = true;

      return () => {
        isMountedRef.current = false;
        const delayCancelers = delayCancelersRef.current;
        delayCancelersRef.current = [];
        delayCancelers.forEach((cancelDelay) => cancelDelay());
        timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        timeoutsRef.current = [];
        backgroundCloseTimeoutRef.current = null;
        backgroundSuccessTimeoutRef.current = null;
      };
    }, []);

    const removeTrackedTimeout = (timeout: NodeJS.Timeout) => {
      timeoutsRef.current = timeoutsRef.current.filter(
        (trackedTimeout) => trackedTimeout !== timeout
      );
    };

    const removeDelayCanceler = (delayCanceler: () => void) => {
      delayCancelersRef.current = delayCancelersRef.current.filter(
        (trackedDelayCanceler) => trackedDelayCanceler !== delayCanceler
      );
    };

    const delayWhileMounted = (delayMs: number) =>
      new Promise<boolean>((resolve) => {
        let settled = false;
        const cancelDelay = () => {
          settle(false);
        };
        const settle = (mounted: boolean) => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timeout);
          removeTrackedTimeout(timeout);
          removeDelayCanceler(cancelDelay);
          resolve(mounted);
        };
        const timeout = setTimeout(() => {
          settle(isMountedRef.current);
        }, delayMs);
        timeoutsRef.current.push(timeout);
        delayCancelersRef.current.push(cancelDelay);
      });

    const resetLoadingState = () => {
      setLoading(false);
      setIsSpinnerExiting(false);
      setIsTextExiting(false);
      setProcessingVote(null);
    };

    const showSuccessfulVote = () => {
      setLoading(false);
      setIsSpinnerExiting(false);
      setIsTextExiting(false);
      setShowSuccess(true);
      animationTimelineRef.current?.replay();
    };

    const finishSuccessState = () => {
      const exitTimeout = setTimeout(() => {
        setIsTextExiting(true);

        const resetTimeout = setTimeout(() => {
          setShowSuccess(false);
          setIsTextExiting(false);
          setProcessingVote(null);
        }, VOTE_BUTTON_TRANSITION_MS);
        timeoutsRef.current.push(resetTimeout);
      }, totalParticlesTime);
      timeoutsRef.current.push(exitTimeout);
      return exitTimeout;
    };

    const resetFastFailedBackgroundVote = () => {
      if (!isMountedRef.current || backgroundCloseFiredRef.current) {
        return;
      }

      if (backgroundCloseTimeoutRef.current) {
        clearTimeout(backgroundCloseTimeoutRef.current);
        backgroundCloseTimeoutRef.current = null;
      }

      if (backgroundSuccessTimeoutRef.current) {
        clearTimeout(backgroundSuccessTimeoutRef.current);
        backgroundSuccessTimeoutRef.current = null;
      }

      setShowSuccess(false);
      resetLoadingState();
    };

    const scheduleBackgroundModalClose = () => {
      if (!isMountedRef.current) {
        return;
      }

      const closeTimeout = setTimeout(() => {
        backgroundCloseFiredRef.current = true;
        backgroundCloseTimeoutRef.current = null;
        onVoteRequestStarted?.();
      }, backgroundModalCloseDelay);
      backgroundCloseTimeoutRef.current = closeTimeout;
      timeoutsRef.current.push(closeTimeout);
    };

    const runOnVoteApplied = async (updatedDrop: ApiDrop) => {
      try {
        await onVoteApplied?.(updatedDrop);
      } catch {
        // Post-vote side effects must not turn a successful vote into a failed vote.
      }
    };

    const submitVoteInBackground = () => {
      backgroundCloseFiredRef.current = false;

      void rateChangeMutation
        .mutateAsync({
          rate: newRating,
        })
        .then(async (updatedDrop) => {
          await runOnVoteApplied(updatedDrop);
        })
        .catch(() => {
          resetFastFailedBackgroundVote();
        });

      showSuccessfulVote();
      scheduleBackgroundModalClose();

      backgroundSuccessTimeoutRef.current = finishSuccessState();
    };

    const submitVoteWithConfirmation = async () => {
      try {
        const updatedDrop = await rateChangeMutation.mutateAsync({
          rate: newRating,
        });
        await runOnVoteApplied(updatedDrop);
      } catch {
        resetLoadingState();
        return;
      }

      setIsSpinnerExiting(true);
      const spinnerExitFinished = await delayWhileMounted(
        VOTE_BUTTON_TRANSITION_MS
      );
      if (!spinnerExitFinished) {
        return;
      }

      showSuccessfulVote();

      const successTimeout = setTimeout(() => {
        onVoteSuccess?.();
      }, 1000);
      timeoutsRef.current.push(successTimeout);

      const successDisplayFinished =
        await delayWhileMounted(totalParticlesTime);
      if (!successDisplayFinished) {
        return;
      }

      setIsTextExiting(true);
      const textExitFinished = await delayWhileMounted(
        VOTE_BUTTON_TRANSITION_MS
      );
      if (!textExitFinished) {
        return;
      }

      setShowSuccess(false);
      setIsTextExiting(false);
      setProcessingVote(null);
    };

    const handleClick = async () => {
      if (isProcessing || loading || isSpinnerExiting || isTextExiting) {
        return;
      }

      const voteError = getVoteError();
      if (voteError) {
        setToast({
          message: voteError,
          type: "warning",
        });
        return;
      }

      setProcessingVote({ amount: newRating, label: idleButtonLabel });
      setIsTextExiting(true);
      setLoading(true);

      const textExitFinished = await delayWhileMounted(
        VOTE_BUTTON_TRANSITION_MS
      );
      if (!textExitFinished) {
        return;
      }
      setIsTextExiting(false);

      let success = false;
      try {
        // On the 6529 Network each vote carries its own signature.
        ({ success } = chainWriters ? { success: true } : await requestAuth());
      } catch {
        resetLoadingState();
        return;
      }

      if (!success) {
        resetLoadingState();
        return;
      }

      // On the 6529 Network the wallet or this browser's key signs after the
      // click, and the vote counts once a block holds it: the dialog waits
      // for that before it says the vote went in.
      if (
        submissionMode ===
          SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH &&
        chainWriters === null
      ) {
        submitVoteInBackground();
        return;
      }

      await submitVoteWithConfirmation();
    };

    useImperativeHandle(ref, () => ({
      handleClick,
    }));

    const idleButtonLabel =
      submitLabelOverride ?? getVoteActionLabel(locale, newRating, voteLabel);
    const displayedButtonLabel = processingVote?.label ?? idleButtonLabel;

    const getButtonContent = () => {
      return (
        <div className={`${styles["buttonContent"] ?? ""} tw-min-h-5`}>
          <span
            aria-hidden="true"
            className="tw-invisible tw-whitespace-nowrap"
          >
            {displayedButtonLabel}
          </span>
          {(!loading || isTextExiting) && (
            <span
              className={`${styles["buttonText"] ?? ""} ${
                isTextExiting ? (styles["exit"] ?? "") : (styles["enter"] ?? "")
              }`}
            >
              {showSuccess ? "Voted" : displayedButtonLabel}
            </span>
          )}
          {loading && (
            <div
              className={`${styles["spinner"] ?? ""} ${
                isSpinnerExiting
                  ? (styles["exit"] ?? "")
                  : (styles["enter"] ?? "")
              }`}
            >
              <div className={styles["bounce1"]}></div>
              <div className={styles["bounce2"]}></div>
              <div className={styles["bounce3"]}></div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div
        className={`vote-button-container-${randomID} ${size === SingleWaveDropVoteSize.MINI ? "tw-w-auto" : "tw-w-full"}`}
      >
        <VoteActionButton
          id={`vote-button-${randomID}`}
          amount={processingVote?.amount ?? newRating}
          unit={voteLabel}
          aria-label={loading ? displayedButtonLabel : undefined}
          variant={size === SingleWaveDropVoteSize.MINI ? "compact" : "default"}
          className={isProcessing ? (styles["processing"] ?? "") : undefined}
          onClick={(e) => {
            e.stopPropagation();
            void handleClick();
          }}
        >
          {getButtonContent()}
        </VoteActionButton>
      </div>
    );
  }
);

SingleWaveDropVoteSubmit.displayName = "SingleWaveDropVoteSubmit";

export default SingleWaveDropVoteSubmit;
