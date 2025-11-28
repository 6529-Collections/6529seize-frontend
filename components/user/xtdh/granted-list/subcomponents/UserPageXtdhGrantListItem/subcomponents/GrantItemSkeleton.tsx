import { GRANT_DETAILS_SKELETON_FIELDS } from "../utils/constants";

export function GrantItemSkeleton() {
  return (
    <div className="tw-animate-pulse tw-space-y-4">
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-start tw-gap-3">
          <div className="tw-h-14 tw-w-14 tw-rounded-lg tw-bg-iron-800" />
          <div className="tw-space-y-2">
            <div className="tw-h-4 tw-w-36 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-iron-800" />
          </div>
        </div>
        <div className="tw-h-5 tw-w-16 tw-rounded-full tw-bg-iron-800" />
      </div>
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
        {GRANT_DETAILS_SKELETON_FIELDS.map((field) => (
          <div key={field} className="tw-space-y-2">
            <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
