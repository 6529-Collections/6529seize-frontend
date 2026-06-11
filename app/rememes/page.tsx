import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import Rememes from "@/components/rememes/Rememes";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default function ReMemesPage() {
  return (
    <main className={styles["main"]}>
      <Rememes />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: "ReMemes",
      description: "Collections",
      ogImage: getCollectionSocialCardImagePath("rememes"),
      ogImageAlt: "ReMemes collection social card",
    })
  );
}
