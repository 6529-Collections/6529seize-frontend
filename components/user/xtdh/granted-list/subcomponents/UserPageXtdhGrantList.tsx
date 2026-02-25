import type { ApiXTdhGrantsPage } from "@/generated/models/ApiXTdhGrantsPage";

import { UserPageXtdhGrantListItem } from "./UserPageXtdhGrantListItem";

interface UserPageXtdhGrantListProps {
  readonly grants: ApiXTdhGrantsPage["data"];
  readonly isSelf: boolean;
}

export function UserPageXtdhGrantList({
  grants,
  isSelf,
}: Readonly<UserPageXtdhGrantListProps>) {
  return (
    <ul className="tw-m-0 tw-flex tw-flex-col tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-p-0">
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
