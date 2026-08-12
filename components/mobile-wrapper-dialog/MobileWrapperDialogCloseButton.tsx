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
        "-tw-mr-2 tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-p-2.5 tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-white/5 hover:tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-white/20",
        className
      )}
      onClick={onClick}
    >
      <svg
        className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-current"
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
    </button>
  );
}
