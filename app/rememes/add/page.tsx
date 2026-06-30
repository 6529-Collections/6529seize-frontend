import {
  getAppMetadata,
  getCollectionSocialCardImagePath,
  getLargeSocialCardMetadata,
} from "@/components/providers/metadata";
import RememeAddPage from "@/components/rememes/RememeAddPage";
import styles from "@/styles/Home.module.scss";
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
      title: "ReMemes | Add",
      description: "Collections",
      ogImage: getCollectionSocialCardImagePath("rememes", {
        subtitle: "Submit a community remix or derivative",
        title: "Add a ReMeme",
      }),
      ogImageAlt: "Add ReMeme social card",
    })
  );
}
