import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { MEMES_CONTRACT } from "../../../constants";
import { getSharedServerSideProps } from "../../../components/the-memes/MemeShared";

const DistributionComponent = dynamic(
  () => import("../../../components/distribution/Distribution"),
  {
    ssr: false,
  }
);

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

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return getSharedServerSideProps(req, MEMES_CONTRACT, true);
}
