import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

export default function PrimaryButton({
  loading,
  disabled,
  onClicked,
  children,
  padding = "tw-px-3.5 tw-py-2.5",
  title,
  ariaLabel,
  hideChildrenWhenLoading = false,
}: {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
  readonly padding?: string | undefined;
  readonly title?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly hideChildrenWhenLoading?: boolean | undefined;
}) {
  const showChildren = !loading || !hideChildrenWhenLoading;

  return (
    <button
      onClick={onClicked}
      disabled={disabled || loading}
      type="button"
      title={title}
      aria-label={ariaLabel}
      className={`tw-flex tw-items-center tw-whitespace-nowrap tw-rounded-lg tw-bg-iron-200 tw-text-sm tw-font-semibold ${padding} tw-justify-center tw-gap-x-1.5 tw-border-0 tw-text-iron-950 tw-ring-1 tw-ring-inset tw-ring-white tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-300 hover:tw-ring-iron-300 focus:tw-z-10 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset ${
        disabled || loading ? "tw-cursor-not-allowed tw-opacity-50" : ""
      }`}
    >
      {loading && (
        <span className={showChildren ? "-tw-ml-1.5" : ""}>
          <CircleLoader />
        </span>
      )}
      {showChildren && children}
    </button>
  );
}
