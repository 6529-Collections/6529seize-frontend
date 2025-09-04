import CircleLoader from "../../distribution-plan-tool/common/CircleLoader";

export default function PrimaryButton({
  loading,
  disabled,
  onClicked,
  children,
  padding = "tw-px-3.5 tw-py-2.5",
  title,
}: {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
  readonly padding?: string;
  readonly title?: string;
}) {
  return (
    <button
      onClick={onClicked}
      disabled={disabled || loading}
      type="button"
      title={title}
      className={`tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-200 ${padding} tw-text-iron-800 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-border-0 tw-ring-1 tw-ring-inset tw-ring-white hover:tw-bg-iron-300 hover:tw-ring-iron-300 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out tw-justify-center tw-gap-x-1.5 ${
        disabled || loading ? "tw-cursor-not-allowed tw-opacity-50" : ""
      }`}
    >
      {loading && <CircleLoader />}
      {children}
    </button>
  );
}
