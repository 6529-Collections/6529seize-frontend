import Head from "next/head";
import styles from "../../styles/Home.module.scss";

import { useContext, useEffect } from "react";
import dynamic from "next/dynamic";
import { AuthContext } from "../../components/auth/Auth";


const TheMemesComponent = dynamic(
  () => import("../../components/the-memes/TheMemes"),
  { ssr: false }
);

export default function TheMemesPage() {
  const { setTitle, title } = useContext(AuthContext);

  useEffect(() => {
    setTitle({
      title: "The Memes | 6529.io",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="The Memes | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/the-memes`}
        />
        <meta property="og:title" content="The Memes" />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/memes-preview.png`}
        />
      </Head>

      <main className={styles.main}>
        <TheMemesComponent />
      </main>
    </>
  );
}
