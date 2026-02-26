import type { ProfileActivityLog } from "@/entities/IProfile";

import ProfileActivityLogItemWrapper from "./items/utils/ProfileActivityLogItemWrapper";
import ProfileActivityLogsItem from "./ProfileActivityLogsItem";

export default function UserPageIdentityActivityLogList({
  logs,
  user,
}: {
  readonly logs: ProfileActivityLog[];
  readonly user: string | null;
}) {
  return (
    <div className="tw-mt-4 md:tw-mt-6">
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
