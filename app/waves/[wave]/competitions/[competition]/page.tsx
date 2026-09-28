import { Suspense } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import CompetitionRoute from "@/components/competitions/CompetitionRoute";
import { getAppMetadata } from "@/components/providers/metadata";

export const metadata = getAppMetadata(
  { title: t(DEFAULT_LOCALE, "competitions.metaTitle") },
  { robots: { index: false, follow: true } }
);
export default async function CompetitionPage({
  params,
}: {
  readonly params: Promise<{ wave: string; competition: string }>;
}) {
  const { wave, competition } = await params;
  return (
    <Suspense fallback={null}>
      <CompetitionRoute waveId={wave} competitionId={competition} />
    </Suspense>
  );
}
