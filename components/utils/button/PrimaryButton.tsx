import CircleLoader from "../../distribution-plan-tool/common/CircleLoader";

export default function PrimaryButton({
  loading,
  disabled,
  onClicked,
  children,
}: {
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly onClicked: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="tw-p-[1px] tw-flex tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-400 tw-to-primary-500">
      <button
        onClick={onClicked}
        disabled={disabled || loading}
        type="button"
        className={`${
          disabled || loading
            ? "tw-opacity-50 tw-text-iron-300"
            : "tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600"
        } tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold  tw-shadow-sm  hover:tw-bg-border-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out`}
      >
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-x-2">
          {loading && <CircleLoader />}
          <span>{children}</span>
        </div>
      </button>
    </div>
  );
}
