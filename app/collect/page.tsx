import CollectPageClient from "@/components/collect/CollectPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { Suspense } from "react";

export const metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "collect.title"),
  description: t(DEFAULT_LOCALE, "collect.description"),
});

export default function CollectPage() {
  return (
    <Suspense
      fallback={
        <div role="status" className="tw-p-6 tw-text-iron-300">
          {t(DEFAULT_LOCALE, "collect.loading")}
        </div>
      }
    >
      <CollectPageClient />
    </Suspense>
  );
}
