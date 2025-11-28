import { STATUS_LABELS, areAllGrantedStatuses } from "@/components/user/xtdh/user-page-xtdh-granted-list/constants";
import type { GrantedFilterStatuses } from "@/components/user/xtdh/user-page-xtdh-granted-list/types";

interface GrantedListEmptyStateProps {
  readonly isSelf: boolean;
  readonly statuses: GrantedFilterStatuses;
}

export function GrantedListEmptyState({ isSelf, statuses }: Readonly<GrantedListEmptyStateProps>) {
  const content = !areAllGrantedStatuses(statuses) ? (
    <>
      <span className="tw-text-lg tw-font-semibold tw-text-iron-200 tw-mb-2">
        No grants found
      </span>
      <span className="tw-text-sm tw-text-iron-400">
        No {statuses.map((status) => STATUS_LABELS[status]).join(", ")} grants found. Try a different filter.
      </span>
    </>
  ) : (
    <>
      <span className="tw-text-lg tw-font-semibold tw-text-iron-200 tw-mb-2">
        No grants yet
      </span>
      <span className="tw-text-sm tw-text-iron-400 tw-max-w-md">
        {isSelf
          ? "You haven't granted any xTDH yet. Start supporting collections you believe in by allocating your xTDH capacity."
          : "This identity hasn't granted any xTDH yet."}
      </span>
    </>
  );

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-p-12 tw-border tw-border-dashed tw-border-iron-800 tw-rounded-xl tw-bg-iron-900/20">
      {content}
    </div>
  );
}
