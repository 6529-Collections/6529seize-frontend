import { DROP_CONTROL_TITLE } from "@/components/drop-control/drop-control.constants";
import DropControlLaunchClaimPageClient from "@/components/drop-control/DropControlLaunchClaimPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DropControlLaunchClaimPage({ params }: Props) {
  const { id } = await params;
  const memeId = parseInt(id, 10);
  if (!Number.isFinite(memeId) || memeId < 0) {
    return (
      <main className={`${styles["main"]} tailwind-scope`}>
        <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
          <p className="tw-text-red-400">Invalid claim ID</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles["main"]} tailwind-scope`}>
      <DropControlLaunchClaimPageClient memeId={memeId} />
    </main>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return getAppMetadata({
    title: `Claim #${id} | Launch Drops`,
    description: DROP_CONTROL_TITLE,
  });
}
