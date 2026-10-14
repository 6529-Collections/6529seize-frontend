import { formatStatFloor } from "@/helpers/Helpers";
import { XtdhStatCard } from "@/components/xtdh/stats/subcomponents/XtdhStatCard";
import { XtdhLabeledProgressBar } from "@/components/xtdh/stats/subcomponents/XtdhLabeledProgressBar";

interface UserXtdhStatsProps {
  readonly generationRate: number;
  readonly incomingRate: number;
  readonly unusedRate: number;
  readonly onOutboundClick?: (() => void) | undefined;
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
      ? (Math.floor(outbound * 10) /
          10 /
          (Math.floor(generationRate * 10) / 10)) *
        100
      : 0;

  return (
    <div className="tw-grid tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-900 lg:tw-grid-cols-[minmax(0,1.78fr)_minmax(0,1fr)]">
      <section className="tw-flex tw-min-w-0 tw-flex-wrap tw-content-start tw-items-baseline tw-gap-x-5 tw-gap-y-2 tw-p-5 sm:tw-p-6 [&>div:last-child>div>div:first-child]:tw-text-[11px] [&>div:last-child>div>div:first-child]:tw-font-medium [&>div:last-child>div>div:first-child]:tw-uppercase [&>div:last-child>div>div:first-child]:tw-tracking-wider [&>div:last-child>div>div:first-child]:tw-text-iron-500 [&>div:last-child>div>div:last-child>span:first-child]:tw-text-2xl [&>div:last-child>div>div:last-child>span:first-child]:tw-font-medium sm:[&>div:last-child>div>div:last-child>span:first-child]:tw-text-3xl [&>div:last-child>div>div:last-child>span:last-child]:tw-text-sm [&>div:last-child>div>div:last-child>span:last-child]:tw-font-normal [&>div:last-child>div>div:last-child>span:last-child]:tw-text-iron-500 [&>div:last-child>div>div:last-child]:tw-gap-1 [&>div:last-child>div]:tw-flex-col [&>div:last-child>div]:tw-gap-2 [&>div:last-child]:tw-order-first [&>div:last-child]:tw-mb-3 [&>div:last-child]:tw-basis-full [&>div:nth-child(2)]:before:tw-absolute [&>div:nth-child(2)]:before:-tw-left-3 [&>div:nth-child(2)]:before:tw-text-iron-700 [&>div:nth-child(2)]:before:tw-content-['·'] [&>div:nth-child(3)]:before:tw-absolute [&>div:nth-child(3)]:before:-tw-left-3 [&>div:nth-child(3)]:before:tw-text-iron-700 [&>div:nth-child(3)]:before:tw-content-['·'] [&>div>div>div:first-child]:tw-mb-0 [&>div>div>div:first-child]:tw-text-[13px] [&>div>div>div:first-child]:tw-font-normal [&>div>div>div:first-child]:tw-normal-case [&>div>div>div:first-child]:tw-tracking-normal [&>div>div>div:last-child>span:first-child]:tw-max-w-full [&>div>div>div:last-child>span:first-child]:tw-break-words [&>div>div>div:last-child>span]:tw-text-[13px] [&>div>div>div:last-child>span]:tw-font-medium [&>div>div>div:last-child>span]:tw-text-iron-100 [&>div>div>div:last-child]:tw-max-w-full [&>div>div>div:last-child]:tw-flex-wrap [&>div>div>div:last-child]:tw-gap-0 [&>div>div]:tw-flex-row [&>div>div]:tw-flex-wrap [&>div>div]:tw-items-baseline [&>div>div]:tw-gap-x-1 [&>div]:tw-min-w-0 [&>div]:tw-max-w-full [&>div]:tw-border-0 [&>div]:tw-bg-transparent [&>div]:tw-p-0 [&_button:focus-visible]:tw-outline-none [&_button:focus-visible]:tw-ring-2 [&_button:focus-visible]:tw-ring-primary-400 [&_button:hover]:tw-bg-white/[0.04] [&_button>svg]:tw-hidden [&_button]:tw-inset-0 [&_button]:tw-h-auto [&_button]:tw-min-h-6 [&_button]:tw-w-full [&_button]:tw-rounded [&_button]:tw-bg-transparent">
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
      <div className="tw-min-w-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.04] tw-bg-black/35 tw-p-5 sm:tw-p-6 lg:tw-border-l lg:tw-border-t-0 [&>div>div:first-child>span:last-child]:tw-break-words [&>div>div:first-child>span:last-child]:tw-text-sm [&>div>div:first-child>span:last-child]:tw-font-normal [&>div>div:first-child>span:last-child]:tw-normal-case [&>div>div:first-child>span:last-child]:tw-tracking-normal [&>div>div:first-child]:tw-flex-col [&>div>div:first-child]:tw-gap-2 [&>div>div:first-child]:tw-text-[11px] [&>div>div:first-child]:tw-font-medium [&>div>div:first-child]:tw-tracking-wider [&_[role=progressbar]]:!tw-mt-6 [&_[role=progressbar]]:tw-h-1 [&_[role=progressbar]]:tw-bg-white/[0.06]">
        <XtdhLabeledProgressBar
          label="Granted rate"
          value={
            <>
              <span className="tw-text-2xl tw-font-medium tw-text-iron-100 sm:tw-text-3xl">
                {formatStatFloor(outbound, 1)}
              </span>
              {` / ${formatStatFloor(generationRate, 1)} xTDH`}
            </>
          }
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
