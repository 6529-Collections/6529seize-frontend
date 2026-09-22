import type { ReactNode } from "react";

interface NowMintingStatsItemProps {
  readonly appearance?: "compact" | "default";
  readonly label: ReactNode;
  readonly value?: ReactNode;
  readonly status?: "active" | "upcoming" | "ended" | undefined;
  readonly isLoading?: boolean;
  readonly allowWrap?: boolean;
  readonly compactLabelSize?: "default" | "large";
}

export default function NowMintingStatsItem({
  appearance = "default",
  label,
  value,
  status,
  isLoading,
  allowWrap,
  compactLabelSize = "default",
}: NowMintingStatsItemProps) {
  const getValueColor = () => {
    if (status === "active") return "tw-text-emerald-400";
    if (status === "ended") return "tw-text-iron-400";
    return appearance === "compact" ? "tw-text-iron-200" : "tw-text-iron-100";
  };
  const compactLabelSizeClassName =
    compactLabelSize === "large" ? "tw-text-[11px]" : "tw-text-[10.5px]";

  return (
    <div
      className={`tw-flex tw-flex-col ${
        appearance === "compact" ? "tw-gap-2" : "tw-gap-1.5"
      }`}
    >
      <span
        className={
          appearance === "compact"
            ? `tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500 ${compactLabelSizeClassName}`
            : "tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-400"
        }
      >
        {label}
      </span>
      {isLoading ? (
        <span className="tw-h-6 tw-w-20 tw-animate-pulse tw-rounded tw-bg-iron-800" />
      ) : (
        <span
          className={`${getValueColor()} ${
            appearance === "compact"
              ? "tw-text-sm tw-font-medium tw-tabular-nums tw-tracking-[-0.01em]"
              : "tw-font-mono tw-text-sm tw-font-medium md:tw-text-base"
          } ${allowWrap ? "tw-whitespace-normal" : "tw-whitespace-nowrap"}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}
