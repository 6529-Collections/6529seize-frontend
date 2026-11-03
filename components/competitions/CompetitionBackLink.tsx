"use client";

import { ArrowUpLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getCompetitionsRoute } from "@/helpers/competition.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CompetitionBackLink({
  waveId,
}: {
  readonly waveId: string;
}) {
  const locale = useBrowserLocale();
  return (
    <Link
      href={getCompetitionsRoute(waveId)}
      className="hover:tw-text-primary-200 tw-inline-flex tw-min-h-6 tw-items-center tw-gap-x-1 tw-text-xs tw-font-medium tw-leading-4 tw-text-primary-300 tw-no-underline tw-transition-colors hover:tw-no-underline focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
    >
      <ArrowUpLeftIcon aria-hidden="true" className="tw-size-3.5 tw-shrink-0" />
      <span>{t(locale, "competitions.back")}</span>
    </Link>
  );
}
