import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { formatStatFloor } from "@/helpers/Helpers";
import { XtdhProgressBar } from "@/components/xtdh/stats/subcomponents/XtdhProgressBar";

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
    { label: "Generating", value: generationRate },
    { label: "Inbound", value: incomingRate },
    { label: "Outbound", value: outbound, onClick: onOutboundClick },
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
      <section className="tw-flex tw-min-w-0 tw-flex-col tw-px-4 tw-pb-1 tw-pt-4 md:tw-flex-row md:tw-flex-wrap md:tw-content-start md:tw-items-baseline md:tw-gap-x-5 md:tw-gap-y-2 md:tw-p-6">
        <div className="tw-mb-2.5 md:tw-mb-3 md:tw-basis-full">
          <div className="tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
            Net
          </div>
          <div className="tw-mt-0.5 tw-flex tw-items-baseline tw-gap-1 md:tw-mt-2">
            <span className="tw-text-[28px] tw-font-medium tw-tabular-nums tw-leading-[34px] tw-text-iron-50 md:tw-text-3xl">
              {formatStatFloor(net, 1)}
            </span>
            <span className="tw-text-sm tw-text-iron-500">/day</span>
          </div>
        </div>
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="tw-relative tw-flex tw-min-h-8 tw-min-w-0 tw-items-center tw-justify-between tw-gap-3 md:tw-min-h-0 md:tw-items-baseline md:tw-gap-1"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className="tw-absolute -tw-left-3 tw-hidden tw-text-iron-700 md:tw-inline"
              >
                ·
              </span>
            )}
            <span className="tw-text-sm tw-font-normal tw-text-iron-400 md:tw-text-[13px]">
              {stat.label}
            </span>
            <span className="tw-ml-auto tw-text-sm tw-tabular-nums md:tw-ml-0 md:tw-text-[13px]">
              <span className="tw-font-medium tw-text-iron-100">
                {formatStatFloor(stat.value, 1)}
              </span>
              <span className="tw-text-iron-500 md:tw-font-medium md:tw-text-iron-100">
                /day
              </span>
            </span>
            {stat.onClick && (
              <>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="tw-size-4 tw-shrink-0 tw-text-iron-400 md:tw-hidden"
                />
                <button
                  type="button"
                  title="Action"
                  aria-label={stat.label}
                  onClick={stat.onClick}
                  className="tw-absolute tw-inset-0 tw-w-full tw-rounded tw-border-0 tw-bg-transparent focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/[0.04]"
                />
              </>
            )}
          </div>
        ))}
      </section>
      <div className="tw-min-w-0 tw-px-4 tw-pb-4 md:tw-border-x-0 md:tw-border-b-0 md:tw-border-t md:tw-border-solid md:tw-border-white/[0.04] md:tw-bg-black/35 md:tw-p-6 lg:tw-border-l lg:tw-border-t-0">
        <div className="tw-flex tw-min-h-8 tw-items-center tw-justify-between tw-gap-2 md:tw-min-h-0 md:tw-flex-col md:tw-items-start">
          <span className="tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
            Granted rate
          </span>
          <span className="tw-text-sm tw-tabular-nums tw-text-iron-500">
            <span className="tw-font-medium tw-text-iron-100 md:tw-text-3xl">
              {formatStatFloor(outbound, 1)}
            </span>
            {` / ${formatStatFloor(generationRate, 1)} xTDH`}
          </span>
        </div>
        <div className="tw-mt-2 md:tw-mt-6 [&>div]:tw-h-1 [&>div]:tw-bg-white/[0.06]">
          <XtdhProgressBar
            percentage={percentage}
            ariaLabel="Granted Rate"
            ariaValueText={`${formatStatFloor(outbound, 1)} / ${formatStatFloor(generationRate, 1)} xTDH`}
          />
        </div>
      </div>
    </div>
  );
}
