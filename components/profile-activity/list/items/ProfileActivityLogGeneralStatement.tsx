import { ProfileActivityLogGeneralCicStatementEdit } from "../../../../entities/IProfile";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

export default function ProfileActivityLogGeneralStatement({
  log,
}: {
  readonly log: ProfileActivityLogGeneralCicStatementEdit;
}) {
  return (
    <div className="tw-inline-flex tw-space-x-1 tw-max-w-xs sm:tw-max-w-sm md:tw-max-w-md lg:tw-max-w-lg xl:tw-max-w-xl 2xl:tw-max-w-2xl">
      <ProfileActivityLogItemAction action="changed" />
      <span className="tw-whitespace-nowrap tw-text-sm tw-text-neutral-400 tw-font-medium">
        About
      </span>
      <span className="tw-truncate tw-overflow-hidden tw-text-sm tw-font-medium tw-text-iron-100">
        {log.contents.statement.statement_value}
      </span>
    </div>
  );
}
