import { EmptyState } from "@/components/common/EmptyState";
import {
  STATUS_LABELS,
  areAllGrantedStatuses,
} from "@/components/user/xtdh/user-page-xtdh-granted-list/constants";
import type { GrantedFilterStatuses } from "@/components/user/xtdh/user-page-xtdh-granted-list/types";

interface GrantedListEmptyStateProps {
  readonly isSelf: boolean;
  readonly statuses: GrantedFilterStatuses;
}

export function GrantedListEmptyState({
  isSelf,
  statuses,
}: Readonly<GrantedListEmptyStateProps>) {
  const title = !areAllGrantedStatuses(statuses)
    ? "No grants found"
    : "No grants yet";

  const message = !areAllGrantedStatuses(statuses) ? (
    <>
      No {statuses.map((status) => STATUS_LABELS[status]).join(", ")} grants
      found. Try a different filter.
    </>
  ) : isSelf ? (
    "You haven't granted any xTDH yet. Start supporting collections you believe in by allocating your xTDH capacity."
  ) : (
    "This identity hasn't granted any xTDH yet."
  );

  return (
    <div className="[&>div>span:first-child]:tw-text-sm [&>div>span:first-child]:tw-font-medium [&>div>span:first-child]:tw-text-iron-400 [&>div>span:last-child]:tw-text-meta [&>div>span:last-child]:tw-font-normal [&>div>span:last-child]:tw-text-iron-500 [&>div]:tw-items-start [&>div]:tw-border-0 [&>div]:tw-bg-iron-900/50 [&>div]:tw-p-6 [&>div]:tw-text-left">
      <EmptyState title={title} message={message} />
    </div>
  );
}
