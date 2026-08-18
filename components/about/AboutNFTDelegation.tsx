import Link from "next/link";
import { ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS } from "./AboutLayout";

export default function AboutNFTDelegation() {
  return (
    <article
      className={`tw-w-full tw-pb-24 tw-text-iron-100 ${ABOUT_MOBILE_COLUMN_GUTTER_BREAKOUT_CLASS}`}
    >
      <header className="tw-min-h-72 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-1 tw-pb-16 tw-pt-4 sm:tw-px-2 sm:tw-pb-20 sm:tw-pt-8">
        <div className="tw-max-w-4xl">
          <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
            NFT Delegation
          </h1>
          <p className="tw-m-0 tw-mt-6 tw-text-pretty tw-text-base tw-leading-7 tw-text-iron-200">
            Visit our{" "}
            <Link
              className="hover:tw-text-primary-200 tw-rounded-sm tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-400/50 tw-underline-offset-4 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              href="/delegation/delegation-center"
            >
              Delegation Center
            </Link>{" "}
            to get started
          </p>
        </div>
      </header>
    </article>
  );
}
