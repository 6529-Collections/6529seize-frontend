import { ProfileActivityLog } from "../../../../../entities/IProfile";
import UserPageIdentityActivityLogItem from "./UserPageIdentityActivityLogItem";

export default function UserPageIdentityActivityLogList({
  logs,
}: {
  logs: ProfileActivityLog[];
}) {
  return (
    <ul
      role="list"
      className="tw-mt-4 tw-px-8 tw-list-none tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0"
    >
      {logs.map((log) => (
        <UserPageIdentityActivityLogItem key={log.id} log={log} />
      ))}
    </ul>
  );
}
