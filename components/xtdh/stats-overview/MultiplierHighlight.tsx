import { InfoTooltip } from "./InfoTooltip";
import { MULTIPLIER_MILESTONES, NEXT_MULTIPLIER_EVENT } from "./constants";
import { formatMultiplierDisplay } from "./utils";

interface MultiplierHighlightProps {
  readonly multiplier: number;
}

export function MultiplierHighlight({
  multiplier,
}: Readonly<MultiplierHighlightProps>) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-primary-500/30 tw-bg-primary-500/10 tw-p-4 tw-shadow-inner tw-shadow-primary-900/30">
      <div className="tw-flex tw-flex-col tw-gap-3">
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
                  Fluid xTDH equals your Base TDH rate multiplied by the current
                  network multiplier.
                </p>
                <ul className="tw-m-0 tw-list-disc tw-space-y-1 tw-pl-4 tw-text-xs tw-text-iron-200">
                  <li>
                    Current: {formatMultiplierDisplay(multiplier)} (
                    {Math.round(multiplier * 100)}%)
                  </li>
                  <li>
                    {NEXT_MULTIPLIER_EVENT.label}:{" "}
                    {formatMultiplierDisplay(NEXT_MULTIPLIER_EVENT.value)}
                  </li>
                  <li>{MULTIPLIER_MILESTONES[0]}</li>
                  <li>{MULTIPLIER_MILESTONES[1]}</li>
                </ul>
                <p className="tw-m-0 tw-text-xs tw-text-iron-200">
                  Fluid xTDH auto-accrues unless you allocate it elsewhere.
                </p>
              </div>
            }
          />
        </div>
        <div>
          <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-primary-100">
            {formatMultiplierDisplay(multiplier)}
          </p>
          <p className="tw-m-0 tw-text-sm tw-text-primary-100">
            {Math.round(multiplier * 100)}% of Base TDH
          </p>
        </div>
      </div>
    </div>
  );
}
