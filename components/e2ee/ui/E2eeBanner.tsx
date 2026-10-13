import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { hasContent } from "./hasContent";

type BannerTone = "info" | "warning" | "danger";

const TONE_CLASSES: Record<BannerTone, string> = {
  info: "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200",
  warning: "tw-border-amber-500/40 tw-bg-amber-500/10 tw-text-amber-100",
  danger: "tw-border-rose-500/40 tw-bg-rose-500/10 tw-text-rose-100",
};

const TONE_ICONS: Record<BannerTone, typeof InformationCircleIcon> = {
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
  danger: ShieldExclamationIcon,
};

interface E2eeBannerProps {
  readonly tone?: BannerTone | undefined;
  readonly children: ReactNode;
  readonly action?: ReactNode | undefined;
  /** Danger banners interrupt (alert); others are polite status updates. */
  readonly live?: boolean | undefined;
  readonly className?: string | undefined;
}

export function E2eeBanner({
  tone = "info",
  children,
  action,
  live = true,
  className = "",
}: E2eeBannerProps) {
  const Icon = TONE_ICONS[tone];
  let role: "alert" | "status" | undefined;
  if (live) {
    role = tone === "danger" ? "alert" : "status";
  }
  return (
    <div
      role={role}
      className={`tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2.5 tw-text-sm sm:tw-flex-row sm:tw-items-center ${TONE_CLASSES[tone]} ${className}`}
    >
      <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-2">
        <Icon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0"
        />
        <div className="tw-min-w-0 tw-flex-1 tw-break-words">{children}</div>
      </div>
      {hasContent(action) ? (
        <div className="tw-flex tw-flex-shrink-0 tw-flex-wrap tw-gap-2">
          {action}
        </div>
      ) : null}
    </div>
  );
}
