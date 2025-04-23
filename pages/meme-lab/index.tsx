import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { useContext, useEffect} from "react";
import dynamic from "next/dynamic";
import { AuthContext, useAuth } from "../../components/auth/Auth";

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

  const { connectedProfile } = useAuth();

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
        <MemeLabComponent
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
