import MemeLabComponent from "@/components/memelab/MemeLab";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import { Metadata } from "next";

function MemeLabClient() {
  return <MemeLabComponent />;
}

export default function MemeLabPage() {
  return (
    <main className={styles.main}>
      <MemeLabClient />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Meme Lab",
    ogImage: `${process.env.BASE_ENDPOINT}/meme-lab.jpg`,
    description: "Collections",
  });
}
