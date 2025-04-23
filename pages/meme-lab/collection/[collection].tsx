import Head from "next/head";
import styles from "../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../components/auth/Auth";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const LabCollectionComponent = dynamic(
  () => import("../../../components/memelab/MemeLabCollection"),
  {
    ssr: false,
  }
);

export default function MemeLabIndex(props: any) {
  const { setTitle, title } = useContext(AuthContext);
  const pageProps = props.pageProps;
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

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
        {/* <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} /> */}
        <LabCollectionComponent wallets={connectedWallets} />
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
