import { getTimeAgoShort } from "@/helpers/Helpers";

interface NotificationTimestampProps {
  readonly createdAt: number;
}

export default function NotificationTimestamp({
  createdAt,
}: NotificationTimestampProps) {
  return (
    <span className="tw-text-sm tw-text-iron-300 tw-font-normal tw-whitespace-nowrap">
      <span className="tw-font-bold tw-mr-1 tw-text-xs tw-text-iron-400">
        &#8226;
      </span>
      {getTimeAgoShort(createdAt)}
    </span>
  );
}

