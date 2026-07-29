import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

type PublicReviewSurface = "review" | "reference" | "feedback";

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
  const surfaces = [
    {
      href: reviewHref,
      icon: BookOpenIcon,
      id: "review",
      label: t(DEFAULT_LOCALE, "publicReview.surface.review"),
      shortLabel: t(DEFAULT_LOCALE, "publicReview.surface.review"),
    },
    {
      href: referenceHref,
      icon: CodeBracketIcon,
      id: "reference",
      label: t(DEFAULT_LOCALE, "publicReview.surface.reference"),
      shortLabel: t(DEFAULT_LOCALE, "publicReview.surface.referenceShort"),
    },
    {
      href: feedbackHref,
      icon: ChatBubbleLeftRightIcon,
      id: "feedback",
      label: t(DEFAULT_LOCALE, "publicReview.surface.feedback"),
      shortLabel: t(DEFAULT_LOCALE, "publicReview.surface.feedbackShort"),
    },
  ] as const;

  return (
    <div className="tw-mt-7 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
      <nav
        aria-label={t(DEFAULT_LOCALE, "publicReview.surface.navigation")}
        className="tw-w-full tw-min-w-0 tw-overflow-x-auto sm:tw-w-auto sm:tw-flex-1"
      >
        <ul className="tw-m-0 tw-flex tw-min-w-max tw-list-none tw-gap-1 tw-p-0 sm:tw-gap-2">
          {surfaces.map((surface) => {
            const isActive = surface.id === activeSurface;
            const SurfaceIcon = surface.icon;
            return (
              <li key={surface.id}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`tw-inline-flex tw-min-h-10 tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-lg tw-px-1.5 tw-text-xs tw-font-medium tw-tracking-[0.01em] tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-gap-2 sm:tw-px-3 sm:tw-text-sm ${
                    isActive
                      ? "tw-pointer-events-none tw-bg-white/[0.055] tw-text-iron-100 tw-shadow-[inset_0_0_0_1px_rgba(0,0,0,0.46),0_1px_2px_rgba(0,0,0,0.16)]"
                      : "tw-bg-transparent tw-text-iron-500 hover:tw-bg-white/[0.025] hover:tw-text-iron-200"
                  }`}
                  href={surface.href}
                >
                  <SurfaceIcon
                    aria-hidden="true"
                    className={`tw-size-3.5 tw-flex-none sm:tw-size-4 ${
                      isActive
                        ? "tw-text-iron-300"
                        : "tw-text-iron-600"
                    }`}
                  />
                  <span className="sm:tw-hidden">{surface.shortLabel}</span>
                  <span className="tw-hidden sm:tw-inline">
                    {surface.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {action === null || action === undefined ? null : (
        <div className="tw-ml-auto tw-flex tw-min-h-11 tw-items-center">
          {action}
        </div>
      )}
    </div>
  );
}
