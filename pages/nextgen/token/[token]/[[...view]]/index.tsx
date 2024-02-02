import Head from "next/head";
import styles from "../../../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../../../components/header/HeaderPlaceholder";
import Breadcrumb from "../../../../../components/breadcrumb/Breadcrumb";
import {
  NextGenCollection,
  NextGenToken,
} from "../../../../../entities/INextgen";
import { isEmptyObject } from "../../../../../helpers/Helpers";
import { getCommonHeaders } from "../../../../../helpers/server.helpers";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { ContentView } from "../../../../../components/nextGen/collections/collectionParts/NextGenCollection";

const Header = dynamic(
  () => import("../../../../../components/header/Header"),
  {
    ssr: false,
    loading: () => <HeaderPlaceholder />,
  }
);

const NextGenTokenComponent = dynamic(
  () =>
    import(
      "../../../../../components/nextGen/collections/nextgenToken/NextGenToken"
    ),
  {
    ssr: false,
  }
);

const NextGenTokenOnChainComponent = dynamic(
  () =>
    import("../../../../../components/nextGen/collections/NextGenTokenOnChain"),
  {
    ssr: false,
  }
);

export default function NextGenCollectionToken(props: any) {
  const tokenId: number = props.pageProps.token_id;
  const token: NextGenToken | null = props.pageProps.token;
  const collection: NextGenCollection = props.pageProps.collection;
  const pagenameFull = token?.name ?? `${collection.name} - #${tokenId}`;
  const pageImage = token?.image_url ?? collection.image;
  const tokenView = props.pageProps.view;

  const breadcrumbs = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    {
      display: collection.name,
      href: `/nextgen/collection/${collection.id}`,
    },
    {
      display: token
        ? `#${token.normalised_id}`
        : `${tokenId - collection.id * 10000000000}`,
    },
  ];

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/nextgen/token/${tokenId}`}
        />
        <meta property="og:title" content={pagenameFull} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:description" content="NEXTGEN | 6529 SEIZE" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image:alt" content={pagenameFull} />
        <meta name="twitter:title" content={pagenameFull} />
        <meta name="twitter:description" content="NEXTGEN | 6529 SEIZE" />
        <meta name="twitter:image" content={pageImage} />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        {token ? (
          <NextGenTokenComponent
            collection={collection}
            token={token}
            view={tokenView}
          />
        ) : (
          <NextGenTokenOnChainComponent
            collection={collection}
            token_id={tokenId}
          />
        )}
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const tokenId = req.query.token;
  const headers = getCommonHeaders(req);

  let token: NextGenToken | null;
  try {
    token = await commonApiFetch<NextGenToken>({
      endpoint: `nextgen/tokens/${tokenId}`,
      headers: headers,
    });
  } catch (e) {
    token = null;
  }

  if (!token || isEmptyObject(token) || token.pending) {
    token = null;
  }

  const collectionId =
    token?.collection_id ?? Math.round(tokenId / 10000000000);

  const collection = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/collections/${collectionId}`,
    headers: headers,
  });

  let view = req.query.view as string;
  let tokenView: ContentView | null = null;
  if (view) {
    view = view[0].toLowerCase().replaceAll("-", " ");
    if (view === ContentView.RENDER_CENTER.toLowerCase()) {
      tokenView = ContentView.RENDER_CENTER;
    } else if (view == ContentView.PROVENANCE.toLowerCase()) {
      tokenView = ContentView.PROVENANCE;
    } else if (view == ContentView.RARITY.toLowerCase()) {
      tokenView = ContentView.RARITY;
    }
  }

  if (isEmptyObject(collection)) {
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
      props: {},
    } as any;
  }

  return {
    props: {
      token_id: tokenId,
      token: token,
      collection: collection,
      view: tokenView,
    },
  };
}
