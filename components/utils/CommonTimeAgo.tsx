import { getTimeAgo, getTimeAgoShort } from "../../helpers/Helpers";

export default function CommonTimeAgo({
  timestamp,
  short = false,
}: {
  readonly timestamp: number;
  readonly short?: boolean;
}) {
  const text = short ? getTimeAgoShort(timestamp) : getTimeAgo(timestamp);
  return (
    <span className="tw-whitespace-nowrap tw-font-normal tw-text-sm sm:tw-text-base tw-text-iron-500">
      {text}
    </span>
  );
}
