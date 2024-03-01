import { getTimeAgo } from "../../helpers/Helpers";

export default function CommonTimeAgo({
  timestamp,
}: {
  readonly timestamp: number;
}) {
  return (
    <span className="tw-whitespace-nowrap tw-font-medium tw-text-base tw-text-iron-500">
      {getTimeAgo(timestamp)}
    </span>
  );
}
