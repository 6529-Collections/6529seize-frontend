import Head from "next/head";
import styles from "../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../components/header/HeaderPlaceholder";
import { useState } from "react";
import Breadcrumb, { Crumb } from "../../../components/breadcrumb/Breadcrumb";

const Header = dynamic(() => import("../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NextGenTokenComponent = dynamic(
  () => import("../../../components/nextGen/collections/NextGenToken"),
  {
    ssr: false,
  }
);

export default function NextGenCollectionToken(props: any) {
  const pageProps = props.pageProps;
  const pagenameFull = `${pageProps.name} | 6529 SEIZE`;
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>(
    pageProps.collection > 0
      ? [
          { display: "Home", href: "/" },
          { display: "NextGen", href: "/nextgen" },
          {
            display: `Collection #${pageProps.collection}`,
            href: `/nextgen/collection/${pageProps.collection}`,
          },
          { display: `Token #${pageProps.token}` },
        ]
      : [
          { display: "Home", href: "/" },
          { display: "NextGen", href: "/nextgen" },
        ]
  );

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/nextgen/token/${pageProps.token}`}
        />
        <meta property="og:title" content={pageProps.name} />
        <meta property="og:image" content={pageProps.image} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta name="twitter:card" content={pagenameFull} />
        <meta name="twitter:image:alt" content={pageProps.name} />
        <meta name="twitter:title" content={pageProps.name} />
        <meta name="twitter:description" content="6529 SEIZE" />
        <meta name="twitter:image" content={pageProps.image} />
      </Head>

      <main className={styles.main}>
        <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <NextGenTokenComponent
          collection={pageProps.collection}
          token={pageProps.token}
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const token = req.query.token;
  const tokenparts = token.toString().split(`0`);
  let collection = 0;
  if (tokenparts.length >= 2) {
    collection = tokenparts[0];
  }

  let name = `NextGen ${
    collection > 0 ? `Collection #${collection}` : ``
  } Token #${token}`;
  const props = {
    collection,
    token,
    name,
  };

  return {
    props: props,
  };
}
