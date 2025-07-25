"use client";

import styles from "@/styles/Home.module.scss";
import LabPageComponent from "@/components/memelab/MemeLabPage";
import { useAuth } from "@/components/auth/Auth";

export default function MemeLabPageClient({
  nftId,
}: {
  nftId: string;
}) {
  const { connectedProfile } = useAuth();

  return (
    <main className={styles.main}>
      <LabPageComponent
        wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
      />
    </main>
  );
}
