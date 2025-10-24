import Link from "next/link";

import { OVERVIEW_CARD_CLASS } from "./constants";

export function SummaryActionsCard() {
  return (
    <section
      className={`${OVERVIEW_CARD_CLASS} !tw-p-4 md:!tw-p-5`}
      role="region"
      aria-label="Summary and actions"
    >
      <div className="tw-flex tw-h-full tw-flex-col tw-gap-3">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-200">
          Summary &amp; Actions
        </p>
        <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-leading-relaxed">
          Keep your allocations moving to sustain growth, then spot-check your xTDH routes before the next jump.
        </p>
        <div className="tw-mt-auto tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-font-semibold">
          <Link
            href="/xtdh/me"
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-iron-50 tw-transition hover:tw-bg-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
          >
            View my xTDH
          </Link>
          <Link
            href="/docs/xtdh"
            className="tw-inline-flex tw-items-center tw-justify-start tw-rounded-lg tw-bg-transparent tw-px-2 tw-py-1 tw-text-primary-300 tw-transition hover:tw-text-primary-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
          >
            Explore xTDH docs
          </Link>
        </div>
      </div>
    </section>
  );
}
