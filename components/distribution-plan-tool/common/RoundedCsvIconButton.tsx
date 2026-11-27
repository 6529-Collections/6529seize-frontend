import CircleLoader from "./CircleLoader";
import CsvIcon from "./CsvIcon";

export default function RoundedCsvIconButton({
  loading,
  onClick,
  label,
  disabled = false,
}: {
  loading: boolean;
  onClick: () => void;
  label?: string | undefined;
  disabled?: boolean | undefined;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={disabled || loading}
      type="button"
      className="tw-group tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-iron-400/10 tw-text-xs tw-font-medium tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-iron-400/20 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-400/20 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
    >
      <div className="tw-flex tw-h-3.5 tw-w-3.5 tw-items-center tw-justify-center">
        {loading ? <CircleLoader /> : <CsvIcon />}
      </div>
    </button>
  );
}
