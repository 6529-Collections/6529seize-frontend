import NotFoundPage from "@/components/explained/shell/NotFoundPage";
import { resolveExplainedLocale } from "@/lib/explained/locale.server";

/** No page at this address in 6529 Explained, in its own shell. */
export default async function ExplainedNotFound() {
  const locale = await resolveExplainedLocale({});
  return <NotFoundPage chapter="hub" locale={locale} />;
}
