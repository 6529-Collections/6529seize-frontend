import { kt } from "@/components/explained/i18n";
import NotFoundPage from "@/components/explained/shell/NotFoundPage";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import {
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";

/**
 * The chapter's not-found view as a page: the proxy rewrites an address
 * under /network/tdh that names no page here, with a real 404 status
 * (lib/proxy/tdhChapterPaths.ts). As a page it is rendered on the server,
 * so the view is in the HTML itself; the chapter's not-found.tsx, which a
 * client navigation reaches, renders the same view.
 */
export const dynamic = "force-dynamic";

export default async function TdhNotFoundView({
  searchParams,
}: {
  readonly searchParams: Promise<ExplainedParams>;
}) {
  const locale = await resolveExplainedLocale(await searchParams);
  return <NotFoundPage chapter="tdh" locale={locale} />;
}

export function generateMetadata() {
  return getAppMetadata(
    {
      title: kt(DEFAULT_LOCALE, "explained.kit.notFound.metaTitle"),
      description: kt(DEFAULT_LOCALE, "explained.kit.notFound.title"),
    },
    { robots: { index: false, follow: true } }
  );
}
