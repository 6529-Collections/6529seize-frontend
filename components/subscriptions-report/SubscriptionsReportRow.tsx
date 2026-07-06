"use client";

import { useRouter } from "next/navigation";
import {
  forwardRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

const INTERACTIVE_ROW_TARGET_SELECTOR =
  "a,button,input,select,textarea,[role='button'],[role='link']";

function isInteractiveRowTarget(
  target: EventTarget | null,
  row: HTMLTableRowElement
): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const interactiveTarget = target.closest(INTERACTIVE_ROW_TARGET_SELECTOR);
  return interactiveTarget !== null && interactiveTarget !== row;
}

const SubscriptionsReportRow = forwardRef<
  HTMLTableRowElement,
  Readonly<{
    children: ReactNode;
    className: string;
    label: string;
    tokenId: number;
  }>
>(function SubscriptionsReportRow(
  { children, className, label, tokenId },
  ref
) {
  const router = useRouter();
  const href = `/the-memes/${tokenId}`;
  const openCard = () => {
    router.push(href);
  };

  const onClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (isInteractiveRowTarget(event.target, event.currentTarget)) {
      return;
    }
    openCard();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (
      event.defaultPrevented ||
      isInteractiveRowTarget(event.target, event.currentTarget) ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    openCard();
  };

  return (
    <tr
      ref={ref}
      role="link"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`${className} tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-300`}
    >
      {children}
    </tr>
  );
});

export default SubscriptionsReportRow;
