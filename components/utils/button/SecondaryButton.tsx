import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

interface SecondaryButtonProps {
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
  readonly size?: "default" | "sm" | undefined;
  readonly disabled?: boolean | undefined;
  readonly className?: string | undefined;
  readonly loading?: boolean | undefined;
}

export default function SecondaryButton({
  onClicked,
  children,
  size = "default",
  disabled = false,
  className = "",
  loading = false,
}: SecondaryButtonProps) {
  const sizeClasses =
    size === "sm"
      ? "tw-px-3 tw-py-2 tw-text-xs"
      : "tw-px-3.5 tw-py-2.5 tw-text-sm";

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`tw-border tw-border-solid ${
        disabled || loading
          ? "tw-cursor-not-allowed tw-border-iron-900"
          : "tw-border-iron-800 hover:tw-border-iron-700 hover:tw-bg-iron-700 hover:tw-ring-iron-650"
      } tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-iron-700 ${sizeClasses} tw-font-semibold ${
        disabled || loading ? "tw-text-iron-600" : "tw-text-iron-300"
      } tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 ${className}`}
      onClick={disabled || loading ? undefined : onClicked}
    >
      {loading && <CircleLoader />}
      {children}
    </button>
  );
}
