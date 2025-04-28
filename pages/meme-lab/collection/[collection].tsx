import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { useContext, useEffect } from "react";
import { AuthContext, useAuth } from "../../../components/auth/Auth";


const LabCollectionComponent = dynamic(
  () => import("../../../components/memelab/MemeLabCollection"),
  {
    ssr: false,
  }
);

export default function MemeLabIndex(props: any) {
  const { setTitle, title } = useContext(AuthContext);
  const pageProps = props.pageProps;
  const { connectedProfile } = useAuth();

  const pagenameFull = `${pageProps.name} | 6529.io`;

  useEffect(() => {
    setTitle({
      title: pagenameFull,
    });
  }, [pagenameFull, setTitle]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/the-memes/collection/${pageProps.collection}`}
        />
        <meta property="og:title" content={pageProps.name} />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
        <meta property="og:description" content="6529.io" />
        <meta name="twitter:card" content={pagenameFull} />
        <meta name="twitter:image:alt" content={pageProps.name} />
        <meta name="twitter:title" content={pageProps.name} />
        <meta name="twitter:description" content="6529.io" />
        <meta
          name="twitter:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <main className={styles.main}>
        <LabCollectionComponent
          wallets={connectedProfile?.wallets?.map((w) => w.wallet) ?? []}
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const collection = req.query.collection;
  let name = `${collection.replaceAll("-", " ")} | Meme Lab Collections`;

  return {
    props: {
      collection: collection,
      name: name,
    },
  };
}
