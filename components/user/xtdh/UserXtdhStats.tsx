import { formatStatFloor } from "@/helpers/Helpers";
import { XtdhStatCard } from "@/components/xtdh/stats/subcomponents/XtdhStatCard";
import { XtdhProgressBar } from "@/components/xtdh/stats/subcomponents/XtdhProgressBar";

interface UserXtdhStatsProps {
  readonly generationRate: number;
  readonly incomingRate: number;
  readonly unusedRate: number;
  readonly onOutboundClick?: () => void;
}

export function UserXtdhStats({
  generationRate,
  incomingRate,
  unusedRate,
  onOutboundClick,
}: Readonly<UserXtdhStatsProps>) {
  const outbound = Math.max(generationRate - unusedRate, 0);
  const net = generationRate + incomingRate - outbound;

  const stats = [
    {
      label: "Generating",
      value: formatStatFloor(generationRate, 1),
      subtext: "/day",
    },
    {
      label: "Inbound",
      value: formatStatFloor(incomingRate, 1),
      subtext: "/day",
    },
    {
      label: "Outbound",
      value: formatStatFloor(outbound, 1),
      subtext: "/day",
      onClick: onOutboundClick,
    },
    {
      label: "Net",
      value: formatStatFloor(net, 1),
      subtext: "/day",
    },
  ];

  const percentage =
    generationRate > 0
      ? ((Math.floor(outbound * 10) / 10) /
        (Math.floor(generationRate * 10) / 10)) *
      100
      : 0;

  return (
    <div className="tw-space-y-4">
      <section className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-4">
        {stats.map((stat) => (
          <XtdhStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            subtext={stat.subtext}
            onClick={stat.onClick}
          />
        ))}
      </section>
      <div className="tw-space-y-2">
        <div className="tw-flex tw-justify-between tw-text-xs tw-font-semibold tw-uppercase tw-tracking-widest tw-text-iron-500">
          <span>Granted rate</span>
          <span className="tw-tabular-nums">
            {formatStatFloor(outbound, 1)} / {formatStatFloor(generationRate, 1)}{" "}
            xTDH
          </span>
        </div>
        <XtdhProgressBar
          percentage={percentage}
          ariaLabel="Granted Rate"
          ariaValueText={`${formatStatFloor(outbound, 1)} / ${formatStatFloor(
            generationRate,
            1
          )} xTDH`}
        />
      </div>
    </div>
  );
}
