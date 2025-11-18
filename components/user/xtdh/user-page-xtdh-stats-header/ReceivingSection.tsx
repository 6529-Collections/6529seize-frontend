import type { ReceivingSectionProps } from "./types";

export function ReceivingSection({
  receiving,
}: Readonly<ReceivingSectionProps>) {
  return (
    <section
      aria-label="Receiving Metrics"
      className="tw-mt-5"
    >
      <p
        className="tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-text-iron-300"
        title="Your current incoming xTDH rate from other holders"
      >
        Receiving from Others
      </p>
      <p className="tw-text-sm tw-text-iron-200">
        <span className="tw-font-semibold">{receiving.rateDisplay}</span>
        {"/day rate"}
        <span className="tw-text-iron-400"> • </span>
        <span className="tw-font-semibold">{receiving.totalReceivedDisplay}</span>
        {" total received"}
      </p>
      <p className="tw-mt-1 tw-text-xs tw-text-iron-400">
        Total granted:{" "}
        <span className="tw-font-semibold tw-text-iron-200">
          {receiving.totalGrantedDisplay}
        </span>
      </p>
    </section>
  );
}
