import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { getSharedServerSideProps } from "../../../components/the-memes/MemeShared";
import { MEMELAB_CONTRACT } from "../../../constants";
import { useAuth } from "../../../components/auth/Auth";

const LabPageComponent = dynamic(
  () => import("../../../components/memelab/MemeLabPage"),
  {
    ssr: false,
  }
);

export default function MemeLabPage() {
  const { connectedProfile } = useAuth();

  return (
    <main className={styles.main}>
      <LabPageComponent
        wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
      />
    </main>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return getSharedServerSideProps(req, MEMELAB_CONTRACT);
}
