import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { useState } from "react";
import {
  SharedHead,
  getSharedServerSideProps,
} from "../../../components/the-memes/MemeShared";
import { MEMELAB_CONTRACT } from "../../../constants";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const LabPageComponent = dynamic(
  () => import("../../../components/memelab/MemeLabPage"),
  {
    ssr: false,
  }
);

export default function MemeLabPage(props: any) {
  const pageProps = props.pageProps;
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  return (
    <>
      <SharedHead props={pageProps} contract={MEMELAB_CONTRACT} />
      <main className={styles.main}>
        <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
        <LabPageComponent wallets={connectedWallets} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return getSharedServerSideProps(req, MEMELAB_CONTRACT);
}
