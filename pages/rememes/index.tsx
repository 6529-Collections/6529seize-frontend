import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../components/auth/Auth";

interface Props {
  meme_id?: number;
}

const RememesComponent = dynamic(
  () => import("../../components/rememes/Rememes"),
  { ssr: false }
);

export default function ReMemes(props: Readonly<Props>) {
  const { setTitle, title } = useContext(AuthContext);
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "ReMemes" },
  ]);

  useEffect(() => {
    setTitle({
      title: "ReMemes | 6529.io",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="ReMemes | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/rememes`}
        />
        <meta property="og:title" content="ReMemes" />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/re-memes-b.jpeg`}
        />
      </Head>

      <main className={styles.main}>
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <RememesComponent />
      </main>
    </>
  );
}
