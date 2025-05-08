import { getTimeAgo, getTimeAgoShort } from "../../helpers/Helpers";

export default function CommonTimeAgo({
  timestamp,
  short = false,
  className = "tw-text-sm sm:tw-text-base",
}: {
  readonly timestamp: number;
  readonly short?: boolean;
  readonly className?: string;
}) {
  const text = short ? getTimeAgoShort(timestamp) : getTimeAgo(timestamp);
  return (
    <span
      className={`tw-whitespace-nowrap tw-font-normal tw-text-iron-500 ${className}`}
    >
      {text}
    </span>
  );
}
