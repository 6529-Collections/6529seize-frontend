import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import { UserPageXtdhGrantListItem } from "./UserPageXtdhGrantListItem";

export interface UserPageXtdhGrantListProps {
  readonly grants: ApiTdhGrantsPage["data"];
}

export function UserPageXtdhGrantList({
  grants,
}: Readonly<UserPageXtdhGrantListProps>) {
  return (
    <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
      {grants.map((grant) => (
        <UserPageXtdhGrantListItem key={grant.id} grant={grant} />
      ))}
    </ul>
  );
}
