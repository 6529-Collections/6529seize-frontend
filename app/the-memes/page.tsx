import { env } from "@/config/env";
import styles from "@/styles/Home.module.scss";

import { getAppMetadata } from "@/components/providers/metadata";
import TheMemesComponent from "@/components/the-memes/TheMemes";
import { Metadata } from "next";

export default function TheMemesPage() {
  return (
    <main className={styles.main}>
      <TheMemesComponent />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "The Memes",
    ogImage: `${env.BASE_ENDPOINT}/memes-preview.png`,
    description: "Collections",
    twitterCard: "summary_large_image",
  });
}
