import type { ReactNode } from "react";
import clsx from "clsx";
import styles from "./CollectDetailActionRow.module.css";

export default function CollectDetailPanel({
  children,
  framed = true,
}: {
  readonly children: ReactNode;
  readonly framed?: boolean;
}) {
  return (
    <div
      data-testid="collect-detail-panel"
      className={clsx(
        "tw-w-full",
        framed && styles["detailPanel"],
        framed &&
          "tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-text-left [&_[data-collect-connect-wallet]]:tw-min-h-11 [&_[data-collect-trade-status]:empty]:tw-hidden"
      )}
    >
      {children}
    </div>
  );
}
