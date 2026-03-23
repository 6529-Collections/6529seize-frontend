import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import clsx from "clsx";
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

interface HeaderUserConnectProps {
  readonly className?: string | undefined;
  readonly icon?: ReactNode;
  readonly iconClassName?: string | undefined;
  readonly label?: string | undefined;
}

export default function HeaderUserConnect({
  className,
  icon,
  iconClassName,
  label = "Connect",
}: HeaderUserConnectProps) {
  const { seizeConnect } = useSeizeConnectContext();
  const renderedIcon = isValidElement<{ className?: string }>(icon)
    ? cloneElement(icon as ReactElement<{ className?: string }>, {
        className: clsx(
          "tw-flex-shrink-0",
          !iconClassName && !icon.props.className && "tw-size-4",
          icon.props.className,
          iconClassName
        ),
      })
    : icon;

  return (
    <button
      onClick={() => seizeConnect()}
      type="button"
      className={clsx(
        "tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-iron-200 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-800 tw-ring-1 tw-ring-inset tw-ring-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-300 hover:tw-ring-iron-300 focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset",
        className
      )}
    >
      {renderedIcon}
      <span>{label}</span>
    </button>
  );
}
