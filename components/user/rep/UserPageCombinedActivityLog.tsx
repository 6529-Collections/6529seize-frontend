import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import ProfileActivityLogs from "@/components/profile-activity/ProfileActivityLogs";
import type { RateMatter } from "@/types/enums";

export default function UserPageCombinedActivityLog({
  initialActivityLogParams,
  matter,
  withMatterFilter = true,
}: {
  readonly initialActivityLogParams: ActivityLogParams;
  readonly matter?: RateMatter | null;
  readonly withMatterFilter?: boolean;
}) {
  const params: ActivityLogParams =
    matter === undefined
      ? initialActivityLogParams
      : { ...initialActivityLogParams, matter };

  return (
    <div>
      <ProfileActivityLogs
        initialParams={params}
        withFilters={true}
        withMatterFilter={withMatterFilter}
      >
        <h3 className="tw-mb-0 tw-flex tw-items-center tw-gap-1.5 lg:tw-gap-2 tw-whitespace-nowrap tw-text-xs tw-uppercase tw-tracking-wider tw-text-iron-100 lg:tw-text-xl lg:tw-normal-case lg:tw-tracking-normal tw-font-semibold">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="tw-h-3.5 tw-w-3.5 lg:tw-h-5 lg:tw-w-5 tw-flex-shrink-0 tw-text-iron-500"
          >
            <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
          </svg>
          Activity Log
        </h3>
      </ProfileActivityLogs>
    </div>
  );
}
