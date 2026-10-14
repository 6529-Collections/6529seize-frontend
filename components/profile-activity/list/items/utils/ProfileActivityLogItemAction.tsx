import { PROFILE_ACTIVITY_BODY } from "@/components/profile-activity/profileActivityTypography";
export default function ProfileActivityLogItemAction({
  action,
}: {
  readonly action: string;
}) {
  return (
    <span
      className={`tw-whitespace-nowrap tw-text-sm tw-font-normal tw-text-iron-500 empty:tw-hidden sm:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
    >
      {action}
    </span>
  );
}
