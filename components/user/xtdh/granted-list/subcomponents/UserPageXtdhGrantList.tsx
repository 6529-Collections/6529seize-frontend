import type { ApiXTdhGrantsPage } from "@/generated/models/ApiXTdhGrantsPage";
import { UserPageXtdhGrantListItem } from "./UserPageXtdhGrantListItem";

export interface UserPageXtdhGrantListProps {
  readonly grants: ApiXTdhGrantsPage["data"];
  readonly isSelf: boolean;
}

export function UserPageXtdhGrantList({
  grants,
  isSelf,
}: Readonly<UserPageXtdhGrantListProps>) {
  return (
    <ul className="tw-m-0 tw-flex tw-flex-col tw-divide-y tw-divide-iron-800 tw-divide-x-0 tw-divide-solid tw-p-0">
      {grants.map((grant) => (
        <UserPageXtdhGrantListItem
          key={grant.id}
          grant={grant}
          isSelf={isSelf}
        />
      ))}
    </ul>
  );
}
