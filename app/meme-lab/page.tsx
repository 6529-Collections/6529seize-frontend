import styles from "@/styles/Home.module.scss";
import MemeLabComponent from "@/components/memelab/MemeLab";
import { getAppMetadata } from "@/components/providers/metadata";
import { Metadata } from "next";
import { useAuth } from "@/components/auth/Auth";

function MemeLabClient() {
  "use client";
  const { connectedProfile } = useAuth();
  return (
    <MemeLabComponent
      wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
    />
  );
}

export default function MemeLabPage() {
  return (
    <main className={styles.main}>
      <MemeLabClient />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Meme Lab",
    ogImage: `${process.env.BASE_ENDPOINT}/meme-lab.jpg`,
    description: "Collections",
  });
}

