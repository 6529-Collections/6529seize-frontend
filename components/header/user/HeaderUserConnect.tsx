import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ReactNode } from "react";

interface HeaderUserConnectProps {
  readonly className?: string | undefined;
  readonly icon?: ReactNode;
  readonly label?: string | undefined;
}

export default function HeaderUserConnect({
  className,
  icon,
  label = "Connect",
}: HeaderUserConnectProps) {
  const { seizeConnect } = useSeizeConnectContext();

  return (
    <button
      onClick={() => seizeConnect()}
      type="button"
      className={`tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-iron-200 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-800 tw-ring-1 tw-ring-inset tw-ring-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-300 hover:tw-ring-iron-300 focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset ${className ?? ""}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
