import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { AuthContext } from "../../components/auth/Auth";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const MemeLabComponent = dynamic(
  () => import("../../components/memelab/MemeLab"),
  { ssr: false }
);

export default function MemeLab() {
  const { setTitle, title } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Meme Lab | 6529.io",
    });
  }, [setTitle]);

  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Meme Lab | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/meme-lab`}
        />
        <meta property="og:title" content="Meme Lab" />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/meme-lab.jpg`}
        />
      </Head>

      <main className={styles.main}>
        <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
        <MemeLabComponent wallets={connectedWallets} />
      </main>
    </>
  );
}
