import { ProfileActivityLogGeneralCicStatementEdit } from "../../../../entities/IProfile";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

export default function ProfileActivityLogGeneralStatement({
  log,
}: {
  readonly log: ProfileActivityLogGeneralCicStatementEdit;
}) {
  return (
    <div className="tw-inline-flex tw-space-x-1 tw-max-w-xs sm:tw-max-w-sm md:tw-max-w-lg lg:tw-max-w-xl xl:tw-max-w-3xl 2xl:tw-max-w-5xl">
      <ProfileActivityLogItemAction action="changed" />
      <span className="tw-whitespace-nowrap tw-text-base tw-text-iron-300 tw-font-medium">
        About
      </span>
      <span className="tw-truncate tw-overflow-hidden tw-text-base tw-font-medium tw-text-iron-100">
        {log.contents.statement.statement_value}
      </span>
    </div>
  );
}
