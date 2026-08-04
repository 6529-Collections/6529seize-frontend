import MemesMintingCalendar from "@/components/meme-calendar/MemesMintingCalendar";
import { getAppMetadata } from "@/components/providers/metadata";
import { normalizeLocale } from "@/i18n/locales";
import type { Metadata } from "next";

type MemeCalendarPageSearchParams = Promise<{
  readonly locale?: string | string[] | undefined;
}>;

const PAGE_CONTAINER_CLASS_NAME = "tw-w-full tw-px-4 sm:tw-px-8";

export function generateMetadata(): Metadata {
  return getAppMetadata({ title: "Memes Minting Calendar" });
}

function getFirstSearchParamValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MemesMintingCalendarPage({
  searchParams,
}: {
  readonly searchParams: MemeCalendarPageSearchParams;
}) {
  const { locale } = await searchParams;
  const resolvedLocale = normalizeLocale(getFirstSearchParamValue(locale));

  return (
    <div className="tailwind-scope tw-min-h-screen tw-overflow-x-hidden tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-700">
      <div className={`${PAGE_CONTAINER_CLASS_NAME} tw-pb-8 tw-pt-6`}>
        <MemesMintingCalendar locale={resolvedLocale} />
      </div>
    </div>
  );
}
