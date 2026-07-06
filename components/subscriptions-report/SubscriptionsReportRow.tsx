"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent, forwardRef, type ReactNode } from "react";

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
    tokenId: number;
  }>
>(function SubscriptionsReportRow({ children, className, tokenId }, ref) {
  const router = useRouter();
  const href = `/the-memes/${tokenId}`;

  const openCard = (event: MouseEvent<HTMLTableRowElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(href);
  };

  const onClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (isInteractiveRowTarget(event.target, event.currentTarget)) {
      return;
    }

    openCard(event);
  };

  const onAuxClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (
      event.button !== 1 ||
      isInteractiveRowTarget(event.target, event.currentTarget)
    ) {
      return;
    }

    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <tr
      ref={ref}
      onClick={onClick}
      onAuxClick={onAuxClick}
      className={`${className} tw-cursor-pointer`}
    >
      {children}
    </tr>
  );
});

export default SubscriptionsReportRow;
