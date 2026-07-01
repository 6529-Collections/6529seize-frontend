import MemesMintingCalendar from "@/components/meme-calendar/MemesMintingCalendar";
import { getAppMetadata } from "@/components/providers/metadata";
import { normalizeLocale } from "@/i18n/locales";
import type { Metadata } from "next";

type MemeCalendarPageSearchParams = Promise<{
  readonly locale?: string | string[] | undefined;
}>;

const PAGE_CONTAINER_CLASS_NAME =
  "tw-mx-auto tw-w-full tw-px-3 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]";

export async function generateMetadata(): Promise<Metadata> {
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
    <div className={`${PAGE_CONTAINER_CLASS_NAME} tw-pb-8 tw-pt-6`}>
      <div className="-tw-mx-3 tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-min-w-0 tw-flex-1 tw-px-3">
          <MemesMintingCalendar locale={resolvedLocale} />
        </div>
      </div>
    </div>
  );
}
