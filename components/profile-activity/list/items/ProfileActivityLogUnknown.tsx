import type { ProfileActivityLog } from "@/entities/IProfile";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

export default function ProfileActivityLogUnknown({
  log,
}: {
  readonly log: ProfileActivityLog;
}) {
  return (
    <>
      <ProfileActivityLogItemAction action="recorded" />
      <span
        data-testid="unknown-identity-activity"
        className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-neutral-100"
      >
        identity activity
      </span>
      <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-medium">
        ({log.type})
      </span>
    </>
  );
}
