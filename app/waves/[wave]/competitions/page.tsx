import { Suspense } from "react";
import CompetitionRoute from "@/components/competitions/CompetitionRoute";
import { getAppMetadata } from "@/components/providers/metadata";

export const metadata = getAppMetadata(
  { title: "Competitions | Waves" },
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
