interface NowMintingStatsItemProps {
  readonly label: string;
  readonly value: string;
  readonly status?: "active" | "upcoming" | "ended";
}

export default function NowMintingStatsItem({
  label,
  value,
  status,
}: NowMintingStatsItemProps) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <span className="tw-text-xs tw-text-iron-400">{label}</span>
      <span className="tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-iron-50">
        {status === "active" && (
          <span className="tw-mr-2 tw-inline-block tw-size-2 tw-rounded-full tw-bg-green" />
        )}
        {value}
      </span>
    </div>
  );
}
