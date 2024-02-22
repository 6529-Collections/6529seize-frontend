import Head from "next/head";
import styles from "../../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../../components/header/HeaderPlaceholder";
import { NextGenCollection } from "../../../../entities/INextgen";
import { isEmptyObject } from "../../../../helpers/Helpers";
import { getCommonHeaders } from "../../../../helpers/server.helpers";
import { commonApiFetch } from "../../../../services/api/common-api";
import Breadcrumb from "../../../../components/breadcrumb/Breadcrumb";
import { useShallowRedirect } from "./[[...view]]";
import NextGenNavigationHeader from "../../../../components/nextGen/collections/NextGenNavigationHeader";
import { formatNameForUrl } from "../../../../components/nextGen/nextgen_helpers";

const Header = dynamic(() => import("../../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NextGenCollectionMintingPlanComponent = dynamic(
  () =>
    import(
      "../../../../components/nextGen/collections/collectionParts/mint/NextgenCollectionMintingPlan"
    ),
  { ssr: false }
);

export default function NextGenCollectionTokensPage(props: any) {
  const collection: NextGenCollection = props.pageProps.collection;
  useShallowRedirect(collection.name, "/distribution-plan");
  const pagenameFull = `Distribution Plan | ${collection.name}`;

  const crumbs = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    {
      display: `${collection.name}`,
      href: `/nextgen/collection/${formatNameForUrl(collection.name)}`,
    },
    { display: `Distribution Plan` },
  ];
  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="preload"
          href={collection.distribution_plan}
          as="fetch"
          crossOrigin="anonymous"
        />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${
            process.env.BASE_ENDPOINT
          }/nextgen/collection/${formatNameForUrl(collection.name)}`}
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
        <Breadcrumb breadcrumbs={crumbs} />
        <NextGenNavigationHeader />
        <NextGenCollectionMintingPlanComponent collection={collection} />
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
