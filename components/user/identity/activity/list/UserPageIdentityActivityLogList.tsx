import {
  IProfileAndConsolidations,
  ProfileActivityLog,
} from "../../../../../entities/IProfile";
import UserPageIdentityActivityLogItem from "./UserPageIdentityActivityLogItem";

export default function UserPageIdentityActivityLogList({
  logs,
  profile,
}: {
  logs: ProfileActivityLog[];
  profile: IProfileAndConsolidations;
}) {
  return (
  

        <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle tw-px-6 md:tw-px-8">
          <table className="tw-min-w-full">
            <tbody className="tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0">
              {logs.map((log) => (
                <UserPageIdentityActivityLogItem
                  key={log.id}
                  log={log}
                  profile={profile}
                />
              ))}
            </tbody>
          </table>
        </div>


  );
}
