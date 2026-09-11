import { getTimeAgoShort } from "@/helpers/Helpers";

interface NotificationTimestampProps {
  readonly createdAt: number;
  readonly className?: string | undefined;
}

export default function NotificationTimestamp({
  createdAt,
  className = "tw-text-sm",
}: NotificationTimestampProps) {
  return (
    <span
      className={`${className} tw-whitespace-nowrap tw-font-normal tw-text-iron-400`}
    >
      <span aria-hidden="true" className="tw-mr-1 tw-text-xs tw-font-bold">
        &#8226;
      </span>
      {getTimeAgoShort(createdAt)}
    </span>
  );
}
