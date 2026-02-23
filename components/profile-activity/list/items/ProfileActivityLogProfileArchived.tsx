import type { ProfileActivityLogArchived } from "@/entities/IProfile";

export default function ProfileActivityLogProfileArchived({
  log,
}: {
  readonly log: ProfileActivityLogArchived;
}) {
  return (
    <>
      <span className="tw-whitespace-nowrap tw-text-sm lg:tw-text-base tw-text-iron-300 tw-font-medium">
        profile
      </span>
      <span className="tw-whitespace-nowrap tw-text-sm lg:tw-text-base tw-font-medium tw-text-iron-300">
        {log.contents.handle}
      </span>
      <span className="tw-whitespace-nowrap tw-text-sm lg:tw-text-base tw-text-iron-300 tw-font-medium">
        archived
      </span>
    </>
  );
}
