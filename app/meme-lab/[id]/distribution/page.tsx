import styles from "@/styles/Home.module.scss";

import { MEMELAB_CONTRACT } from "@/constants";
import {
  getSharedAppServerSideProps,
  MEME_FOCUS,
} from "@/components/the-memes/MemeShared";
import DistributionComponent from "@/components/distribution/Distribution";
import { Metadata } from "next";

export default function MemeLabDistributionPage() {
  return (
    <main className={styles.main}>
      <DistributionComponent
        header="Meme Lab"
        contract={MEMELAB_CONTRACT}
        link="/meme-lab"
      />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return getSharedAppServerSideProps(
    MEMELAB_CONTRACT,
    id,
    MEME_FOCUS.LIVE,
    true
  );
}

