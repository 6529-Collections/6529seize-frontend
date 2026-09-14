import CollectOrdersClient from "@/components/collect/CollectOrdersClient";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "collect.orders"),
  description: t(DEFAULT_LOCALE, "collect.orders.description"),
});
export default function CollectOrdersPage() {
  return <CollectOrdersClient />;
}
