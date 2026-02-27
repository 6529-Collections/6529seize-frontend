"use client";

import type { ReactNode } from "react";

export default function DropForgeFieldBox({
  label,
  className = "",
  labelClassName = "",
  contentClassName = "",
  children,
}: Readonly<{
  label: string;
  className?: string;
  labelClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}>) {
  return (
    <div
      className={`tw-relative tw-min-h-12 tw-rounded-md tw-bg-iron-950 tw-px-3 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-800 ${className}`}
    >
      <span
        className={`tw-pointer-events-none tw-absolute tw-left-3 tw-top-[-0.7rem] tw-rounded-full tw-bg-iron-950 tw-px-2 tw-py-[1px] tw-text-sm tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-iron-800 ${labelClassName}`}
      >
        {label}
      </span>
      <div
        className={`tw-mt-[2px] tw-flex tw-h-full tw-items-center tw-text-white ${contentClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
