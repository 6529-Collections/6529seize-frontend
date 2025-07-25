"use client";

import styles from "@/styles/Home.module.scss";
import MemeLabComponent from "@/components/memelab/MemeLab";
import { useSetTitle } from "@/contexts/TitleContext";
import { useAuth } from "@/components/auth/Auth";

export default function MemeLabPageClient() {
  useSetTitle("Meme Lab | Collections");
  const { connectedProfile } = useAuth();

  return (
    <main className={styles.main}>
      <MemeLabComponent
        wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
      />
    </main>
  );
}
