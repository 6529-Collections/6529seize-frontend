import CircleLoader from "./CircleLoader";
import CsvIcon from "./CsvIcon";

export default function RoundedCsvIconButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-400/10 tw-ring-iron-400/20 hover:tw-bg-iron-400/20 tw-ease-out tw-transition tw-duration-300"
    >
      <div className="tw-h-3.5 tw-w-3.5 tw-flex tw-items-center tw-justify-center">
        {loading ? <CircleLoader /> : <CsvIcon />}
      </div>
    </button>
  );
}
