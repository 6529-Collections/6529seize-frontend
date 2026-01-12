interface NowMintingStatsItemProps {
  readonly label: string;
  readonly value?: string | undefined;
  readonly status?: "active" | "upcoming" | "ended" | undefined;
  readonly isLoading?: boolean;
}

export default function NowMintingStatsItem({
  label,
  value,
  status,
  isLoading,
}: NowMintingStatsItemProps) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
      <span className="tw-text-xs tw-text-iron-400">{label}</span>
      {isLoading ? (
        <span className="tw-h-5 tw-w-16 tw-animate-pulse tw-rounded tw-bg-iron-700" />
      ) : (
        <span className="tw-flex tw-items-center tw-text-sm tw-font-medium tw-text-iron-50">
          {status === "active" && (
            <span className="tw-mr-2 tw-inline-block tw-size-2 tw-rounded-full tw-bg-green" />
          )}
          {value}
        </span>
      )}
    </div>
  );
}
