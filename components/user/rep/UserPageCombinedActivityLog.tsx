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
    matter !== undefined
      ? { ...initialActivityLogParams, matter }
      : initialActivityLogParams;

  return (
    <div>
      <ProfileActivityLogs
        initialParams={params}
        withFilters={true}
        withMatterFilter={withMatterFilter}
      >
        <h3 className="tw-mb-0 tw-whitespace-nowrap tw-text-xl tw-font-semibold tw-text-iron-100">
          Activity Log
        </h3>
      </ProfileActivityLogs>
    </div>
  );
}
