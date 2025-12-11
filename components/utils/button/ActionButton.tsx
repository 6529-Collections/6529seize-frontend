import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

interface ActionButtonProps {
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
  readonly size?: "default" | "sm";
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

export default function ActionButton({
  onClicked,
  children,
  size = "default",
  disabled = false,
  loading = false,
}: ActionButtonProps) {
  const sizeClasses =
    size === "sm"
      ? "tw-px-2.5 tw-py-1.5"
      : "tw-px-3.5 tw-py-2.5";

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={disabled || loading ? undefined : onClicked}
      className={`tw-border tw-border-solid tw-border-primary-500 tw-ring-1 tw-ring-primary-500 tw-rounded-md tw-bg-primary-500 ${sizeClasses} tw-text-sm tw-font-semibold tw-text-white tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-primary-600 hover:tw-border-primary-600 hover:tw-ring-primary-600 ${
        disabled || loading ? "tw-cursor-not-allowed tw-opacity-50" : ""
      }`}
    >
      {loading && <CircleLoader />}
      {children}
    </button>
  );
}
