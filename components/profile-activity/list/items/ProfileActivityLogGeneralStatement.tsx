import type { ProfileActivityLogGeneralCicStatementEdit } from "@/entities/IProfile";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

export default function ProfileActivityLogGeneralStatement({
  log,
}: {
  readonly log: ProfileActivityLogGeneralCicStatementEdit;
}) {
  return (
    <div className="tw-flex tw-min-w-0 tw-max-w-full tw-gap-x-1">
      <ProfileActivityLogItemAction action="changed" />
      <span className="tw-whitespace-nowrap tw-text-md tw-text-iron-300 tw-font-medium">
        About
      </span>
      <span className="tw-min-w-0 tw-truncate tw-overflow-hidden tw-text-md tw-font-medium tw-text-iron-200">
        {log.contents.statement.statement_value}
      </span>
    </div>
  );
}
