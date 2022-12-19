import Head from "next/head";
import styles from "../../styles/Home.module.scss";

import { useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
});

const TheMemesComponent = dynamic(
  () => import("../../components/the-memes/TheMemes"),
  {
    ssr: false,
  }
);

export default function TheMemesPage() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "The Memes" },
  ]);

  return (
    <>
      <Head>
        <title>The Memes | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="The Memes | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`http://52.50.150.109:3001/the-memes`}
        />
        <meta property="og:title" content="The Memes" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`http://52.50.150.109:3001/memes-preview.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <TheMemesComponent />
      </main>
    </>
  );
}
