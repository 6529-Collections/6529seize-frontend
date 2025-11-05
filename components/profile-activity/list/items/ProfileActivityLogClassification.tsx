import {
  CLASSIFICATIONS,
  ProfileActivityLogClassificationEdit,
} from "@/entities/IProfile";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

export default function ProfileActivityLogClassification({
  log,
}: {
  readonly log: ProfileActivityLogClassificationEdit;
}) {
  const isAdded = !log.contents.old_value;
  return (
    <>
      <ProfileActivityLogItemAction action={isAdded ? "added" : "changed"} />
      <span className="tw-whitespace-nowrap tw-text-base tw-text-iron-300 tw-font-medium">
        classification
      </span>
      {!isAdded && (
        <>
          <span className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-200">
            {log.contents.old_value &&
              CLASSIFICATIONS[log.contents.old_value].title}
          </span>
          <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-400"
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

      <span className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-200">
        {CLASSIFICATIONS[log.contents.new_value].title}
      </span>
    </>
  );
}
