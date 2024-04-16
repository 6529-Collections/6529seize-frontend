import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import type { ProfileActivityLogDropComment } from "../../../../entities/IProfile";
import Link from "next/link";
export default function ProfileActivityLogDropCreated({
  log,
}: {
  readonly log: ProfileActivityLogDropComment;
}) {
  return (
    <>
      <ProfileActivityLogItemAction action="commented" />
      <span className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-100">
        Drop
      </span>
      <Link href={`/brain/${log.target_id}`} className="tw-leading-4 tw-p-0">
        <span className="tw-cursor-pointer tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-100 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
          #{log.target_id}
        </span>
      </Link>
    </>
  );
}
