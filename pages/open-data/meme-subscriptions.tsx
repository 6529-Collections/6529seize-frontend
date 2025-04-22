import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../components/auth/Auth";

const CommunityDownloadsSubscriptions = dynamic(
  () =>
    import(
      "../../components/communityDownloads/CommunityDownloadsSubscriptions"
    ),
  {
    ssr: false,
  }
);

export default function MemeSubscriptions() {
  const { setTitle, title } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "Meme Subscriptions Downloads | 6529.io",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Meme Subscriptions Downloads | 6529.io"
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/open-data/meme-subscriptions`}
        />
        <meta property="og:title" content={`Meme Subscriptions Downloads`} />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <main className={styles.main}>
        <CommunityDownloadsSubscriptions />
      </main>
    </>
  );
}
