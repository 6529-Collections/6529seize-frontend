/**
 * Component to show loading state for a drop
 */
export default function DropLoading() {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      <div className="tw-h-6 tw-w-6 tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-relative tw-flex-shrink-0 tw-rounded-md z-10">
        <div className="tw-h-full tw-w-full tw-animate-pulse tw-bg-iron-700 tw-rounded-md" />
      </div>
      <p className="tw-mb-0 tw-text-sm tw-text-iron-200 tw-font-semibold tw-animate-pulse">
        Loading...
      </p>
    </div>
  );
}
