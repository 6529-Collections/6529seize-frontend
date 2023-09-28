import CircleLoader from "./CircleLoader";
import JsonIcon from "./JsonIcon";

export default function RoundedJsonIconButton({
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
      className="tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20 hover:tw-bg-neutral-400/20 tw-ease-out tw-transition tw-duration-300"
    >
      <div className="tw-h-3.5 tw-w-3.5 tw-flex tw-items-center tw-justify-center">
        {loading ? <CircleLoader /> : <JsonIcon />}
      </div>
    </button>
  );
}
