import { formatNumberWithCommas } from "@/helpers/Helpers";

export const FingerprintIcon = ({
  className,
}: {
  readonly className?: string;
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <path d="M2 12a10 10 0 0 1 18-6" />
    <path d="M2 16h.01" />
    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
  </svg>
);

export function RateNicButton({
  onRateClick,
}: {
  readonly onRateClick: () => void;
}) {
  return (
    <button
      onClick={onRateClick}
      className="tw-flex tw-flex-shrink-0 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-emerald-600 tw-bg-emerald-600 tw-px-3 tw-py-2 tw-text-xs tw-font-bold tw-text-white tw-transition tw-duration-300 tw-ease-out hover:tw-border-emerald-500 hover:tw-bg-emerald-500"
    >
      Rate NIC
    </button>
  );
}

export function RateNicInfo({
  userContribution,
}: {
  readonly userContribution: number;
}) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-emerald-500/20 tw-bg-emerald-500/5 tw-px-3 tw-py-2">
      <div className="tw-flex tw-items-center tw-gap-2">
        <FingerprintIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-emerald-400" />
        <span className="tw-text-xs tw-font-normal tw-text-iron-400">
          Your Rate
        </span>
      </div>
      <span
        className={`tw-text-sm tw-font-semibold ${
          userContribution >= 0 ? "tw-text-emerald-400" : "tw-text-rose-400"
        }`}
      >
        {formatNumberWithCommas(userContribution)}
      </span>
    </div>
  );
}
