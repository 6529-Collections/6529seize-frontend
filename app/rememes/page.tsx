import { getAppMetadata } from "@/components/providers/metadata";
import Rememes from "@/components/rememes/Rememes";
import { publicEnv } from "@/config/env";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default function ReMemesPage() {
  return (
    <main className={styles.main}>
      <Rememes />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "ReMemes",
    description: "Collections",
    ogImage: `${publicEnv.BASE_ENDPOINT}/re-memes-b.jpeg`,
  });
}
