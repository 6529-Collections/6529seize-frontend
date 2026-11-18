import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import { BODY } from "@/components/validator-page/validatorStyles";

const TONES = {
  info: {
    box: "tw-border-white/[0.08] tw-bg-iron-950/60",
    icon: "tw-text-iron-400",
    Icon: InformationCircleIcon,
  },
  error: {
    box: "tw-border-error/40 tw-bg-error/10",
    icon: "tw-text-error",
    Icon: ExclamationTriangleIcon,
  },
} as const;

/**
 * In place of the downloads when there is no release to offer: none is
 * published yet (`info`), or the release list failed to load (`error`,
 * usually with a way to try again).
 */
export default function ReleaseSectionEmpty({
  message,
  tone = "info",
  action,
}: {
  readonly message: string;
  readonly tone?: keyof typeof TONES | undefined;
  readonly action?: ReactNode;
}) {
  const { box, icon, Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-p-5 sm:tw-flex-row sm:tw-items-center ${box}`}
    >
      <div className="tw-flex tw-flex-1 tw-items-start tw-gap-3">
        <Icon
          aria-hidden="true"
          className={`tw-mt-0.5 tw-size-5 tw-flex-none ${icon}`}
        />
        <p className={`tw-m-0 ${BODY}`}>{message}</p>
      </div>
      {action === undefined ? null : (
        <div className="tw-flex-none">{action}</div>
      )}
    </div>
  );
}
