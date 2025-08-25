import styles from "@/styles/Home.module.scss";
import LabCollectionComponent from "@/components/memelab/MemeLabCollection";
import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";
import { useAuth } from "@/components/auth/Auth";

function MemeLabCollectionClient() {
  "use client";
  const { connectedProfile } = useAuth();
  return (
    <LabCollectionComponent
      wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
    />
  );
}

export default function MemeLabCollectionPage() {
  return (
    <main className={styles.main}>
      <MemeLabCollectionClient />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  const name = collection.replaceAll("-", " ");
  return getAppMetadata({ title: name, description: "Meme Lab" });
}

