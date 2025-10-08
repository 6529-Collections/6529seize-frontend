import { InfoTooltip } from "./InfoTooltip";
import { MULTIPLIER_MILESTONES, NEXT_MULTIPLIER_EVENT } from "./constants";
import { formatMultiplierDisplay } from "./utils";

interface CurrentMultiplierCardProps {
  readonly multiplier: number;
}

export function CurrentMultiplierCard({
  multiplier,
}: Readonly<CurrentMultiplierCardProps>) {
  const multiplierDisplay = formatMultiplierDisplay(multiplier);
  const percentDisplay = `${Math.round(multiplier * 100)}% of Base TDH`;

  return (
    <section
      className="tw-rounded-2xl tw-border tw-border-primary-500/40 tw-bg-primary-500/10 tw-p-6 tw-text-iron-50 tw-shadow-inner tw-shadow-primary-900/20"
      role="region"
      aria-label="Current xTDH Multiplier"
    >
      <div className="tw-flex tw-flex-col tw-gap-6 md:tw-flex-row md:tw-justify-between">
        <div className="tw-space-y-3">
          <div className="tw-flex tw-items-center tw-gap-2">
            <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-200">
              Current Multiplier
            </p>
            <InfoTooltip
              ariaLabel="Explain the xTDH multiplier"
              tooltip={
                <div className="tw-space-y-2 tw-text-left">
                  <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50">
                    Understanding the multiplier
                  </p>
                  <p className="tw-m-0 tw-text-xs tw-text-iron-200">
                    xTDH equals your Base TDH rate multiplied by the current
                    network multiplier.
                  </p>
                  <ul className="tw-m-0 tw-list-disc tw-space-y-1 tw-pl-4 tw-text-xs tw-text-iron-200">
                    <li>
                      Current: {multiplierDisplay} ({percentDisplay})
                    </li>
                    <li>
                      {NEXT_MULTIPLIER_EVENT.label}:{" "}
                      {formatMultiplierDisplay(NEXT_MULTIPLIER_EVENT.value)}
                    </li>
                    <li>{MULTIPLIER_MILESTONES[0]}</li>
                    <li>{MULTIPLIER_MILESTONES[1]}</li>
                  </ul>
                  <p className="tw-m-0 tw-text-xs tw-text-iron-200">
                    xTDH auto-accrues unless you allocate it elsewhere.
                  </p>
                </div>
              }
            />
          </div>
          <div>
            <p className="tw-m-0 tw-text-3xl tw-font-semibold tw-text-primary-100">
              {multiplierDisplay}
            </p>
            <p className="tw-m-0 tw-text-sm tw-text-primary-100">{percentDisplay}</p>
          </div>
        </div>
        <div className="tw-max-w-xl tw-space-y-2 tw-text-sm tw-text-primary-100">
          <p className="tw-m-0">
            This multiplier determines how much xTDH capacity you have available
            to allocate. Your xTDH capacity = Base TDH × Current Multiplier.
          </p>
          <p className="tw-m-0">
            Next increase: {NEXT_MULTIPLIER_EVENT.label} to{" "}
            {formatMultiplierDisplay(NEXT_MULTIPLIER_EVENT.value)}.
          </p>
          <p className="tw-m-0 tw-text-primary-200">
            Long-term milestones: {MULTIPLIER_MILESTONES[0]} • {MULTIPLIER_MILESTONES[1]}
          </p>
        </div>
      </div>
    </section>
  );
}
