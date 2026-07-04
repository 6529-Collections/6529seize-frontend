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
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  SingleWaveDropVoteSize,
  SingleWaveDropVoteSubmissionMode,
} from "./SingleWaveDropVote.types";
import { invalidateWaveApprovalStatusQueries } from "@/hooks/waves/invalidateWaveApprovalStatusQueries";

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
  readonly onVoteApplied?: ((drop: ApiDrop) => void) | undefined;
  readonly onVoteSuccess?: (() => void) | undefined;
  readonly onVoteRequestStarted?: (() => void) | undefined;
  readonly size?: SingleWaveDropVoteSize | undefined;
  readonly submissionMode?: SingleWaveDropVoteSubmissionMode | undefined;
  readonly submitBlockReason?: string | null | undefined;
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
    }: Props,
    ref
  ) => {
    const position = drop.rank;
    const { requestAuth, setToast } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSpinnerExiting, setIsSpinnerExiting] = useState(false);
    const [isTextExiting, setIsTextExiting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
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
      mutationFn: async (param: { rate: number }) =>
        await commonApiPost<DropRateChangeRequest, ApiDrop>({
          endpoint: `drops/${drop.id}/ratings`,
          body: {
            rating: param.rate,
            category: DEFAULT_DROP_RATE_CATEGORY,
          },
        }),
      onSuccess: () => {
        invalidateWaveApprovalStatusQueries(queryClient, drop.wave.id);
      },
      onError: (error) => {
        setToast({
          type: "error",
          title: "Couldn't submit your vote.",
          description: "Please try again.",
          details: getToastErrorDetails(error),
        });
      },
    });

    const theme =
      position && position <= 3 ? rankingThemes[position] : defaultTheme;

    const getVoteError = () => {
      if (submitBlockReason) {
        return submitBlockReason;
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
        let timeout: NodeJS.Timeout;
        let cancelDelay: () => void;

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

        cancelDelay = () => {
          settle(false);
        };

        timeout = setTimeout(() => {
          settle(isMountedRef.current);
        }, delayMs);
        timeoutsRef.current.push(timeout);
        delayCancelersRef.current.push(cancelDelay);
      });

    const resetLoadingState = () => {
      setLoading(false);
      setIsSpinnerExiting(false);
      setIsTextExiting(false);
      setIsProcessing(false);
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
          setIsProcessing(false);
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

    const submitVoteInBackground = () => {
      backgroundCloseFiredRef.current = false;

      void rateChangeMutation
        .mutateAsync({
          rate: newRating,
        })
        .then((updatedDrop) => {
          onVoteApplied?.(updatedDrop);
        })
        .catch(() => {
          resetFastFailedBackgroundVote();
        });

      showSuccessfulVote();

      const closeTimeout = setTimeout(() => {
        backgroundCloseFiredRef.current = true;
        backgroundCloseTimeoutRef.current = null;
        onVoteRequestStarted?.();
      }, backgroundModalCloseDelay);
      backgroundCloseTimeoutRef.current = closeTimeout;
      timeoutsRef.current.push(closeTimeout);

      backgroundSuccessTimeoutRef.current = finishSuccessState();
    };

    const submitVoteWithConfirmation = async () => {
      try {
        const updatedDrop = await rateChangeMutation.mutateAsync({
          rate: newRating,
        });
        onVoteApplied?.(updatedDrop);
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
      setIsProcessing(false);
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

      setIsProcessing(true);
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
        ({ success } = await requestAuth());
      } catch {
        resetLoadingState();
        return;
      }

      if (!success) {
        resetLoadingState();
        return;
      }

      if (
        submissionMode ===
        SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH
      ) {
        submitVoteInBackground();
        return;
      }

      await submitVoteWithConfirmation();
    };

    useImperativeHandle(ref, () => ({
      handleClick,
    }));

    let voteDirectionClass = "";
    if (size !== SingleWaveDropVoteSize.MINI) {
      if (newRating > 0) {
        voteDirectionClass = styles["voteButtonPositive"] ?? "";
      } else if (newRating < 0) {
        voteDirectionClass = styles["voteButtonNegative"] ?? "";
      } else {
        voteDirectionClass = styles["voteButtonNeutral"] ?? "";
      }
    }

    const showVoteAmount =
      size !== SingleWaveDropVoteSize.MINI &&
      Number.isFinite(newRating) &&
      newRating !== 0;
    let voteAmountLabel: string | null = null;
    if (showVoteAmount) {
      const voteSign = newRating > 0 ? "+" : "";
      voteAmountLabel = `${voteSign}${formatNumberWithCommas(
        newRating
      )} ${voteLabel}`;
    }

    const idleButtonLabel =
      voteAmountLabel === null ? "Vote" : `Vote ${voteAmountLabel}`;

    const getButtonContent = () => {
      return (
        <div className={styles["buttonContent"]}>
          {(!loading || isTextExiting) && (
            <span
              className={`${styles["buttonText"]} ${
                isTextExiting ? styles["exit"] : styles["enter"]
              }`}
            >
              {showSuccess ? "Voted" : idleButtonLabel}
            </span>
          )}
          {loading && (
            <div
              className={`${styles["spinner"]} ${
                isSpinnerExiting ? styles["exit"] : styles["enter"]
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
      <div className={`vote-button-container-${randomID}`}>
        <button
          id={`vote-button-${randomID}`}
          className={`${
            size === SingleWaveDropVoteSize.MINI
              ? styles["voteButtonMini"]
              : styles["voteButton"]
          } ${voteDirectionClass} ${isProcessing ? styles["processing"] : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            void handleClick();
          }}
        >
          {getButtonContent()}
        </button>
      </div>
    );
  }
);

SingleWaveDropVoteSubmit.displayName = "SingleWaveDropVoteSubmit";

export default SingleWaveDropVoteSubmit;
