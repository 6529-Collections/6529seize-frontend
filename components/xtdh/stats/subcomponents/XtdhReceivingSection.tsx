import type { XtdhReceivingProps } from "../types";

export function XtdhReceivingSection({
  rate,
  totalReceived,
  totalGranted,
}: Readonly<XtdhReceivingProps>) {
  return (
    <section
      aria-labelledby="xtdh-receiving-heading"
      className="tw-mt-5"
    >
      <h2 id="xtdh-receiving-heading" className="tw-sr-only">
        Receiving from Others
      </h2>
      <p
        className="tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-text-iron-300"
        title="Your current incoming xTDH rate from other holders"
      >
        Receiving from Others
      </p>
      <p className="tw-text-sm tw-text-iron-200">
        <span className="tw-font-semibold">{rate}</span>
        {" per day"}
        <span className="tw-text-iron-400"> • </span>
        <span className="tw-font-semibold">{totalReceived}</span>
        {" total xTDH received"}
      </p>
      <p className="tw-mt-1 tw-text-xs tw-text-iron-400">
        Total granted:{" "}
        <span className="tw-font-semibold tw-text-iron-200">
          {totalGranted}
        </span>
      </p>
    </section>
  );
}
