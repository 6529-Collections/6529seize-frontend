import Head from "next/head";
import styles from "../styles/Home.module.scss";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import { AuthContext } from "../components/auth/Auth";
import { useContext, useEffect } from "react";

const Gas = dynamic(() => import("../components/gas-royalties/Gas"), {
  ssr: false,
});

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function GasPage() {
  const { setTitle, title } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "Meme Gas | 6529.io",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Meme Gas | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/meme-gas`}
        />
        <meta property="og:title" content="Meme Gas" />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Gas />
      </main>
    </>
  );
}
