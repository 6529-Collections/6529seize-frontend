import type { ProfileActivityLog } from "@/entities/IProfile";
import ProfileActivityLogsItem from "./ProfileActivityLogsItem";
import ProfileActivityLogItemWrapper from "./items/utils/ProfileActivityLogItemWrapper";

export default function UserPageIdentityActivityLogList({
  logs,
  user,
}: {
  readonly logs: ProfileActivityLog[];
  readonly user: string | null;
}) {
  return (
    <div className={`${user ? "tw-px-4 sm:tw-px-6" : ""} tw-mt-2 tw-pb-2`}>
      <div className="tw-space-y-2.5">
        {logs.map((log) => (
          <ProfileActivityLogItemWrapper key={log.id} log={log} user={user}>
            <ProfileActivityLogsItem log={log} user={user} />
          </ProfileActivityLogItemWrapper>
        ))}
      </div>
    </div>
  );
}
