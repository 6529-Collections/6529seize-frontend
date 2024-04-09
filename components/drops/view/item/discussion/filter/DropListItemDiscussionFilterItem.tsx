import { DropItemDiscussionFilterType } from "../DropListItemDiscussion";

export default function DropListItemDiscussionFilterItem({
  activeFilter,
  filter,
  setFilter,
  children,
}: {
  readonly activeFilter: DropItemDiscussionFilterType;
  readonly filter: DropItemDiscussionFilterType;
  readonly setFilter: (filter: DropItemDiscussionFilterType) => void;
  readonly children: React.ReactNode;
}) {
  const isActive = activeFilter === filter;
  const classes = isActive
    ? "tw-bg-iron-700 tw-text-iron-100 tw-border-iron-700"
    : "tw-bg-iron-900 hover:tw-bg-iron-800 tw-text-iron-500 hover:tw-text-iron-100 tw-border-iron-900 hover:tw-border-iron-800";
  return (
    <nav className="tw-flex">
      <button
        onClick={() => setFilter(filter)}
        type="button"
        className={`${classes}  tw-rounded-lg tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-border tw-border-solid  tw-transition tw-duration-300 tw-ease-out`}
      >
        {children}
      </button>
    </nav>
  );
}
