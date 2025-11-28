import { GrantedListEmptyState } from "./subcomponents/GrantedListEmptyState";
import { GrantedListError } from "./subcomponents/GrantedListError";
import { GrantedListMessage } from "./subcomponents/GrantedListMessage";
import { GrantedListSkeleton } from "./subcomponents/GrantedListSkeleton";
import { UserPageXtdhGrantList } from "./subcomponents/UserPageXtdhGrantList";
import type { UserPageXtdhGrantedListContentProps } from "./types";

export default function UserPageXtdhGrantedListContent({
  enabled,
  isLoading,
  isError,
  errorMessage,
  grants,
  isSelf,
  onRetry,
  statuses,
}: Readonly<UserPageXtdhGrantedListContentProps>) {
  if (!enabled) {
    return (
      <GrantedListMessage>
        Unable to load xTDH grants for this profile.
      </GrantedListMessage>
    );
  }

  if (isLoading) {
    return <GrantedListSkeleton />;
  }

  if (isError) {
    return <GrantedListError message={errorMessage} onRetry={onRetry} />;
  }

  if (!grants.length) {
    return <GrantedListEmptyState isSelf={isSelf} statuses={statuses} />;
  }

  return <UserPageXtdhGrantList grants={grants} isSelf={isSelf} />;
}
