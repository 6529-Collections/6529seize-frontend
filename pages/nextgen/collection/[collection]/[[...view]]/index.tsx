import styles from "@/styles/Home.module.scss";

import dynamic from "next/dynamic";
import { NextGenCollection } from "@/entities/INextgen";
import { isEmptyObject } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { getCommonHeaders } from "@/helpers/server.helpers";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { useTitle } from "@/contexts/TitleContext";

const NextGenCollectionComponent = dynamic(
  () =>
    import(
      "@/components/nextGen/collections/collectionParts/NextGenCollection"
    ),
  {
    ssr: false,
  }
);

export default function NextGenCollectionPage(props: {
  readonly collection: NextGenCollection;
  readonly view: ContentView;
}) {
  const { setTitle } = useTitle();
  const router = useRouter();
  const searchParams = useSearchParams();
  const collection: NextGenCollection = props.collection;
  useShallowRedirect(collection.name);

  const [view, setView] = useState<ContentView>(props.view);

  useEffect(() => {
    const viewFromUrl = getCollectionView(searchParams?.get("view") ?? "");
    setView(viewFromUrl);
    const viewTitle =
      viewFromUrl !== ContentView.OVERVIEW ? ` | ${viewFromUrl}` : "";
    setTitle(`${collection.name}${viewTitle} | NextGen`);
  }, [searchParams, collection.name, setTitle]);

  const updateView = (newView: ContentView) => {
    let path =
      newView === ContentView.OVERVIEW
        ? "/"
        : `/${getContentViewKeyByValue(newView).toLowerCase()}`;
    path = path.replaceAll(" ", "-").replaceAll("_", "-");
    const newPath = `/nextgen/collection/${formatNameForUrl(
      collection.name
    )}${path}`;
    router.push(newPath);
  };

  return (
    <main className={styles.main}>
      <NextGenCollectionComponent
        collection={collection}
        view={view}
        setView={updateView}
      />
    </main>
  );
}

function getCollectionView(view: string): ContentView {
  const normalizedView = view.toLowerCase();
  const entries = Object.entries(ContentView).find(
    ([key]) => key.toLowerCase() === normalizedView
  );

  let contentView;

  if (entries) {
    contentView = ContentView[entries[0] as keyof typeof ContentView];
  } else if (view === "top-trait-sets") {
    contentView = ContentView.TOP_TRAIT_SETS;
  } else {
    contentView = ContentView.OVERVIEW;
  }

  return contentView;
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

  let title = collection?.name ?? `Collection #${parsedCollectionId}`;
  if (collectionView && collectionView !== ContentView.OVERVIEW) {
    title = `${title} | ${collectionView}`;
  }

  return {
    props: {
      collection: collection,
      view: collectionView,
      metadata: {
        title,
        ogImage:
          collection?.banner ??
          collection?.image ??
          `${process.env.BASE_ENDPOINT}/nextgen.png`,
        description: "NextGen",
        twitterCard: "summary_large_image",
      },
    },
  };
}

export function useShallowRedirect(name: string, currentPath?: string) {
  const router = useRouter();
  const pathname = usePathname();

  function getPath() {
    let p = pathname ?? "";
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
    router.replace(getPath());
  }, []);
}

function getContentViewKeyByValue(value: string): string {
  for (const [key, val] of Object.entries(ContentView)) {
    if (val === value) {
      return key;
    }
  }
  if (value === "trait-sets") {
    return ContentView.TOP_TRAIT_SETS;
  }
  return ContentView.OVERVIEW;
}
