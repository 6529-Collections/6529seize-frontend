import { ProfileActivityLog } from "../../../entities/IProfile";
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
    <div className="tw-mt-4 tw-inline-block tw-min-w-full tw-align-middle tw-px-6 md:tw-px-8">
      <table className="tw-min-w-full">
        <tbody className="tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0">
          {logs.map((log) => (
            <ProfileActivityLogItemWrapper key={log.id} log={log} user={user}>
              <ProfileActivityLogsItem log={log} />
            </ProfileActivityLogItemWrapper>
          ))}
        </tbody>
      </table>
    </div>
  );
}
