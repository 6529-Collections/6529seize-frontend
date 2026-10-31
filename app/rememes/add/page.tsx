import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import RememeAddPage from "@/components/rememes/RememeAddPage";
import styles from "@/styles/Home.module.css";
import type { Metadata } from "next";

export default function ReMemesAddPage() {
  return (
    <main className={`${styles["main"]} tailwind-scope`}>
      <RememeAddPage />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata(
    getLargeSocialCardMetadata({
      title: "Add ReMemes | Collections",
      description: "Collections",
      ogImage: getCollectionSocialCardImagePath("rememes", {
        variant: "add",
      }),
      ogImageAlt: "Add ReMeme social card",
    })
  );
}
