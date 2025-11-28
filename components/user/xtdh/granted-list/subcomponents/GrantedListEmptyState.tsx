import { STATUS_LABELS, areAllGrantedStatuses } from "@/components/user/xtdh/user-page-xtdh-granted-list/constants";
import type { GrantedFilterStatuses } from "@/components/user/xtdh/user-page-xtdh-granted-list/types";
import { GrantedListMessage } from "./GrantedListMessage";

interface GrantedListEmptyStateProps {
  readonly isSelf: boolean;
  readonly statuses: GrantedFilterStatuses;
}

export function GrantedListEmptyState({ isSelf, statuses }: Readonly<GrantedListEmptyStateProps>) {
  if (!areAllGrantedStatuses(statuses)) {
    const statusLabel = statuses
      .map((status) => STATUS_LABELS[status])
      .join(", ");
    return (
      <GrantedListMessage>
        No {statusLabel} grants found. Try a different filter.
      </GrantedListMessage>
    );
  }
  return (
    <GrantedListMessage>
      {isSelf
        ? "You haven't granted any xTDH yet. Start supporting collections you believe in by allocating your xTDH capacity."
        : "This identity hasn't granted any xTDH yet. When users grant their xTDH to NFT collections, they support those collections by sharing their TDH generation capacity. This allows collectors of those NFTs to accrue TDH over time."}
    </GrantedListMessage>
  );
}
