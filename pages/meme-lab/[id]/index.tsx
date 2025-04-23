import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import {
  SharedHead,
  getSharedServerSideProps,
} from "../../../components/the-memes/MemeShared";
import { MEMELAB_CONTRACT } from "../../../constants";
import { useAuth } from "../../../components/auth/Auth";

const LabPageComponent = dynamic(
  () => import("../../../components/memelab/MemeLabPage"),
  {
    ssr: false,
  }
);

export default function MemeLabPage(props: any) {
  const pageProps = props.pageProps;
  const { connectedProfile } = useAuth();

  return (
    <>
      <SharedHead props={pageProps} contract={MEMELAB_CONTRACT} />
      <main className={styles.main}>
        <LabPageComponent
          wallets={
            connectedProfile?.consolidation.wallets.map(
              (w) => w.wallet.address
            ) ?? []
          }
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return getSharedServerSideProps(req, MEMELAB_CONTRACT);
}
