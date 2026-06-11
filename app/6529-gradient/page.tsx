import GradientsComponent from "@/components/6529Gradient/6529Gradient";
import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import type { Metadata } from "next";

export default function GradientsPage() {
  return (
    <main className={styles["main"]}>
      <GradientsComponent />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: "6529 Gradient",
      description: "Collections",
      ogImage: getCollectionSocialCardImagePath("6529-gradient"),
      ogImageAlt: "6529 Gradient collection social card",
    })
  );
}
