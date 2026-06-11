import MemeLabComponent from "@/components/memelab/MemeLab";
import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default function MemeLab() {
  return (
    <main className={styles["main"]}>
      <MemeLabComponent />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: "Meme Lab",
      ogImage: getCollectionSocialCardImagePath("meme-lab"),
      ogImageAlt: "Meme Lab collection social card",
      description: "Collections",
    })
  );
}
