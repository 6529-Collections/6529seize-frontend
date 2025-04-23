import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AuthContext, useAuth } from "../../components/auth/Auth";

const GradientsComponent = dynamic(
  () => import("../../components/6529Gradient/6529Gradient"),
  { ssr: false }
);

export default function GradientsPage() {
  const { setTitle, title } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "6529 Gradient | 6529.io",
    });
  }, []);

  const { connectedProfile } = useAuth();

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="6529 Gradient | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/6529-gradient`}
        />
        <meta property="og:title" content={`6529 Gradient`} />
        <meta property="og:description" content={`6529.io`} />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/gradients-preview.png`}
        />
      </Head>

      <main className={styles.main}>
        <GradientsComponent
          wallets={
            connectedProfile?.consolidation.wallets.map(
              (w) => w.wallet.address
            ) || []
          }
        />
      </main>
    </>
  );
}
