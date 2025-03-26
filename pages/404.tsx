import Head from "next/head";
import styles from "../styles/Home.module.scss";
import dynamic from "next/dynamic";
import Image from "next/image";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";
import { useContext, useEffect } from "react";
import { AuthContext } from "../components/auth/Auth";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function Seize404() {
  const { setTitle, title } = useContext(AuthContext);
  useEffect(() => {
    setTitle({
      title: "NOT FOUND | 6529.io",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="404 NOT FOUND | 6529.io" />
        <meta property="og:url" content={`${process.env.BASE_ENDPOINT}/404`} />
        <meta property="og:title" content="404 NOT FOUND" />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <div className={styles.pageNotFound}>
          <Image
            width="0"
            height="0"
            style={{ height: "auto", width: "100px" }}
            src="/SummerGlasses.svg"
            alt="SummerGlasses"
          />
          <h2>404 | PAGE NOT FOUND</h2>
          <a href="/" className="pt-3">
            TAKE ME HOME
          </a>
        </div>
      </main>
    </>
  );
}
