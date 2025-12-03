import { formatStatFloor } from "@/helpers/Helpers";


interface UserXtdhStatsProps {
  readonly producedXtdhRate: number;
  readonly receivedXtdhRate: number | null;
  readonly availableGrantRate: number | null;
  readonly xtdhRate: number | null;
  readonly onOutboundClick?: () => void;
}

export function UserXtdhStats({
  producedXtdhRate,
  receivedXtdhRate,
  availableGrantRate,
  xtdhRate,
  onOutboundClick,
}: Readonly<UserXtdhStatsProps>) {
  const outbound = Math.max(producedXtdhRate - (availableGrantRate ?? 0), 0);

  const stats = [
    {
      label: "Generating",
      value: formatStatFloor(producedXtdhRate),
      subtext: "/day",
    },
    {
      label: "Inbound",
      value: formatStatFloor(receivedXtdhRate),
      subtext: "/day",
    },
    {
      label: "Outbound",
      value: formatStatFloor(outbound),
      subtext: "/day",
      onClick: onOutboundClick,
    },
    {
      label: "Net",
      value: formatStatFloor(xtdhRate),
      subtext: "/day",
    },
  ];

  return (
    <div className="tw-space-y-4">
      <section className="tw-grid tw-grid-cols-2 tw-gap-4 sm:tw-grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="tw-relative tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-space-y-1"
          >
            <div className="tw-flex tw-justify-between tw-items-start">
              <div className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
                {stat.label}
              </div>
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
            </div>
            <div className="tw-flex tw-items-baseline tw-gap-1">
              <span className="tw-text-xl tw-font-semibold tw-text-iron-50">
                {stat.value}
              </span>
              <span className="tw-text-xs tw-font-medium tw-text-iron-400">
                {stat.subtext}
              </span>
            </div>
          </div>
        ))}
      </section>
      <div className="tw-mt-4 tw-space-y-2">
        <div className="tw-flex tw-justify-between tw-text-xs tw-font-medium tw-text-iron-400">
          <span>Granted Grant Rate</span>
          <span>
            {formatStatFloor(outbound)} / {formatStatFloor(producedXtdhRate)} xTDH
          </span>
        </div>
        <div className="tw-h-2 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800">
          <div
            className="tw-h-full tw-bg-primary-500"
            style={{
              width: `${Math.min(
                Math.max(
                  (Math.floor(outbound) / Math.floor(producedXtdhRate)) * 100,
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
