import MemeLabComponent from "@/components/memelab/MemeLab";
import { getAppMetadata } from "@/components/providers/metadata";
import { publicEnv } from "@/config/env";
import styles from "@/styles/Home.module.scss";
import { Metadata } from "next";

export default function MemeLab() {
  return (
    <main className={styles.main}>
      <MemeLabComponent />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Meme Lab",
    ogImage: `${publicEnv.BASE_ENDPOINT}/meme-lab.jpg`,
    description: "Collections",
    twitterCard: "summary_large_image",
  });
}
