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
        framed && [
          "tw-relative tw-text-left [&_[data-collect-connect-wallet]]:tw-min-h-11 [&_[data-collect-connection-header]>p]:tw-text-pretty [&_[data-collect-detail-header]:empty+*]:tw-mt-0 [&_[data-collect-inline-actions]]:tw-gap-4 [&_[data-collect-trade-status]:empty]:tw-hidden",
          // The button already shows progress; retain the duplicate status only for assistive technology.
          "[&_[data-collect-trade-content]:has([data-collect-inline-actions]_button[aria-busy=true])>[data-collect-trade-status]:has(>[role=status]:only-child)]:tw-sr-only",
          "[&_[data-collect-main-actions]_button[type=button]:enabled:active]:tw-bg-iron-950 [&_[data-collect-main-actions]_button[type=button]:enabled:hover:not(:active)]:desktop-hover:tw-bg-iron-900 [&_[data-collect-main-actions]_button[type=button]:enabled:hover]:desktop-hover:tw-border-iron-650 [&_[data-collect-main-actions]_button[type=button]:enabled:hover]:desktop-hover:tw-text-white [&_[data-collect-main-actions]_button[type=button]]:tw-border-iron-700 [&_[data-collect-main-actions]_button[type=button]]:tw-bg-transparent [&_[data-collect-main-actions]_button[type=button]]:tw-text-iron-100 [&_[data-collect-main-actions]_button[type=button]]:tw-shadow-none",
          "[&_[data-collect-more-actions]_button[aria-haspopup=menu]:enabled:active]:tw-bg-iron-950 [&_[data-collect-more-actions]_button[aria-haspopup=menu]:enabled:hover:not(:active)]:desktop-hover:tw-bg-iron-900 [&_[data-collect-more-actions]_button[aria-haspopup=menu]:enabled:hover]:desktop-hover:tw-border-iron-650 [&_[data-collect-more-actions]_button[aria-haspopup=menu]:enabled:hover]:desktop-hover:tw-text-white [&_[data-collect-more-actions]_button[aria-haspopup=menu]]:tw-border-iron-700 [&_[data-collect-more-actions]_button[aria-haspopup=menu]]:tw-bg-transparent [&_[data-collect-more-actions]_button[aria-haspopup=menu]]:tw-text-iron-100 [&_[data-collect-more-actions]_button[aria-haspopup=menu]]:tw-shadow-none",
          "[&_[data-collect-owner-action]:enabled:active]:tw-bg-iron-950 [&_[data-collect-owner-action]:enabled:hover:not(:active)]:desktop-hover:tw-bg-iron-900 [&_[data-collect-owner-action]:enabled:hover]:desktop-hover:tw-border-iron-650 [&_[data-collect-owner-action]:enabled:hover]:desktop-hover:tw-text-white [&_[data-collect-owner-action]]:tw-border-iron-700 [&_[data-collect-owner-action]]:tw-bg-transparent [&_[data-collect-owner-action]]:tw-text-iron-100 [&_[data-collect-owner-action]]:tw-shadow-none",
          "[&_[data-collect-more-actions]_button[aria-haspopup=menu]:enabled:hover>svg]:desktop-hover:tw-text-white [&_[data-collect-more-actions]_button[aria-haspopup=menu]>svg]:tw-text-iron-400",
          "[&_[data-collect-detail-delivery]>div>div:first-child>span:nth-child(2)]:tw-tabular-nums [&_[data-collect-detail-delivery]>div>div:first-child>span:nth-child(2)]:tw-text-iron-300 [&_[data-collect-detail-delivery]>div>div:first-child]:tw-gap-x-1.5 [&_[data-collect-detail-delivery]>div>div:first-child]:tw-text-iron-500 [&_[data-collect-detail-delivery]_[data-collect-delivery-separator]]:tw-text-iron-650",
          "[&_[data-collect-detail-delivery]_[data-collect-delivery-change]:enabled:hover]:desktop-hover:tw-text-white [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:tw-relative [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:tw-min-h-0 [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:tw-py-0 [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:tw-font-medium [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:tw-text-iron-400 [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:tw-no-underline [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:tw-transition-colors [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:before:tw-absolute [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:before:-tw-inset-y-3.5 [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:before:tw-inset-x-0 [&_[data-collect-detail-delivery]_[data-collect-delivery-change]]:before:tw-content-['']",
        ]
      )}
    >
      {framed ? (
        <div className={styles["detailPanelContent"]}>{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
