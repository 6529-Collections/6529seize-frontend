import styles from "@/styles/Home.module.scss";

import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import { useTitle } from "@/contexts/TitleContext";
import { NextGenCollection } from "@/entities/INextgen";
import { isEmptyObject } from "@/helpers/Helpers";
import { getCommonHeaders } from "@/helpers/server.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
    const viewTitle = view !== ContentView.OVERVIEW ? ` | ${view}` : "";
    setTitle(`${collection.name}${viewTitle} | NextGen`);
  }, [searchParams, collection.name, setTitle]);

  const updateView = (newView: ContentView) => {
    setView(newView);
    let path =
      newView === ContentView.OVERVIEW
        ? "/"
        : `/${getContentViewKeyByValue(newView).toLowerCase()}`;
    path = path.replaceAll(" ", "-").replaceAll("_", "-");
    const newPath = `/nextgen/collection/${formatNameForUrl(
      collection.name
    )}${path}`;
    router.push(newPath, { scroll: false });
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

export function useShallowRedirect(name: string) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const next = pathname.replace(
      /^(\/nextgen\/collection\/)([^/]+)(\/?)/,
      (_, prefix: string, slug: string, tailSlash: string) => {
        if (/^\d+$/.test(slug)) {
          return `${prefix}${formatNameForUrl(name)}${tailSlash}`;
        }
        return `${prefix}${slug}${tailSlash}`;
      }
    );

    if (next !== pathname) {
      router.replace(next, { scroll: false });
    }
  }, [pathname, name, router]);
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
