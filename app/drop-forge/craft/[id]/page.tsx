import { DROP_FORGE_TITLE } from "@/components/drop-forge/drop-forge.constants";
import DropForgeCraftClaimPageClient from "@/components/drop-forge/DropForgeCraftClaimPageClient";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DropForgeCraftClaimPage({
  params,
}: Readonly<Props>) {
  const { id } = await params;
  const claimId = Number.parseInt(id, 10);
  if (!Number.isFinite(claimId) || claimId < 0) {
    return (
      <main className={`${styles["main"]} tailwind-scope`}>
        <div className="tw-px-2 tw-pb-16 tw-pt-2 lg:tw-px-6 lg:tw-pt-8 xl:tw-px-8">
          <p className="tw-text-red-400">Invalid Claim ID</p>
        </div>
      </main>
    );
  }
  return (
    <main className={`${styles["main"]} tailwind-scope`}>
      <DropForgeCraftClaimPageClient claimId={claimId} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: Readonly<Props>): Promise<Metadata> {
  const { id } = await params;
  const claimId = Number.parseInt(id, 10);
  return getAppMetadata({
    title:
      Number.isFinite(claimId) && claimId >= 0
        ? `Claim #${claimId} | Craft Claims`
        : "Invalid Claim | Craft Claims",
    description: DROP_FORGE_TITLE,
  });
}
