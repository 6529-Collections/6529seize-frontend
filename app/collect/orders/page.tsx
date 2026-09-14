import CollectOrdersClient from "@/components/collect/CollectOrdersClient";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "collect.orders"),
  description: t(DEFAULT_LOCALE, "collect.orders.description"),
});
export default async function CollectOrdersPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const operationId =
    typeof query["operation"] === "string" &&
    /^[\da-f-]{36}$/i.test(query["operation"])
      ? query["operation"]
      : undefined;
  return (
    <CollectOrdersClient
      initialOperationId={operationId}
      initialBatch={query["kind"] === "BUY_BATCH"}
    />
  );
}
