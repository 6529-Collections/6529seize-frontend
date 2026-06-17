import { getAppMetadata } from "@/components/providers/metadata";
import Rememes from "@/components/rememes/Rememes";
import {
  getInitialRememesMemeId,
  getRememesBrowseQuery,
  getRememesRouteLocale,
  shouldNormalizeRememesMemeId,
  type RememesSearchParams,
} from "@/components/rememes/rememesRouteParams";
import { publicEnv } from "@/config/env";
import { t } from "@/i18n/messages";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export default async function ReMemesPage({
  searchParams,
}: {
  readonly searchParams: Promise<RememesSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const locale = getRememesRouteLocale(resolvedSearchParams);
  const initialMemeId = getInitialRememesMemeId(resolvedSearchParams);

  if (shouldNormalizeRememesMemeId(resolvedSearchParams)) {
    const nextQuery = getRememesBrowseQuery({
      locale,
      memeId: initialMemeId,
      searchParams: resolvedSearchParams,
    });
    redirect(nextQuery ? `/rememes?${nextQuery}` : "/rememes");
  }

  return (
    <main className={styles["main"]}>
      <Rememes
        initialMemeId={initialMemeId}
        locale={locale}
        searchParams={resolvedSearchParams}
      />
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  readonly searchParams: Promise<RememesSearchParams>;
}): Promise<Metadata> {
  const locale = getRememesRouteLocale(await searchParams);

  return getAppMetadata({
    title: t(locale, "rememes.title"),
    description: t(locale, "rememes.description.collections"),
    ogImage: `${publicEnv.BASE_ENDPOINT}/re-memes-b.jpeg`,
  });
}
