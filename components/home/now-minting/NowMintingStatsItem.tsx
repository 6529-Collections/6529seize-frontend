import type { ReactNode } from "react";

interface NowMintingStatsItemProps {
  readonly label: ReactNode;
  readonly value?: ReactNode;
  readonly status?: "active" | "upcoming" | "ended" | undefined;
  readonly isLoading?: boolean;
  readonly allowWrap?: boolean;
}

export default function NowMintingStatsItem({
  label,
  value,
  status,
  isLoading,
  allowWrap,
}: NowMintingStatsItemProps) {
  const getValueColor = () => {
    if (status === "active") return "tw-text-emerald-400";
    if (status === "ended") return "tw-text-iron-400";
    return "tw-text-iron-100";
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-1.5">
      <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-400">
        {label}
      </span>
      {isLoading ? (
        <span className="tw-h-6 tw-w-20 tw-animate-pulse tw-rounded tw-bg-iron-800" />
      ) : (
        <span
          className={`tw-font-mono tw-text-sm tw-font-medium md:tw-text-base ${getValueColor()} ${
            allowWrap ? "tw-whitespace-normal" : "tw-whitespace-nowrap"
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}
