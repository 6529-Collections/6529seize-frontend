import {
  ProfileActivityLog,
  ProfileActivityLogType,
} from "../../../../../entities/IProfile";
import ProfileActivityLogItemTimeAgo from "./ProfileActivityLogItemTimeAgo";
import ProfileActivityLogItemHandle from "./ProfileActivityLogItemHandle";

export default function ProfileActivityLogItemWrapper({
  log,
  children,
  user,
}: {
  readonly log: ProfileActivityLog;
  readonly children: React.ReactNode;
  readonly user: string | null;
}) {
  const isArchived = log.type === ProfileActivityLogType.PROFILE_ARCHIVED;

  return (
    <tr className="tw-flex tw-items-center tw-justify-between">
      <td className="tw-py-2.5">
        <span className="tw-space-x-1 tw-inline-flex tw-items-center">
          {!isArchived && (
            <ProfileActivityLogItemHandle log={log} user={user} />
          )}
          {children}
        </span>
      </td>
      <td className="tw-py-2.5 tw-pl-3 tw-text-right">
        <ProfileActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
