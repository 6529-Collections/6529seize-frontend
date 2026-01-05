import CircleLoader from "./CircleLoader";
import ManifoldIcon from "./ManifoldIcon";

export default function RoundedManifoldIconButton({
  loading,
  onClick,
  disabled = false,
}: {
  loading: boolean;
  onClick: () => void;
  disabled?: boolean | undefined;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
      className="tw-group tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-400/10 tw-ring-iron-400/20 hover:tw-bg-iron-400/20 tw-ease-out tw-transition tw-duration-300 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed">
      <div className="tw-h-3.5 tw-w-3.5 tw-flex tw-items-center tw-justify-center">
        {loading ? <CircleLoader /> : <ManifoldIcon />}
      </div>
    </button>
  );
}
