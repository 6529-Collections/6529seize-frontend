import { formatTimestampToMonthYear } from "@/helpers/Helpers";

export default function UserPageHeaderProfileEnabledAt({
  profileEnabledAt,
}: {
  readonly profileEnabledAt: string | null;
}) {
  if (!profileEnabledAt) {
    return null;
  }

  return (
    <div className="tw-mt-2">
      <p
        className="tw-mb-0 tw-text-iron-400 tw-text-sm tw-font-normal"
        suppressHydrationWarning
      >
        Profile Enabled:{" "}
        {formatTimestampToMonthYear(
          new Date(profileEnabledAt).getTime()
        )}
      </p>
    </div>
  );
}
