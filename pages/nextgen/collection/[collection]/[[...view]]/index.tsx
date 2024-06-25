import Head from "next/head";
import styles from "../../../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../../../components/header/HeaderPlaceholder";
import { NextGenCollection } from "../../../../../entities/INextgen";
import { isEmptyObject } from "../../../../../helpers/Helpers";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { getCommonHeaders } from "../../../../../helpers/server.helpers";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { formatNameForUrl } from "../../../../../components/nextGen/nextgen_helpers";
import { ContentView } from "../../../../../components/nextGen/collections/collectionParts/NextGenCollection";

const Header = dynamic(
  () => import("../../../../../components/header/Header"),
  {
    ssr: false,
    loading: () => <HeaderPlaceholder />,
  }
);

const NextGenCollectionComponent = dynamic(
  () =>
    import(
      "../../../../../components/nextGen/collections/collectionParts/NextGenCollection"
    ),
  {
    ssr: false,
  }
);

export default function NextGenCollectionPage(props: any) {
  const collection: NextGenCollection = props.pageProps.collection;
  const view: ContentView = props.pageProps.view;
  useShallowRedirect(collection.name);
  const pagenameFull = `${collection.name}`;

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
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
        <NextGenCollectionComponent collection={collection} view={view} />
      </main>
    </>
  );
}

function getCollectionView(view: string): ContentView {
  const normalizedView = view.toLowerCase();
  const entries = Object.entries(ContentView).find(
    ([key]) => key.toLowerCase() === normalizedView
  );

  return entries
    ? ContentView[entries[0] as keyof typeof ContentView]
    : ContentView.OVERVIEW;
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const collectionId: string = req.query.collection;
  const parsedCollectionId = encodeURIComponent(
    collectionId.replaceAll(/-/g, " ")
  );
  const headers = getCommonHeaders(req);
  const collection = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/collections/${parsedCollectionId}`,
    headers: headers,
  }).catch(() => {
    return {};
  });

  if (isEmptyObject(collection)) {
    return {
      notFound: true,
      props: {},
    };
  }

  let view = req.query.view as string;

  let collectionView: ContentView = ContentView.OVERVIEW;
  if (view) {
    view = view[0].replaceAll("-", "_").toLowerCase();
    collectionView = getCollectionView(view);
  }

  return {
    props: {
      collection: collection,
      view: collectionView,
    },
  };
}

export function useShallowRedirect(name: string, currentPath?: string) {
  const router = useRouter();

  function getPath() {
    let p = router.asPath;
    if (currentPath) {
      p = p.split(currentPath)[0];
    }
    const collectionId = p.split("/")[p.split("/").length - 1];
    if (!isNaN(parseInt(collectionId))) {
      p = p.replace(collectionId, formatNameForUrl(name));
    }

    if (currentPath) {
      p = p + currentPath;
    }

    return p;
  }

  useEffect(() => {
    router.replace(
      {
        pathname: getPath(),
      },
      undefined,
      { shallow: true }
    );
  }, []);
}
