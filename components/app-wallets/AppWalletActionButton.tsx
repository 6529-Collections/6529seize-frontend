import { ArrowDownTrayIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export default function AppWalletActionButton({
  action,
  children,
  className,
  type = "button",
  ...buttonProps
}: Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> & {
    action: "create" | "import";
    children: ReactNode;
    type?: "button" | "submit" | "reset";
  }
>) {
  const Icon = action === "create" ? PlusIcon : ArrowDownTrayIcon;

  return (
    <button
      {...buttonProps}
      type={type}
      className={clsx(
        "tw-inline-flex tw-min-h-12 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-px-3 tw-py-2.5 tw-text-center tw-text-sm tw-font-semibold tw-leading-5 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50",
        action === "create"
          ? "tw-border-primary-500/50 tw-bg-primary-500/10 tw-text-primary-300 active:tw-bg-primary-500/20 desktop-hover:hover:tw-bg-primary-500/20"
          : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 active:tw-bg-iron-800 desktop-hover:hover:tw-bg-iron-800",
        className
      )}
    >
      <Icon aria-hidden="true" className="tw-size-5 tw-flex-none" />
      {children}
    </button>
  );
}
