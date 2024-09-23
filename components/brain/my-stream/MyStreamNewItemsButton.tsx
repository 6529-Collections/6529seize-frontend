
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";

interface NewItemsButtonProps {
  readonly onRefresh: () => void;
  readonly isFetching: boolean;
}

export function MyStreamNewItemsButton({ onRefresh, isFetching }: NewItemsButtonProps) {
  return (
    <div className="tw-sticky tw-top-4 tw-left-0 -tw-mb-8 tw-right-0 tw-z-50 tw-flex tw-justify-center">
      <button
        onClick={onRefresh}
        type="button"
        className="tw-border-none tw-bg-primary-500 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-md tw-cursor-pointer tw-transition-all tw-flex tw-items-center tw-gap-2 hover:tw-bg-primary-600 tw-text-xs tw-font-medium"
      >
        New items available{" "}
        {isFetching && <CircleLoader size={CircleLoaderSize.SMALL} />}
      </button>
    </div>
  );
}
