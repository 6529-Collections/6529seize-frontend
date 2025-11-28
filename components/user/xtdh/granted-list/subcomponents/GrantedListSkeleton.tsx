import { GrantItemSkeleton } from "./UserPageXtdhGrantListItem/subcomponents/GrantItemSkeleton";
import { GrantListItemContainer } from "./UserPageXtdhGrantListItem/subcomponents/GrantListItemContainer";

export function GrantedListSkeleton() {
  return (
    <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
      {Array.from({ length: 3 }).map((_, i) => (
        <GrantListItemContainer key={i}>
          <GrantItemSkeleton />
        </GrantListItemContainer>
      ))}
    </ul>
  );
}
