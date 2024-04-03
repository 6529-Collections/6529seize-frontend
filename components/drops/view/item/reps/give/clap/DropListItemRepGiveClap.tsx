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
  const [countTotalAnimation, setCountTotalAnimation] = useState<any>(null);
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

    setCountTotalAnimation(
      new mojs.Html({
        el: `#clap--count-total-${randomID}`,
        opacity: { 1: 0 },
        delay: (3 * tlDuration) / 2,
        duration: tlDuration,
        y: { 0: -3 },
      }).then({
        opacity: { 0: 1 },
        y: { "-3": 0 },
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
      countTotalAnimation,
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

  const getCount = () => `${rep > 0 ? "+" : ""}${formatNumberWithCommas(rep)}`;

  const [count, setCount] = useState(getCount());

  const getCountShort = () => `${rep > 0 ? "+" : ""}${formatLargeNumber(rep)}`;

  const [countShort, setCountShort] = useState(getCountShort());

  const countTotalRef = useRef<HTMLSpanElement | null>(null);

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
    setCount(getCount());
    setCountShort(getCountShort());
    setClapClasses(getClapClasses());
    setTextClasses(getTextClasses());
    setClapCountClasses(getClapCountClasses());
    if (!countTotalRef.current) return;
    const absRep = Math.abs(rep);
    if (absRep < 100) {
      countTotalRef.current.style.left = "-1px";
    } else if (absRep < 10000) {
      countTotalRef.current.style.left = "-3px";
    } else if (absRep < 1000000) {
      countTotalRef.current.style.left = "-5px";
    } else if (absRep < 100000000) {
      countTotalRef.current.style.left = "-9px";
    } else {
      countTotalRef.current.style.left = "-11px";
    }
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
        className={`${clapClasses} tw-relative tw-outline-1 tw-outline-transparent tw-border tw-border-solid tw-border-iron-700  tw-transition tw-duration-300 tw-ease-out ${styles.clap}`}
        onClick={handleClick}
      >
        <span>
          <svg
            id={`clap--icon-${randomID}`}
            className={`${textClasses} tw-w-8 tw-h-8 tw-transition tw-duration-300 tw-ease-out`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-549 338 100.1 125"
          >
            <path
              strokeWidth="2"
              stroke="currentColor"
              d="M-471.2 366.8c1.2 1.1 1.9 2.6 2.3 4.1.4-.3.8-.5 1.2-.7 1-1.9.7-4.3-1-5.9-2-1.9-5.2-1.9-7.2.1l-.2.2c1.8.1 3.6.9 4.9 2.2zm-28.8 14c.4.9.7 1.9.8 3.1l16.5-16.9c.6-.6 1.4-1.1 2.1-1.5 1-1.9.7-4.4-.9-6-2-1.9-5.2-1.9-7.2.1l-15.5 15.9c2.3 2.2 3.1 3 4.2 5.3zm-38.9 39.7c-.1-8.9 3.2-17.2 9.4-23.6l18.6-19c.7-2 .5-4.1-.1-5.3-.8-1.8-1.3-2.3-3.6-4.5l-20.9 21.4c-10.6 10.8-11.2 27.6-2.3 39.3-.6-2.6-1-5.4-1.1-8.3z"
            />
            <path
              strokeWidth="2"
              stroke="currentColor"
              d="M-527.2 399.1l20.9-21.4c2.2 2.2 2.7 2.6 3.5 4.5.8 1.8 1 5.4-1.6 8l-11.8 12.2c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l34-35c1.9-2 5.2-2.1 7.2-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l28.5-29.3c2-2 5.2-2 7.1-.1 2 1.9 2 5.1.1 7.1l-28.5 29.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.4 1.7 0l24.7-25.3c1.9-2 5.1-2.1 7.1-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l14.6-15c2-2 5.2-2 7.2-.1 2 2 2.1 5.2.1 7.2l-27.6 28.4c-11.6 11.9-30.6 12.2-42.5.6-12-11.7-12.2-30.8-.6-42.7m18.1-48.4l-.7 4.9-2.2-4.4m7.6.9l-3.7 3.4 1.2-4.8m5.5 4.7l-4.8 1.6 3.1-3.9"
            />
          </svg>
        </span>
        <span
          id={`clap--count-${randomID}`}
          className={`${clapCountClasses} tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-xs tw-absolute ${styles.clapCount}`}
        >
          {countShort}
        </span>
        <span
          ref={countTotalRef}
          id={`clap--count-total-${randomID}`}
          className={`${textClasses} tw-absolute -tw-top-5 tw-text-xs tw-text-center tw-w-full tw-transition tw-duration-300 tw-ease-out`}
        >
          {!!rep && count}
        </span>
      </button>
    </div>
  );
}
