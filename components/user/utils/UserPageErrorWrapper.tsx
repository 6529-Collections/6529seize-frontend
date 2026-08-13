import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function UserPageErrorWrapper({
  closeError,
  children,
  closeLabel = "Close",
  fullWidth = false,
}: {
  readonly closeError: () => void;
  readonly children: React.ReactNode;
  readonly closeLabel?: string;
  readonly fullWidth?: boolean;
}) {
  // role="alert" announces the error to screen readers the moment it appears;
  // the surrounding UI mounts this component conditionally on failure.
  return (
    <div
      role="alert"
      className={clsx(
        "tw-grid tw-w-full tw-grid-cols-[1.25rem_minmax(0,1fr)_2.75rem] tw-items-start tw-gap-x-3 tw-rounded-xl tw-border tw-border-solid tw-border-error/30 tw-bg-error/[0.06] tw-p-4 tw-pr-1 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]",
        !fullWidth && "md:tw-w-auto"
      )}
    >
      <ExclamationTriangleIcon
        className="tw-size-5 tw-flex-none tw-text-error"
        aria-hidden="true"
      />
      <div className="tw-min-w-0">{children}</div>
      <button
        onClick={closeError}
        type="button"
        title={closeLabel}
        aria-label={closeLabel}
        className="tw-group -tw-mt-3 tw-inline-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-colors tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-error desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-iron-100 motion-reduce:tw-transition-none"
      >
        <XMarkIcon className="tw-size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
