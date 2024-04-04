import { useEffect, useRef, useState } from "react";
import styles from "./Clap.module.scss";
import mojs from "@mojs/core";
import {
  formatLargeNumber,
  formatNumberWithCommas,
} from "../../../../../../../helpers/Helpers";
import { getRandomObjectId } from "../../../../../../../helpers/AllowlistToolHelpers";

enum RepStatus {
  POSITIVE = "POSITIVE",
  NEUTRAL = "NEUTRAL",
  NEGATIVE = "NEGATIVE",
}

export default function DropListItemRepGiveClap({
  rep,
  onSubmit,
}: {
  readonly rep: number;
  readonly onSubmit: () => void;
}) {
  const positiveRgba = "rgba(39, 174, 96, 1)";
  const negativeRgba = "rgba(192, 57, 43, 1)";

  const tlDuration = 300;
  const [animationTimeline, setAnimationTimeline] = useState<any>(null);
  const [triangleBurst, setTriangleBurst] = useState<any>(null);
  const [circleBurst, setCircleBurst] = useState<any>(null);
  const [countAnimation, setCountAnimation] = useState<any>(null);
  const [scaleButton, setScaleButton] = useState<any>(null);
  const [init, setInit] = useState(false);
  const randomID = getRandomObjectId();
  useEffect(() => {
    setTriangleBurst(
      new mojs.Burst({
        parent: `#clap-${randomID}`,
        radius: { 50: 95 },
        count: 5,
        angle: 30,
        children: {
          shape: "polygon",
          radius: { 6: 0 },
          scale: 1,
          stroke: positiveRgba,
          strokeWidth: 2,
          angle: 210,
          delay: 30,
          speed: 0.2,
          easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
          duration: tlDuration,
        },
      })
    );
    setCircleBurst(
      new mojs.Burst({
        parent: `#clap-${randomID}`,
        radius: { 50: 75 },
        angle: 25,
        duration: tlDuration,
        children: {
          shape: "circle",
          fill: positiveRgba,
          delay: 30,
          speed: 0.2,
          radius: { 3: 0 },
          easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
        },
      })
    );
    setCountAnimation(
      new mojs.Html({
        el: `#clap--count-${randomID}`,
        isShowStart: false,
        isShowEnd: true,
        y: { 0: -30 },
        opacity: { 0: 1 },
        duration: tlDuration,
      }).then({
        opacity: { 1: 0 },
        y: -80,
        delay: tlDuration / 2,
      })
    );

    setScaleButton(
      new mojs.Html({
        el: `#clap-${randomID}`,
        duration: tlDuration,
        scale: { 1.3: 1 },
        easing: mojs.easing.out,
      })
    );

    const clap = document.getElementById(`clap-${randomID}`);
    clap!.style.transform = "scale(1, 1)";
    setInit(true);
  }, []);

  useEffect(() => {
    if (!init) return;
    const tempAnimationTimeline = new mojs.Timeline();
    tempAnimationTimeline.add([
      countAnimation,
      scaleButton,
      circleBurst,
      triangleBurst,
    ]);
    setAnimationTimeline(tempAnimationTimeline);
  }, [init]);

  const getRepStatus = (): RepStatus => {
    if (rep > 0) return RepStatus.POSITIVE;
    if (rep < 0) return RepStatus.NEGATIVE;
    return RepStatus.NEUTRAL;
  };

  const handleClick = () => {
    const status = getRepStatus();
    if (status === RepStatus.NEUTRAL) return;
    animationTimeline.replay();
    onSubmit();
  };

  const getCountShort = () => `${rep > 0 ? "+" : ""}${formatLargeNumber(rep)}`;

  const [countShort, setCountShort] = useState(getCountShort());

  const getClapClasses = () => {
    const repStatus = getRepStatus();
    switch (repStatus) {
      case RepStatus.POSITIVE:
        return `hover:tw-border-green ${styles.clapPositive}`;
      case RepStatus.NEGATIVE:
        return `hover:tw-border-red ${styles.clapNegative}`;
      case RepStatus.NEUTRAL:
        return `hover:tw-border-iron-700`;
    }
  };

  const getTextClasses = () => {
    const repStatus = getRepStatus();
    switch (repStatus) {
      case RepStatus.POSITIVE:
        return "tw-text-green";
      case RepStatus.NEGATIVE:
        return "tw-text-red";
      case RepStatus.NEUTRAL:
        return "tw-text-iron-500";
    }
  };

  const getClapCountColorClasses = () => {
    const repStatus = getRepStatus();
    switch (repStatus) {
      case RepStatus.POSITIVE:
        return "tw-bg-green";
      case RepStatus.NEGATIVE:
        return "tw-bg-red";
      case RepStatus.NEUTRAL:
        return "tw-bg-iron-900";
    }
  };

  const getClapCountSizeAndPositionClasses = () => {
    const absRep = Math.abs(rep);
    if (absRep < 100) {
      return "tw-w-7 tw-h-7 tw-left-[12px]";
    } else if (absRep < 1000) {
      return "tw-w-8 tw-h-8 tw-left-[8px]";
    } else if (absRep < 100000) {
      return "tw-w-9 tw-h-9 tw-left-[6px]";
    } else if (absRep < 10000000) {
      return "tw-w-9 tw-h-9 tw-left-[6px]";
    } else {
      return "tw-w-11 tw-h-11 tw-left-[2px]";
    }
  };

  const getClapCountClasses = () => {
    return `${getClapCountColorClasses()} ${getClapCountSizeAndPositionClasses()}`;
  };

  const [clapClasses, setClapClasses] = useState(getClapClasses());
  const [textClasses, setTextClasses] = useState(getTextClasses());
  const [clapCountClasses, setClapCountClasses] = useState(
    getClapCountClasses()
  );

  useEffect(() => {
    setCountShort(getCountShort());
    setClapClasses(getClapClasses());
    setTextClasses(getTextClasses());
    setClapCountClasses(getClapCountClasses());
    const burstColor = rep > 0 ? positiveRgba : negativeRgba;
    triangleBurst?.tune({
      children: {
        stroke: burstColor,
      },
    });
    circleBurst?.tune({
      children: {
        fill: burstColor,
      },
    });
  }, [rep]);

  return (
    <div className="tailwind-scope">
      <button
        disabled={!rep}
        id={`clap-${randomID}`}
        className={`${clapClasses} tw-flex-shrink-0 tw-relative tw-outline-1 tw-outline-transparent tw-border tw-border-solid tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out ${styles.clap}`}
        onClick={handleClick}
      >
        <span>
          <svg
            id={`clap--icon-${randomID}`}
            className={`${textClasses} tw-w-7 tw-h-7 tw-transition tw-duration-300 tw-ease-out`}
            height="512"
            viewBox="0 0 51.2 51.2"
            width="512"
            xmlns="http://www.w3.org/2000/svg"
            data-name="Layer 1"
          >
            <path fill="currentColor"
              d="m40.76 19.86a3 3 0 0 0 -5.49-.14l-.27-1a3 3 0 0 0 -5-.84l-2.86-2.88a3.23 3.23 0 0 0 -4.44 0 1.25 1.25 0 0 1 -.09.12l-1.24-1.24a3.21 3.21 0 0 0 -4.44 0 3.3 3.3 0 0 0 -.79 1.38l-.1-.1a3.23 3.23 0 0 0 -4.44 0 3.16 3.16 0 0 0 0 4.44l.11.1a3.12 3.12 0 0 0 -1.37.79 3.11 3.11 0 0 0 0 4.43l.32.32a3.06 3.06 0 0 0 -1.42.76 3.15 3.15 0 0 0 0 4.44l9.21 9.21a9.34 9.34 0 0 0 6.62 2.73 9.67 9.67 0 0 0 1.2-.08 9.33 9.33 0 0 0 4.61 1.22 10.15 10.15 0 0 0 6.58-2.48l3.11-3.04a7.83 7.83 0 0 0 2.27-5.05c.26-4.39-.84-8.83-2.08-13.09zm-16.92-3.68a1.57 1.57 0 0 1 2.16 0l3.24 3.25a3.37 3.37 0 0 0 0 .44v1.9l-5.47-5.47a1 1 0 0 1 .07-.12zm-4.25 22.37-9.21-9.21a1.52 1.52 0 0 1 0-2.16 1.56 1.56 0 0 1 2.16 0s0 0 0 0l5 5a.82.82 0 0 0 1.14 0 .81.81 0 0 0 0-1.14l-7.19-7.19a1.51 1.51 0 0 1 -.49-1.11 1.48 1.48 0 0 1 .46-1.08 1.53 1.53 0 0 1 2.16 0l7.19 7.2a.82.82 0 0 0 1.14 0 .81.81 0 0 0 0-1.14l-9.22-9.22a1.5 1.5 0 0 1 -.45-1.08 1.54 1.54 0 0 1 .45-1.09 1.57 1.57 0 0 1 2.16 0l2 2 7.18 7.19a.81.81 0 0 0 1.14-1.14l-7.19-7.19a1.52 1.52 0 0 1 0-2.16 1.55 1.55 0 0 1 2.17 0l9.21 9.21a.82.82 0 0 0 .88.17.81.81 0 0 0 .49-.74v-3.81a1.35 1.35 0 0 1 .07-.44 1.4 1.4 0 0 1 1.32-1 1.43 1.43 0 0 1 1.29.8c.6 2.15 1.08 4 1.45 5.81a26.38 26.38 0 0 1 .53 6.62 6.12 6.12 0 0 1 -1.81 4l-3.02 3.12a8.33 8.33 0 0 1 -4.29 2 7.73 7.73 0 0 1 -6.72-2.22zm21.65-5.74a6.21 6.21 0 0 1 -1.81 4l-3.06 3.09a8.26 8.26 0 0 1 -7.53 1.77 10.47 10.47 0 0 0 2.85-1.67l3.1-3.11a7.73 7.73 0 0 0 2.28-5.06 27.39 27.39 0 0 0 -.55-6.93l.06-3.9a1.41 1.41 0 0 1 1.42-1.42 1.39 1.39 0 0 1 1.26.8c1.18 4.21 2.23 8.33 1.98 12.43zm-20.54-21.14a.8.8 0 1 0 1.15-1.12l-1.69-1.76a.81.81 0 0 0 -1.16 1.12zm4-.46a.8.8 0 0 0 .8-.8v-2a.8.8 0 1 0 -1.6 0v2a.8.8 0 0 0 .77.8zm3.38.7a.82.82 0 0 0 .56-.23l1.67-1.68a.8.8 0 0 0 -1.12-1.14l-1.7 1.66a.79.79 0 0 0 0 1.13.78.78 0 0 0 .56.26z"
            ></path>
          </svg>
        </span>
        <span
          id={`clap--count-${randomID}`}
          className={`${clapCountClasses} tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-xs tw-absolute ${styles.clapCount}`}
        >
          {countShort}
        </span>
      </button>
    </div>
  );
}
