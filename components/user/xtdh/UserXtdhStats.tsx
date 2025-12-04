import { formatStatFloor } from "@/helpers/Helpers";


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

  return (
    <div className="tw-space-y-4">
      <section className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-4"
          >
            {stat.onClick && (
              <button
                onClick={stat.onClick}
                className="tw-absolute tw-top-3 tw-right-3 tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-text-white hover:tw-bg-primary-400 tw-transition-colors tw-border-none"
                title="Create New Grant"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="tw-w-4 tw-h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </button>
            )}
            <div className="tw-flex tw-flex-col">
              <div className="tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-400 tw-mb-1">
                {stat.label}
              </div>
              <div className="tw-flex tw-items-baseline tw-gap-1">
                <span className="tw-text-xl tw-font-semibold tw-text-iron-50 tw-tabular-nums">
                  {stat.value}
                </span>
                <span className="tw-text-xs tw-text-iron-500">
                  {stat.subtext}
                </span>
              </div>
            </div>
          </div>
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
        <div className="tw-h-1.5 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
          <div
            className="tw-h-full tw-rounded-full tw-bg-primary-400"
            style={{
              width: `${Math.min(
                Math.max(
                  ((Math.floor(outbound * 10) / 10) /
                    (Math.floor(generationRate * 10) / 10)) *
                  100,
                  0
                ),
                100
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
