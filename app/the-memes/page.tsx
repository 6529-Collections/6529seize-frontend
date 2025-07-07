import styles from "@/styles/Home.module.scss";

import React from "react";
import { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import TheMemesComponent from "@/components/the-memes/TheMemes";

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
    ogImage: `${process.env.BASE_ENDPOINT}/memes-preview.png`,
    description: "Collections",
    twitterCard: "summary_large_image",
  });
}
