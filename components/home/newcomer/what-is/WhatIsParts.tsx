import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";
import { HOME_ACTION_ARROW_CLASSES } from "../../homeInteractionStyles";

export const MAIN_STAGE_HREF = "/waves/b6128077-ea78-4dd9-b381-52c4eadb2077";

export function WhatIsSection({
  title,
  lead,
  children,
}: {
  readonly title: string;
  readonly lead: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section
      aria-labelledby="home-what-is-title"
      data-home-section="What is 6529?"
      className="tw-px-4 tw-pb-20 tw-pt-10 md:tw-px-6 md:tw-pb-24 md:tw-pt-16 lg:tw-px-8 lg:tw-pb-32 lg:tw-pt-12"
    >
      <div className="tw-mx-auto tw-max-w-[1200px]">
        <div className="tw-mb-10 md:tw-mb-14">
          <h2
            id="home-what-is-title"
            className="tw-m-0 tw-text-[28px] tw-font-semibold tw-leading-[1.17] tw-tracking-[-0.04em] tw-text-iron-50 md:tw-text-[38px] md:tw-leading-[1.14]"
          >
            {title}
          </h2>
          <p className="tw-mb-0 tw-mt-4 tw-max-w-[680px] tw-text-[17px] tw-leading-[1.6] tw-text-iron-300 md:tw-mt-5 md:tw-text-xl md:tw-leading-[1.55]">
            {lead}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}

export function WhatIsLink({
  href,
  trackingAction,
  children,
}: {
  readonly href: string;
  readonly trackingAction: string;
  readonly children: ReactNode;
}) {
  return (
    <Link
      href={href}
      data-home-action={trackingAction}
      className="tw-group/action tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-sm tw-text-xs tw-font-medium tw-leading-relaxed tw-text-iron-200 tw-no-underline tw-transition-colors tw-duration-200 focus-visible:tw-text-white focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-4 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none md:tw-min-h-8 md:tw-text-[13px]"
    >
      <span className="tw-underline tw-decoration-iron-600 tw-decoration-1 tw-underline-offset-[5px]">
        {children}
      </span>
      <ArrowRightIcon className={HOME_ACTION_ARROW_CLASSES} aria-hidden />
    </Link>
  );
}
