"use client";

import styles from "@/styles/Home.module.scss";
import LabCollectionComponent from "@/components/memelab/MemeLabCollection";
import { useAuth } from "@/components/auth/Auth";
import { useSetTitle } from "@/contexts/TitleContext";

export default function LabCollectionClient({
  name,
}: {
  name: string;
}) {
  const { connectedProfile } = useAuth();
  const pagenameFull = `Collection ${name} | Meme Lab`;
  useSetTitle(pagenameFull);

  return (
    <main className={styles.main}>
      <LabCollectionComponent
        wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
      />
    </main>
  );
}
