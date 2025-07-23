import styles from "@/styles/Home.module.css";
import RememeAddPage from "@/components/rememes/RememeAddPage";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function ReMemesAddPage() {
  return (
    <main className={styles.main}>
      <RememeAddPage />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "ReMemes | Add",
    description: "Collections",
    ogImage: `${process.env.BASE_ENDPOINT}/re-memes-b.jpeg`,
  });
}
