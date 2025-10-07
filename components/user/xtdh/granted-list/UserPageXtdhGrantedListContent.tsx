import type { ReactNode } from "react";
import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import type { GrantedFilterStatus } from "../UserPageXtdhGrantedList";
import { UserPageXtdhGrantList } from "./UserPageXtdhGrantList";

export interface UserPageXtdhGrantedListContentProps {
  readonly enabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string;
  readonly grants: ApiTdhGrantsPage["data"];
  readonly isSelf: boolean;
  readonly onRetry: () => void;
  readonly status: GrantedFilterStatus;
}

export function UserPageXtdhGrantedListContent({
  enabled,
  isLoading,
  isError,
  errorMessage,
  grants,
  isSelf,
  onRetry,
  status,
}: Readonly<UserPageXtdhGrantedListContentProps>) {
  if (!enabled) {
    return (
      <GrantedListMessage>
        Unable to load TDH grants for this profile.
      </GrantedListMessage>
    );
  }

  if (isLoading) {
    return (
      <GrantedListMessage>Loading granted xTDH…</GrantedListMessage>
    );
  }

  if (isError) {
    return (
      <GrantedListError message={errorMessage} onRetry={onRetry} />
    );
  }

  if (!grants.length) {
    if (status !== "ALL") {
      const statusLabel = status.toLowerCase();
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

  return <UserPageXtdhGrantList grants={grants} />;
}

interface GrantedListMessageProps {
  readonly children: ReactNode;
}

function GrantedListMessage({ children }: Readonly<GrantedListMessageProps>) {
  return <p className="tw-text-sm tw-text-iron-300 tw-m-0">{children}</p>;
}

interface GrantedListErrorProps {
  readonly message?: string;
  readonly onRetry: () => void;
}

function GrantedListError({
  message,
  onRetry,
}: Readonly<GrantedListErrorProps>) {
  const displayMessage =
    message ?? "Failed to load granted xTDH.";

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <p className="tw-text-sm tw-text-red-400 tw-m-0" role="alert">
        {displayMessage}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="tw-self-start tw-rounded tw-bg-primary-500 tw-text-black tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold hover:tw-bg-primary-400">
        Retry
      </button>
    </div>
  );
}
