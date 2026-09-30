import { Suspense } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import CompetitionRoute from "@/components/competitions/CompetitionRoute";
import { getAppMetadata } from "@/components/providers/metadata";

export const metadata = getAppMetadata(
  { title: t(DEFAULT_LOCALE, "competitions.collectionMetaTitle") },
  { robots: { index: false, follow: true } }
);
export default async function CompetitionsPage({
  params,
}: {
  readonly params: Promise<{ wave: string }>;
}) {
  const { wave } = await params;
  return (
    <Suspense fallback={null}>
      <CompetitionRoute waveId={wave} />
    </Suspense>
  );
}
