import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

type PublicReviewSurface = "reference" | "feedback";

export function PublicReviewSurfaceNavigation({
  action,
  activeSurface,
  feedbackHref,
  referenceHref,
  reviewHref,
}: {
  readonly action?: ReactNode | undefined;
  readonly activeSurface: PublicReviewSurface;
  readonly feedbackHref: string;
  readonly referenceHref: string;
  readonly reviewHref: string;
}) {
  const peerDestination =
    activeSurface === "reference"
      ? {
          href: feedbackHref,
          icon: ChatBubbleLeftRightIcon,
          label: t(DEFAULT_LOCALE, "publicReview.surface.feedback"),
        }
      : {
          href: referenceHref,
          icon: CodeBracketIcon,
          label: t(DEFAULT_LOCALE, "publicReview.surface.reference"),
        };
  const PeerDestinationIcon = peerDestination.icon;

  return (
    <div className="tw-mt-7 tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08] tw-pt-5">
      <div className="tw-min-w-0">
        <p className="tw-mb-2 tw-mt-0 tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
          {t(DEFAULT_LOCALE, "publicReview.surface.navigation")}
        </p>
        <nav
          aria-label={t(DEFAULT_LOCALE, "publicReview.surface.navigation")}
        >
          <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-x-6 tw-gap-y-1 tw-p-0">
            <li>
              <Link
                className="tw-group tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors tw-duration-150 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                href={reviewHref}
              >
                <ArrowLeftIcon
                  aria-hidden="true"
                  className="tw-size-4 tw-flex-none tw-text-iron-500 tw-transition-colors group-hover:tw-text-primary-300"
                />
                {t(DEFAULT_LOCALE, "publicReview.surface.backToReview")}
              </Link>
            </li>
            <li>
              <Link
                className="tw-group tw-inline-flex tw-min-h-11 tw-items-center tw-gap-2 tw-text-sm tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors tw-duration-150 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                href={peerDestination.href}
              >
                <PeerDestinationIcon
                  aria-hidden="true"
                  className="tw-size-4 tw-flex-none tw-text-iron-500 tw-transition-colors group-hover:tw-text-primary-300"
                />
                {peerDestination.label}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      {action === null || action === undefined ? null : (
        <div className="tw-ml-auto tw-flex tw-min-h-11 tw-items-center">
          {action}
        </div>
      )}
    </div>
  );
}
