import { ProfileActivityLog } from "../../../../../entities/IProfile";
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
  return (
    <tr className="tw-flex tw-items-center tw-justify-between">
      <td className="tw-py-2.5">
        <span className="tw-space-x-1.5 tw-inline-flex tw-items-center">
          <ProfileActivityLogItemHandle log={log} user={user} />
          {children}
        </span>
      </td>
      <td className="tw-py-2.5 tw-pl-3 tw-text-right">
        <ProfileActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
