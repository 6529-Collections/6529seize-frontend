"use client";

import { useId, useState, type ReactNode } from "react";

export default function UserPageDisclosure({
  title,
  buttonClassName,
  bodyClassName,
  children,
}: {
  readonly title: string;
  readonly buttonClassName: string;
  readonly bodyClassName: string;
  readonly children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const panelId = useId();

  return (
    <div>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className={`${buttonClassName} tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-px-5 tw-py-4 tw-text-left tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400`}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <b>{title}</b>
        <span
          aria-hidden="true"
          className={`tw-h-2 tw-w-2 tw-shrink-0 tw-border-b-2 tw-border-r-2 tw-border-iron-400 tw-transition-transform tw-duration-200 ${
            isOpen ? "tw-rotate-[225deg]" : "tw-rotate-45"
          }`}
        />
      </button>
      <div
        className={`${bodyClassName} tw-px-5 tw-py-4`}
        hidden={!isOpen}
        id={panelId}
      >
        {children}
      </div>
    </div>
  );
}
