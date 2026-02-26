import { TweetContainer } from "react-tweet";

import styles from "./ExpandableTweetPreview.module.css";

import type { ReactNode, RefObject } from "react";

export default function MeasurementShell({
  show,
  measureRef,
  children,
}: {
  readonly show: boolean;
  readonly measureRef: RefObject<HTMLDivElement | null>;
  readonly children: ReactNode;
}) {
  if (!show) {
    return null;
  }

  return (
    <div className={styles["measure"]} ref={measureRef}>
      <TweetContainer className="tw-w-full tw-min-w-0 tw-max-w-full">
        {children}
      </TweetContainer>
    </div>
  );
}
