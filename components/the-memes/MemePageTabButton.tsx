import { useEffect, useRef } from "react";
import UnderlineTab from "@/components/common/UnderlineTab";

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
    <UnderlineTab
      ref={ref}
      type="button"
      active={isActive}
      className={`tw-m-0 tw-flex tw-items-center tw-px-0 tw-py-4 tw-leading-4 ${isActive ? "tw-cursor-default" : "tw-cursor-pointer"}`}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
    >
      {title}
    </UnderlineTab>
  );
}
