import { Suspense } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import CompetitionRoute from "@/components/competitions/CompetitionRoute";
import { getAppMetadata } from "@/components/providers/metadata";

export const metadata = getAppMetadata(
  { title: t(DEFAULT_LOCALE, "competitions.metaTitle") },
  { robots: { index: false, follow: true } }
);
export default function CompetitionPage() {
  return (
    <Suspense fallback={null}>
      <CompetitionRoute />
    </Suspense>
  );
}
