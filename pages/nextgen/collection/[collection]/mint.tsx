import Head from "next/head";
import styles from "../../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../../components/header/HeaderPlaceholder";
import { NextGenCollection } from "../../../../entities/INextgen";
import { isEmptyObject } from "../../../../helpers/Helpers";
import { getCommonHeaders } from "../../../../helpers/server.helpers";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useShallowRedirect } from "./[[...view]]";

const Header = dynamic(() => import("../../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NextGenCollectionMintComponent = dynamic(
  () =>
    import(
      "../../../../components/nextGen/collections/collectionParts/mint/NextGenCollectionMint"
    ),
  {
    ssr: false,
  }
);

export default function NextGenCollectionMintPage(props: any) {
  const collection: NextGenCollection = props.pageProps.collection;
  useShallowRedirect(collection.name, "/mint");
  const pagenameFull = `Mint | #${collection.id} - ${collection.name}`;

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/nextgen/collection/${collection.id}`}
        />
        <meta property="og:title" content={pagenameFull} />
        <meta property="og:image" content={collection.image} />
        <meta property="og:description" content="NEXTGEN | 6529 SEIZE" />
        <meta name="twitter:card" content={pagenameFull} />
        <meta name="twitter:image:alt" content={pagenameFull} />
        <meta name="twitter:title" content={pagenameFull} />
        <meta name="twitter:description" content="NEXTGEN | 6529 SEIZE" />
        <meta name="twitter:image" content={collection.image} />
      </Head>

      <main className={styles.main}>
        <Header />
        <NextGenCollectionMintComponent collection={collection} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const collectionId = req.query.collection;
  const headers = getCommonHeaders(req);
  const collection = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/collections/${collectionId}`,
    headers: headers,
  });

  if (isEmptyObject(collection)) {
    return {
      notFound: true,
      props: {},
    };
  }

  return {
    props: {
      collection: collection,
    },
  };
}
