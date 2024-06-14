import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

export default function GroupCreateWalletsCountText({
  loading,
  walletsCount,
}: {
  readonly loading: boolean;
  readonly walletsCount: number | null;
}) {
  if (loading) {
    return <span className="tw-text-iron-50 tw-font-semibold">Loading...</span>;
  }

  if (typeof walletsCount === "number") {
    return (
      <span className="tw-text-iron-50 tw-font-semibold">
        {formatNumberWithCommas(walletsCount)}
      </span>
    );
  }

  return <span className="tw-text-iron-400 tw-font-medium">Not added</span>;
}
