import { useState, useEffect, useContext, forwardRef, useImperativeHandle } from "react";
import mojs from "@mojs/core";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";
import styles from "./VoteButton.module.scss";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../services/api/common-api";
import { DropRateChangeRequest } from "../../../entities/IDrop";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { AuthContext } from "../../auth/Auth";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";

type ThemeColors = {
  primary: string;
  secondary: string;
};

export interface SingleWaveDropVoteSubmitHandles {
  handleClick: () => Promise<void>;
}

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

interface Props {
  readonly drop: ApiDrop;
  readonly newRating: number;
}

const SingleWaveDropVoteSubmit = forwardRef<SingleWaveDropVoteSubmitHandles, Props>(
  ({ drop, newRating }: Props, ref) => {
    const position = drop.rank;
    const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
    const { onDropRateChange } = useContext(ReactQueryWrapperContext);
    const [animationTimeline, setAnimationTimeline] = useState<any>(null);
    const [triangleBurst, setTriangleBurst] = useState<any>(null);
    const [circleBurst, setCircleBurst] = useState<any>(null);
    const [smallBurst, setSmallBurst] = useState<any>(null);
    const [scaleButton, setScaleButton] = useState<any>(null);
    const [init, setInit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSpinnerExiting, setIsSpinnerExiting] = useState(false);
    const [isTextExiting, setIsTextExiting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const randomID = getRandomObjectId();
    const tlDuration = 300;
    const particlesDuration = 800;
    const particlesDelay = 50;
    const particleCount = 12;
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
      onSuccess: (response: ApiDrop) => {
        onDropRateChange({
          drop: response,
          giverHandle: connectedProfile?.profile?.handle ?? null,
        });
      },
      onError: (error) => {
        setToast({
          message: error as unknown as string,
          type: "error",
        });
        throw error;
      },
    });

    const theme =
      position && position <= 3 ? rankingThemes[position] : defaultTheme;

    useEffect(() => {
      setTriangleBurst(
        new mojs.Burst({
          parent: `.vote-button-container-${randomID}`,
          radius: { 50: 110 },
          count: 8,
          angle: 45,
          children: {
            shape: "polygon",
            radius: { 8: 0 },
            scale: 1,
            stroke: theme.primary,
            strokeWidth: 2,
            angle: 210,
            delay: 30,
            speed: 0.2,
            easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
            duration: particlesDuration,
            isShowEnd: false,
          },
        })
      );

      setCircleBurst(
        new mojs.Burst({
          parent: `.vote-button-container-${randomID}`,
          radius: { 30: 90 },
          count: 10,
          angle: 0,
          children: {
            shape: "circle",
            fill: [theme.primary, theme.secondary],
            delay: "stagger(0, 50)",
            speed: 0.2,
            radius: { 4: 0 },
            easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
            duration: particlesDuration,
            isShowEnd: false,
          },
        })
      );

      setSmallBurst(
        new mojs.Burst({
          parent: `.vote-button-container-${randomID}`,
          radius: { 20: 70 },
          count: particleCount,
          angle: 90,
          children: {
            shape: "circle",
            fill: [theme.secondary, theme.primary],
            delay: `stagger(0, ${particlesDelay})`,
            speed: 0.3,
            radius: { 3: 0 },
            easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
            duration: particlesDuration,
            isShowEnd: false,
          },
        })
      );

      setScaleButton(
        new mojs.Html({
          el: `#vote-button-${randomID}`,
          duration: tlDuration,
          scale: { 1.3: 1 },
          easing: mojs.easing.out,
        })
      );

      const button = document.getElementById(`vote-button-${randomID}`);
      if (button) {
        button.style.transform = "scale(1, 1)";
      }
      setInit(true);
    }, []);

    useEffect(() => {
      if (!init) return;
      const tempAnimationTimeline = new mojs.Timeline();
      tempAnimationTimeline.add([
        circleBurst,
        triangleBurst,
        smallBurst,
        scaleButton,
      ]);
      setAnimationTimeline(tempAnimationTimeline);
    }, [init]);

    const handleClick = async () => {
      if (isProcessing || loading || isSpinnerExiting || isTextExiting) return;

      setIsProcessing(true);
      setIsTextExiting(true);
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 300));
      setIsTextExiting(false);

      try {
        const { success } = await requestAuth();
        if (!success) {
          setLoading(false);
          setIsTextExiting(false);
          setIsProcessing(false);
          return;
        }
        await rateChangeMutation.mutateAsync({
          rate: newRating,
        });
      } catch (error) {
        setLoading(false);
        setIsTextExiting(false);
        setIsProcessing(false);
        return;
      }

      setIsSpinnerExiting(true);
      await new Promise((resolve) => setTimeout(resolve, 300));

      setLoading(false);
      setIsSpinnerExiting(false);
      setShowSuccess(true);

      if (animationTimeline) {
        animationTimeline.replay();
      }

      await new Promise((resolve) => setTimeout(resolve, totalParticlesTime));

      setIsTextExiting(true);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setShowSuccess(false);
      setIsTextExiting(false);
      setIsProcessing(false);
    };

    useImperativeHandle(ref, () => ({
      handleClick,
    }));

    const getButtonContent = () => {
      return (
        <div className={styles.buttonContent}>
          {(!loading || isTextExiting) && (
            <span
              className={`${styles.buttonText} ${
                isTextExiting ? styles.exit : styles.enter
              }`}
            >
              {showSuccess ? "Voted!" : "Vote!"}
            </span>
          )}
          {loading && (
            <div
              className={`${styles.spinner} ${
                isSpinnerExiting ? styles.exit : styles.enter
              }`}
            >
              <div className={styles.bounce1}></div>
              <div className={styles.bounce2}></div>
              <div className={styles.bounce3}></div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className={`vote-button-container-${randomID}`}>
        <button
          id={`vote-button-${randomID}`}
          className={`${styles.voteButton} ${
            isProcessing ? styles.processing : ""
          }`}
          onClick={handleClick}
        >
          {getButtonContent()}
        </button>
      </div>
    );
  }
);

SingleWaveDropVoteSubmit.displayName = "SingleWaveDropVoteSubmit";

export default SingleWaveDropVoteSubmit; 