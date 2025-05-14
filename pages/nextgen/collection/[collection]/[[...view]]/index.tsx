import Head from "next/head";
import styles from "../../../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import { NextGenCollection } from "../../../../../entities/INextgen";
import { isEmptyObject } from "../../../../../helpers/Helpers";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { getCommonHeaders } from "../../../../../helpers/server.helpers";
import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { formatNameForUrl } from "../../../../../components/nextGen/nextgen_helpers";
import { ContentView } from "../../../../../components/nextGen/collections/collectionParts/NextGenCollection";
import { AuthContext } from "../../../../../components/auth/Auth";

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
  const { setTitle, title } = useContext(AuthContext);
  const collection: NextGenCollection = props.pageProps.collection;
  const view: ContentView = props.pageProps.view;
  useShallowRedirect(collection.name);
  const pagenameFull = `${collection.name}`;

  useEffect(() => {
    setTitle({
      title: `${collection.name} | NEXTGEN | 6529.io`,
    });
  }, []);

  return (
    <main className={styles.main}>
      <NextGenCollectionComponent collection={collection} view={view} />
    </main>
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
    return null;
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
      metadata: {
        title: `${
          collection?.name ?? `Collection #${parsedCollectionId}`
        } | NextGen`,
        ogImage:
          collection?.image ?? `${process.env.BASE_ENDPOINT}/nextgen.png`,
        description: "NextGen",
        twitterCard: "summary_large_image",
      },
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
