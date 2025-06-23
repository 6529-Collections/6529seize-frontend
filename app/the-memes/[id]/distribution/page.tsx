import styles from "@/styles/Home.module.scss";

import { MEMES_CONTRACT } from "@/constants";
import {
  getSharedAppServerSideProps,
  MEME_FOCUS,
} from "@/components/the-memes/MemeShared";
import DistributionComponent from "@/components/distribution/Distribution";
import { Metadata } from "next";

export default function MemeDistributionPage() {
  return (
    <main className={styles.main}>
      <DistributionComponent
        header="The Memes"
        contract={MEMES_CONTRACT}
        link="/the-memes"
      />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return getSharedAppServerSideProps(MEMES_CONTRACT, id, MEME_FOCUS.LIVE, true);
}
