import {
  ProfileActivityLogBanner1Edit,
  ProfileActivityLogBanner2Edit,
  ProfileActivityLogType,
} from "../../../../entities/IProfile";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

const TITLE: Record<
  ProfileActivityLogType.BANNER_1_EDIT | ProfileActivityLogType.BANNER_2_EDIT,
  string
> = {
  [ProfileActivityLogType.BANNER_1_EDIT]: "Banner 1",
  [ProfileActivityLogType.BANNER_2_EDIT]: "Banner 2",
};

export default function ProfileActivityLogBanner({
  log,
}: {
  readonly log: ProfileActivityLogBanner1Edit | ProfileActivityLogBanner2Edit;
}) {
  const isAdded = !log.contents.old_value;

  return (
    <>
      <ProfileActivityLogItemAction action={isAdded ? "added" : "changed"} />
      <span className="tw-whitespace-nowrap tw-text-base tw-text-iron-300 tw-font-medium">
        {TITLE[log.type]}
      </span>
      {!isAdded && (
        <>
          <span
            className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-h-4 tw-w-4 tw-rounded-sm"
            style={{ backgroundColor: log.contents.old_value }}
          ></span>
          <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-300"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 12H20M20 12L14 6M20 12L14 18"
              stroke="currentcOLOR"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )}

      <span
        className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-h-4 tw-w-4 tw-rounded-sm"
        style={{ backgroundColor: log.contents.new_value }}
      ></span>
    </>
  );
}
