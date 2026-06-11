import styles from "@/styles/Home.module.scss";

import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import TheMemesComponent from "@/components/the-memes/TheMemes";
import type { Metadata } from "next";

export default function TheMemesPage() {
  return (
    <main className={styles["main"]}>
      <TheMemesComponent />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: "The Memes",
      ogImage: getCollectionSocialCardImagePath("the-memes"),
      ogImageAlt: "The Memes collection social card",
      description: "Collections",
    })
  );
}
