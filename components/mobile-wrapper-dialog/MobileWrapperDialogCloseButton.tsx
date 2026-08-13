import clsx from "clsx";

export default function MobileWrapperDialogCloseButton({
  onClick,
  className,
  label,
}: {
  readonly onClick: () => void;
  readonly className?: string;
  readonly label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={clsx(
        "tw-group tw-inline-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition-[color,transform] tw-duration-150 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-white active:tw-scale-95 motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
        className
      )}
      onClick={onClick}
    >
      <span className="tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-white/[0.04] tw-transition-[background-color,border-color] tw-duration-150 tw-ease-out desktop-hover:group-hover:tw-border-iron-700 desktop-hover:group-hover:tw-bg-white/[0.08] group-active:tw-bg-white/10 motion-reduce:tw-transition-none">
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
