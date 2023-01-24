import Head from "next/head";
import styles from "../styles/Home.module.scss";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
});

export default function Seize404() {
  return (
    <>
      <Head>
        <title>NOT FOUND | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="404 NOT FOUND | 6529 SEIZE" />
        <meta property="og:url" content={`${process.env.BASE_ENDPOINT}/404`} />
        <meta property="og:title" content="404 NOT FOUND" />
        <meta property="og:description" content="6529 Seize" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <div className={`${styles.mainContainer} ${styles.pageNotFound}`}>
          <img src="/SummerGlasses.svg" className={styles.summerGlasses404} />
          <h2>404 | PAGE NOT FOUND</h2>
          <a href="/" className="pt-3">
            TAKE ME HOME
          </a>
        </div>
      </main>
    </>
  );
}
