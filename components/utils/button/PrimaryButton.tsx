import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import Link from "next/link";

type PrimaryButtonSize = "default" | "sm" | "lg";

interface PrimaryButtonProps {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
  readonly size?: PrimaryButtonSize | undefined;
  readonly padding?: string | undefined;
  readonly title?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly className?: string | undefined;
  readonly hideChildrenWhenLoading?: boolean | undefined;
  readonly href?: string | undefined;
}

const TEXT_SIZE_CLASS_BY_SIZE: Record<PrimaryButtonSize, string> = {
  default: "tw-text-sm",
  sm: "tw-text-xs",
  lg: "tw-text-base",
};

const PADDING_CLASS_BY_SIZE: Record<PrimaryButtonSize, string> = {
  default: "tw-px-3.5 tw-py-2.5",
  sm: "tw-px-2.5 tw-py-2",
  lg: "tw-px-5 tw-py-3",
};

export default function PrimaryButton({
  loading,
  disabled,
  onClicked,
  children,
  size = "default",
  padding,
  title,
  ariaLabel,
  className = "",
  hideChildrenWhenLoading = false,
  href,
}: PrimaryButtonProps) {
  const showChildren = !loading || !hideChildrenWhenLoading;
  const paddingClasses = padding ?? PADDING_CLASS_BY_SIZE[size];
  const textSizeClass = TEXT_SIZE_CLASS_BY_SIZE[size];
  const classes = `tw-flex tw-items-center tw-whitespace-nowrap tw-rounded-lg tw-bg-iron-200 ${textSizeClass} tw-font-semibold ${paddingClasses} tw-justify-center tw-gap-x-1.5 tw-border-0 tw-text-iron-950 tw-ring-1 tw-ring-inset tw-ring-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-300 hover:tw-ring-iron-300 focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset ${
    disabled || loading ? "tw-cursor-not-allowed tw-opacity-50" : ""
  } ${className}`;

  if (href && !disabled && !loading) {
    return (
      <Link
        href={href}
        title={title}
        aria-label={ariaLabel}
        className={`${classes} tw-no-underline hover:tw-text-iron-950 hover:tw-no-underline focus:tw-no-underline`}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClicked}
      disabled={disabled || loading}
      type="button"
      title={title}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={classes}
    >
      {loading && (
        <span className="tw-flex tw-items-center tw-justify-center">
          <CircleLoader />
        </span>
      )}
      {showChildren && children}
    </button>
  );
}
