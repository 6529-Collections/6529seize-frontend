"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getCompetitionsRoute,
  isMultiCompetitionEnabled,
} from "@/helpers/competition.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CompetitionDiscoveryLink({
  waveId,
}: {
  readonly waveId: string;
}) {
  const locale = useBrowserLocale();
  const pathname = usePathname();
  if (!isMultiCompetitionEnabled() || pathname.startsWith("/messages"))
    return null;
  return (
    <Link
      href={getCompetitionsRoute(waveId)}
      className="hover:tw-text-primary-200 tw-block tw-border-b tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      {t(locale, "competitions.title")}
    </Link>
  );
}
