import NotFoundPage from "@/components/explained/shell/NotFoundPage";
import { resolveExplainedLocale } from "@/lib/explained/locale.server";

/** No page at this address in chapter 01, in the chapter's own shell. */
export default async function TdhNotFound() {
  const locale = await resolveExplainedLocale({});
  return <NotFoundPage chapter="tdh" locale={locale} />;
}
