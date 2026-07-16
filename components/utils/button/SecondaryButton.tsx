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
  const inactive = disabled || loading;
  const sizeClasses =
    size === "sm"
      ? "tw-px-3 tw-py-2 tw-text-xs"
      : "tw-px-3.5 tw-py-2.5 tw-text-sm";
  const stateClasses = inactive
    ? "tw-cursor-not-allowed tw-border-white/5 tw-bg-iron-950/40 tw-text-iron-600"
    : "tw-border-white/10 tw-bg-iron-950/70 tw-text-iron-300 desktop-hover:hover:tw-border-white/15 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100 active:tw-bg-iron-800";

  return (
    <button
      type="button"
      disabled={inactive}
      className={`tw-flex tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-ring-1 tw-ring-inset tw-ring-white/5 ${stateClasses} ${sizeClasses} tw-font-semibold tw-transition-colors tw-duration-200 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 ${className}`}
      onClick={inactive ? undefined : onClicked}
    >
      {loading && <CircleLoader />}
      {children}
    </button>
  );
}
