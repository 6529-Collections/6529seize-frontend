import Head from "next/head";
import styles from "../../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NextGenCollectionTokensComponent = dynamic(
  () =>
    import(
      "../../../../components/nextGen/collections/collectionParts/art/NextGenCollectionArtPage"
    ),
  {
    ssr: false,
  }
);

export default function NextGenCollectionTokensPage(props: any) {
  const pageProps = props.pageProps;
  const pagenameFull = `${pageProps.name} | 6529 SEIZE`;

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/nextgen/collection/${pageProps.collection}/art`}
        />
        <meta property="og:title" content={pageProps.name} />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/nextgen.png`}
        />
        <meta property="og:description" content="6529 SEIZE" />
        <meta name="twitter:card" content={pagenameFull} />
        <meta name="twitter:image:alt" content={pageProps.name} />
        <meta name="twitter:title" content={pageProps.name} />
        <meta name="twitter:description" content="6529 SEIZE" />
        {/* <meta name="twitter:image" content={pageProps.image} /> */}
      </Head>

      <main className={styles.main}>
        <Header />
        <NextGenCollectionTokensComponent collection={pageProps.collection} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const collection = req.query.collection;

  let name = `Art | NextGen Collection #${collection}`;

  const props = {
    collection,
    name,
  };

  return {
    props,
  };
}
