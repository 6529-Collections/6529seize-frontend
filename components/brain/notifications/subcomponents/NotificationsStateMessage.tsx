"use client";

import type { ReactNode } from "react";

interface NotificationsStateAction {
  readonly label: string;
  readonly handler: () => void;
}

interface NotificationsStateMessageProps {
  readonly message: string;
  readonly action?: NotificationsStateAction;
}

export default function NotificationsStateMessage({
  message,
  action,
}: NotificationsStateMessageProps): ReactNode {
  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-text-center tw-min-h-full tw-px-4 tw-py-8">
      <p className="tw-text-iron-300 tw-text-sm md:tw-text-base">{message}</p>
      {action ? (
        <button
          type="button"
          onClick={action.handler}
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-500 tw-bg-transparent tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100 desktop-hover:hover:tw-bg-iron-800 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-iron-300">
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
