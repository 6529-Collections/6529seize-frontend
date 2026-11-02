import { useEffect, useRef } from "react";

const MEME_TAB_BUTTON_BASE_CLASS_NAME =
  "tw-m-0 tw-flex tw-items-center tw-whitespace-nowrap tw-border-x-0 tw-border-b-2 tw-border-t-0 tw-border-solid tw-bg-transparent tw-px-0 tw-py-4 tw-text-base tw-font-medium tw-leading-4 tw-no-underline tw-transition-colors tw-duration-300 tw-ease-out motion-reduce:tw-transition-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

function getMemePageTabButtonClassName(isActive: boolean) {
  return `${MEME_TAB_BUTTON_BASE_CLASS_NAME} ${
    isActive
      ? "tw-cursor-default tw-border-primary-400 tw-text-iron-100"
      : "tw-cursor-pointer tw-border-transparent tw-text-iron-400 hover:tw-text-iron-50"
  }`;
}

export function MemePageTabButton({
  title,
  isActive,
  onClick,
}: {
  readonly title: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isActive || !matchMedia("(max-width: 639px)").matches) return;
    const button = ref.current;
    const scroller = button?.parentElement?.parentElement;
    if (!button || !scroller) return;
    scroller.scrollTo({
      left: button.offsetLeft - scroller.offsetLeft - 16,
      behavior: "instant",
    });
  }, [isActive]);
  return (
    <button
      ref={ref}
      type="button"
      className={getMemePageTabButtonClassName(isActive)}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
    >
      {title}
    </button>
  );
}
