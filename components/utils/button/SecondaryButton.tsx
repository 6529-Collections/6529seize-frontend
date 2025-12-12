import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

interface SecondaryButtonProps {
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
  readonly size?: "default" | "sm";
  readonly disabled?: boolean;
  readonly className?: string;
  readonly loading?: boolean;
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
      ? "tw-px-2.5 tw-py-1.5"
      : "tw-px-3.5 tw-py-2.5";

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`tw-border tw-border-solid ${disabled || loading
          ? "tw-border-iron-900 tw-cursor-not-allowed"
          : "tw-border-iron-800 hover:tw-ring-iron-650 hover:tw-bg-iron-700 hover:tw-border-iron-700"
        } tw-ring-1 tw-ring-iron-700 tw-rounded-md tw-bg-iron-800 ${sizeClasses} tw-text-sm tw-font-semibold ${disabled || loading ? "tw-text-iron-600" : "tw-text-iron-300"
        } tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out ${className}`}
      onClick={disabled || loading ? undefined : onClicked}
    >
      {loading && <CircleLoader />}
      {children}
    </button>
  );
}
