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
        <h3 className="tw-m-0 tw-whitespace-nowrap tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-iron-500 lg:tw-text-xl lg:tw-normal-case lg:tw-tracking-normal lg:tw-text-iron-100">
          Activity Log
        </h3>
      </ProfileActivityLogs>
    </div>
  );
}
