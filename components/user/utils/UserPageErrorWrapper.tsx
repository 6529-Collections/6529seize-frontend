import IconButton from "@/components/utils/button/IconButton";
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
      <IconButton
        onClick={closeError}
        type="button"
        title={closeLabel}
        aria-label={closeLabel}
        size={44}
        variant="ghost"
        className="-tw-mt-3"
      >
        <XMarkIcon className="tw-size-5" aria-hidden="true" />
      </IconButton>
    </div>
  );
}
