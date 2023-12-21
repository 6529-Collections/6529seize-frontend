import { ProfileActivityLogHandleEdit } from "../../../../entities/IProfile";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

export default function ProfileActivityLogHandle({
  log,
}: {
  readonly log: ProfileActivityLogHandleEdit;
}) {
  const isAdded = !log.contents.old_value;
  return (
    <>
      <ProfileActivityLogItemAction action={isAdded ? "created" : "changed"} />
      <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
        handle
      </span>
      {!isAdded && (
        <>
          <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-neutral-100">
            {log.contents.old_value}
          </span>
          <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-400"
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

      <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
        {log.contents.new_value}
      </span>
    </>
  );
}
