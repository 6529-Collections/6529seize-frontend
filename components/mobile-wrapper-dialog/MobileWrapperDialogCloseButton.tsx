import clsx from "clsx";

export default function MobileWrapperDialogCloseButton({
  onClick,
  className,
  label,
  variant = "default",
}: {
  readonly onClick: () => void;
  readonly className?: string;
  readonly label: string;
  readonly variant?: "default" | "minimal";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={clsx(
        "tw-group tw-inline-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-p-0 tw-transition-[color,transform] tw-duration-150 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-scale-95 desktop-hover:hover:tw-text-white motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
        variant === "minimal"
          ? "-tw-mr-3 tw-rounded-lg tw-text-iron-400"
          : "tw-rounded-full tw-text-iron-300",
        className
      )}
      onClick={onClick}
    >
      <span
        className={clsx(
          "tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-transition-[background-color,border-color] tw-duration-150 tw-ease-out motion-reduce:tw-transition-none",
          variant === "minimal"
            ? "tw-rounded-lg tw-border-0 tw-bg-transparent group-active:tw-bg-iron-800 desktop-hover:group-hover:tw-bg-iron-900"
            : "tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-white/[0.04] group-active:tw-bg-white/10 desktop-hover:group-hover:tw-border-iron-700 desktop-hover:group-hover:tw-bg-white/[0.08]"
        )}
      >
        <svg
          className="tw-size-5 tw-flex-shrink-0 tw-text-current"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
