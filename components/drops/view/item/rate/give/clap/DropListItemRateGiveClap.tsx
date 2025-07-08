"use client";

import { useEffect, useState } from "react";
import styles from "./Clap.module.scss";
import mojs from "@mojs/core";
import { formatLargeNumber } from "../../../../../../../helpers/Helpers";
import { getRandomObjectId } from "../../../../../../../helpers/AllowlistToolHelpers";
import LazyTippy from "../../../../../../utils/tooltip/LazyTippy";
import { DropVoteState } from "../../../../../../../hooks/drops/types";
import { VOTE_STATE_ERRORS } from "../DropListItemRateGiveSubmit";

enum RateStatus {
  POSITIVE = "POSITIVE",
  NEUTRAL = "NEUTRAL",
  NEGATIVE = "NEGATIVE",
}

export default function DropListItemRateGiveClap({
  rate,
  voteState,
  canVote,
  onSubmit,
  isMobile = false,
}: {
  readonly rate: number;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly onSubmit: () => void;
  readonly isMobile?: boolean;
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

  const getRateStatus = (): RateStatus => {
    if (rate > 0) return RateStatus.POSITIVE;
    if (rate < 0) return RateStatus.NEGATIVE;
    return RateStatus.NEUTRAL;
  };

  const handleClick = () => {
    if (!canVote) return;
    const status = getRateStatus();
    if (status === RateStatus.NEUTRAL) return;
    animationTimeline.replay();
    onSubmit();
  };

  const getCountShort = () =>
    `${rate > 0 ? "+" : ""}${formatLargeNumber(rate)}`;

  const [countShort, setCountShort] = useState(getCountShort());

  const CLAP_CLASSES: Record<RateStatus, string> = {
    [RateStatus.POSITIVE]: `${styles.clapPositive}`,
    [RateStatus.NEGATIVE]: `${styles.clapNegative}`,
    [RateStatus.NEUTRAL]: ``,
  };

  const getClapClasses = () => {
    if (!canVote) {
      return CLAP_CLASSES[RateStatus.NEUTRAL];
    }
    const rateStatus = getRateStatus();
    return CLAP_CLASSES[rateStatus];
  };

  const TEXT_CLASSES: Record<RateStatus, string> = {
    [RateStatus.POSITIVE]: "tw-text-green",
    [RateStatus.NEGATIVE]: "tw-text-red",
    [RateStatus.NEUTRAL]: "tw-text-iron-500",
  };

  const getTextClasses = () => {
    if (!canVote) {
      return TEXT_CLASSES[RateStatus.NEUTRAL];
    }
    const rateStatus = getRateStatus();
    return TEXT_CLASSES[rateStatus];
  };

  const CLAP_COUNT_COLOR_CLASSES: Record<RateStatus, string> = {
    [RateStatus.POSITIVE]: "tw-bg-green",
    [RateStatus.NEGATIVE]: "tw-bg-red",
    [RateStatus.NEUTRAL]: "tw-bg-iron-900",
  };

  const getClapCountColorClasses = () => {
    if (!canVote) {
      return CLAP_COUNT_COLOR_CLASSES[RateStatus.NEUTRAL];
    }
    const rateStatus = getRateStatus();
    return CLAP_COUNT_COLOR_CLASSES[rateStatus];
  };

  const getClapCountSizeAndPositionClasses = () => {
    const absRate = Math.abs(rate);
    if (absRate < 100) {
      return "tw-w-7 tw-h-7 tw-left-[12px]";
    } else if (absRate < 1000) {
      return "tw-w-8 tw-h-8 tw-left-[8px]";
    } else if (absRate < 100000) {
      return "tw-w-9 tw-h-9 tw-left-[6px]";
    } else if (absRate < 10000000) {
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
    const burstColor = rate > 0 ? positiveRgba : negativeRgba;
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
  }, [rate]);

  const svgSize = isMobile ? "tw-size-7" : "tw-h-[18px] tw-w-[18px]";
  return (
    <LazyTippy
      placement="top"
      interactive={false}
      disabled={canVote}
      content={<div>{VOTE_STATE_ERRORS[voteState]}</div>}>
      <div className="tailwind-scope">
        <button
          disabled={!rate || !canVote}
          id={`clap-${randomID}`}
          aria-label="Clap for drop"
          className={`${clapClasses} tw-border-none tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-relative tw-z-10 tw-outline-1 tw-outline-transparent tw-bg-current tw-transition tw-duration-300 tw-ease-out ${styles.clap}`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}>
          <span>
            <svg
              id={`clap--icon-${randomID}`}
              className={`${textClasses} ${svgSize} -tw-mt-1 tw-transition tw-duration-300 tw-ease-out`}
              viewBox="0 0 346 360"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M324.352 122.5C322.144 117.113 318.416 112.485 313.623 109.181C308.83 105.876 303.179 104.038 297.359 103.889C291.539 103.741 285.802 105.289 280.847 108.345C275.891 111.401 271.933 115.833 269.453 121.1L266.753 111.1C264.793 106.435 261.685 102.342 257.718 99.2012C253.751 96.0603 249.055 93.9736 244.065 93.1353C239.075 92.2971 233.955 92.7344 229.179 94.4067C224.404 96.079 220.129 98.9319 216.753 102.7L188.153 73.9C182.154 68.2244 174.21 65.0617 165.953 65.0617C157.695 65.0617 149.751 68.2244 143.753 73.9C143.477 74.3177 143.176 74.7184 142.853 75.1L130.453 62.7C124.478 56.979 116.525 53.7856 108.253 53.7856C99.9803 53.7856 92.0275 56.979 86.0525 62.7C82.3337 66.5873 79.6216 71.3248 78.1525 76.5L77.1525 75.5C71.1544 69.8244 63.2102 66.6617 54.9525 66.6617C46.6948 66.6617 38.7507 69.8244 32.7525 75.5C26.9143 81.414 23.6407 89.3897 23.6407 97.7C23.6407 106.01 26.9143 113.986 32.7525 119.9L33.8525 120.9C28.6832 122.313 23.9649 125.034 20.1525 128.8C17.2167 131.694 14.8854 135.142 13.2941 138.944C11.7029 142.747 10.8834 146.828 10.8834 150.95C10.8834 155.072 11.7029 159.153 13.2941 162.956C14.8854 166.758 17.2167 170.206 20.1525 173.1L23.3525 176.3C18.0255 177.52 13.1223 180.144 9.15252 183.9C3.29018 189.801 0 197.782 0 206.1C0 214.418 3.29018 222.399 9.15252 228.3L101.253 320.4C109.949 329.081 120.272 335.962 131.632 340.646C142.992 345.331 155.165 347.728 167.453 347.7C171.465 347.683 175.473 347.415 179.453 346.9C193.503 354.891 209.388 359.095 225.553 359.1C249.74 358.938 273.075 350.143 291.353 334.3L322.453 303.9C335.917 290.393 343.989 272.436 345.153 253.4C347.753 209.5 336.752 165.1 324.352 122.5ZM155.153 85.7C158.069 82.9359 161.934 81.3952 165.953 81.3952C169.971 81.3952 173.836 82.9359 176.753 85.7L209.153 118.2C209.057 119.665 209.057 121.135 209.153 122.6V141.6L154.453 86.9C154.658 86.4842 154.892 86.0833 155.153 85.7ZM112.653 309.4L20.5525 217.3C19.1254 215.887 17.9926 214.205 17.2195 212.351C16.4464 210.497 16.0483 208.508 16.0483 206.5C16.0483 204.492 16.4464 202.503 17.2195 200.649C17.9926 198.795 19.1254 197.113 20.5525 195.7C23.4573 192.913 27.327 191.357 31.3525 191.357C35.378 191.357 39.2477 192.913 42.1525 195.7L92.1525 245.7C93.6817 247.179 95.7255 248.005 97.8525 248.005C99.9796 248.005 102.023 247.179 103.553 245.7C105.055 244.183 105.898 242.135 105.898 240C105.898 237.865 105.055 235.817 103.553 234.3L31.6525 162.4C30.1126 160.989 28.882 159.274 28.0386 157.364C27.1952 155.453 26.7573 153.388 26.7525 151.3C26.7422 149.281 27.1449 147.282 27.936 145.424C28.727 143.567 29.8897 141.891 31.3525 140.5C34.2203 137.642 38.1039 136.037 42.1525 136.037C46.2012 136.037 50.0847 137.642 52.9525 140.5L124.853 212.5C126.382 213.979 128.425 214.805 130.553 214.805C132.68 214.805 134.723 213.979 136.253 212.5C137.755 210.983 138.598 208.935 138.598 206.8C138.598 204.665 137.755 202.617 136.253 201.1L44.0525 108.9C42.6171 107.493 41.4791 105.812 40.7061 103.957C39.9331 102.102 39.5408 100.11 39.5525 98.1C39.5497 96.0766 39.9457 94.0725 40.7179 92.2022C41.49 90.3319 42.6231 88.6321 44.0525 87.2C46.969 84.4359 50.8343 82.8952 54.8525 82.8952C58.8708 82.8952 62.7361 84.4359 65.6525 87.2L85.6525 107.2L157.453 179.1C159.007 180.376 160.98 181.028 162.989 180.929C164.997 180.83 166.897 179.988 168.319 178.566C169.741 177.144 170.583 175.245 170.682 173.236C170.78 171.228 170.128 169.254 168.853 167.7L96.9525 95.8C95.5254 94.3867 94.3926 92.7045 93.6195 90.8508C92.8464 88.9971 92.4483 87.0085 92.4483 85C92.4483 82.9915 92.8464 81.0029 93.6195 79.1492C94.3926 77.2955 95.5254 75.6133 96.9525 74.2C99.8499 71.36 103.745 69.7692 107.803 69.7692C111.86 69.7692 115.755 71.36 118.653 74.2L210.753 166.3C211.896 167.407 213.337 168.157 214.9 168.459C216.462 168.761 218.079 168.601 219.553 168C221.001 167.377 222.236 166.345 223.106 165.031C223.977 163.716 224.445 162.176 224.453 160.6V122.5C224.441 121.005 224.677 119.518 225.153 118.1C226.003 115.246 227.742 112.737 230.115 110.939C232.489 109.141 235.375 108.146 238.353 108.1C241.037 108.088 243.67 108.832 245.952 110.247C248.233 111.662 250.07 113.69 251.253 116.1C257.253 137.6 262.053 156.1 265.753 174.2C270.301 195.955 272.082 218.198 271.053 240.4C270.174 255.513 263.725 269.764 252.952 280.4L222.753 311.6C210.687 322.275 195.786 329.222 179.853 331.6C167.693 333.518 155.251 332.504 143.563 328.642C131.874 324.781 121.277 318.184 112.653 309.4ZM329.153 252C328.191 267.092 321.755 281.315 311.053 292L280.452 322.9C270.299 331.772 258.128 338.024 245.002 341.109C231.877 344.195 218.195 344.02 205.153 340.6C215.476 336.576 225.096 330.94 233.653 323.9L264.653 292.8C278.254 279.337 286.378 261.308 287.453 242.2C288.57 218.96 286.722 195.673 281.953 172.9L282.553 133.9C282.539 132.032 282.897 130.179 283.606 128.45C284.315 126.721 285.361 125.151 286.682 123.829C288.003 122.508 289.574 121.463 291.303 120.754C293.032 120.045 294.884 119.687 296.753 119.7C299.396 119.697 301.986 120.448 304.217 121.865C306.449 123.282 308.23 125.306 309.352 127.7C321.152 169.8 331.653 211 329.153 252ZM123.753 40.6C124.488 41.3551 125.365 41.958 126.333 42.3742C127.302 42.7904 128.343 43.0117 129.396 43.0257C130.45 43.0396 131.497 42.8458 132.476 42.4553C133.455 42.0649 134.347 41.4854 135.103 40.75C135.858 40.0146 136.46 39.1377 136.877 38.1693C137.293 37.2009 137.514 36.16 137.528 35.1061C137.542 34.0521 137.348 33.0058 136.958 32.0267C136.567 31.0477 135.988 30.1551 135.253 29.4L118.353 11.8C116.821 10.4934 114.858 9.80382 112.846 9.8657C110.834 9.92758 108.917 10.7365 107.469 12.1347C106.021 13.533 105.145 15.4204 105.013 17.429C104.88 19.4377 105.5 21.4237 106.753 23L123.753 40.6ZM163.753 36C165.874 36 167.909 35.1571 169.409 33.6568C170.91 32.1566 171.753 30.1217 171.753 28V8C171.753 5.87827 170.91 3.84344 169.409 2.34314C167.909 0.842853 165.874 0 163.753 0C161.631 0 159.596 0.842853 158.096 2.34314C156.595 3.84344 155.753 5.87827 155.753 8V28C155.751 30.0708 156.553 32.0614 157.989 33.5534C159.425 35.0453 161.383 35.9223 163.453 36H163.753ZM197.553 43C199.644 42.9757 201.648 42.1529 203.153 40.7L219.853 23.9C221.247 22.3908 222.007 20.4029 221.975 18.3485C221.944 16.2941 221.123 14.3305 219.683 12.8649C218.243 11.3992 216.294 10.5437 214.241 10.4758C212.187 10.4079 210.186 11.1327 208.653 12.5L191.653 29.1C190.9 29.8358 190.301 30.7146 189.893 31.6849C189.484 32.6552 189.274 33.6973 189.274 34.75C189.274 35.8027 189.484 36.8448 189.893 37.8151C190.301 38.7854 190.9 39.6642 191.653 40.4C192.36 41.1917 193.221 41.8306 194.184 42.2777C195.147 42.7247 196.191 42.9705 197.253 43H197.553Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span
            id={`clap--count-${randomID}`}
            className={`${clapCountClasses} tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-xs tw-absolute ${styles.clapCount}`}>
            {countShort}
          </span>
        </button>
      </div>
    </LazyTippy>
  );
}
