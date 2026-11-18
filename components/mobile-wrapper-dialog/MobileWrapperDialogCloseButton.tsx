import clsx from "clsx";
import IconButton from "@/components/utils/button/IconButton";

export default function MobileWrapperDialogCloseButton({
  onClick,
  className,
  label,
  variant = "default",
  disabled = false,
  size = "default",
}: {
  readonly onClick: () => void;
  readonly className?: string;
  readonly label: string;
  readonly variant?: "default" | "minimal";
  readonly disabled?: boolean;
  readonly size?: "default" | "compact";
}) {
  return (
    <IconButton
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      variant={variant === "minimal" ? "ghost" : "subtle"}
      size={size === "compact" ? 36 : 40}
      surfaceSize={36}
      expandTouchTarget={size === "compact"}
      pressEffect
      className={clsx(
        variant === "minimal" && size === "default" && "-tw-mr-3",
        className
      )}
      onClick={onClick}
    >
      <svg
        className={clsx(
          "tw-flex-shrink-0 tw-text-current",
          size === "compact" ? "tw-size-4" : "tw-size-5"
        )}
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
    </IconButton>
  );
}
