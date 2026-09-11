"use client";

import Button from "@/components/utils/button/Button";
import type { ReactNode } from "react";

interface NotificationsStateAction {
  readonly label: string;
  readonly handler: () => void;
}

interface NotificationsStateMessageProps {
  readonly message: string;
  readonly action?: NotificationsStateAction | undefined;
}

export default function NotificationsStateMessage({
  message,
  action,
}: NotificationsStateMessageProps): ReactNode {
  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-text-center tw-min-h-full tw-px-4 tw-py-8">
      <p className="tw-text-iron-300 tw-text-sm md:tw-text-base">{message}</p>
      {action ? (
        <Button variant="tertiary" size="md" onClick={action.handler}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
