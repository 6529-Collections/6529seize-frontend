import { CheckIcon } from "@heroicons/react/24/outline";

export const POLL_CARD_CLASS_NAME =
  "tw-mb-2 tw-mt-3 tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/80 tw-p-4 tw-shadow-lg tw-backdrop-blur md:tw-max-w-2xl";

export const POLL_FOOTER_CLASS_NAME =
  "tw-mt-3.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-pt-3.5";

export function PollCardHeader({
  title,
  status,
  open,
}: {
  readonly title: string;
  readonly status: string;
  readonly open: boolean;
}) {
  return (
    <div className="tw-mb-3.5 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
      <div className="tw-text-[15px] tw-font-bold tw-text-white">{title}</div>
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-text-xs tw-font-medium tw-text-iron-400">
        <span
          className={`tw-size-1.5 tw-flex-shrink-0 tw-rounded-full ${open ? "tw-bg-emerald-500" : "tw-bg-iron-600"}`}
          aria-hidden="true"
        />
        <span className="tw-truncate">{status}</span>
      </div>
    </div>
  );
}

export function PollVotedStatus({
  label,
  updated = false,
}: {
  readonly label: string;
  readonly updated?: boolean;
}) {
  return (
    <span
      role="status"
      className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-1.5 tw-transition-all tw-duration-300"
    >
      <span
        className="tw-flex tw-size-4 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-emerald-500/30 tw-bg-emerald-500/15"
        aria-hidden="true"
      >
        <CheckIcon
          className="tw-size-2.5 tw-text-emerald-400"
          strokeWidth={3}
        />
      </span>
      <span
        className={`tw-text-[12px] tw-font-medium tw-transition-colors tw-duration-300 ${updated ? "tw-text-emerald-400" : "tw-text-iron-300"}`}
      >
        {label}
      </span>
    </span>
  );
}
