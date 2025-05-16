import styles from "../../../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import {
  NextGenCollection,
  NextGenToken,
  NextGenTrait,
} from "../../../../../entities/INextgen";
import { isEmptyObject } from "../../../../../helpers/Helpers";
import { getCommonHeaders } from "../../../../../helpers/server.helpers";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { ContentView } from "../../../../../components/nextGen/collections/collectionParts/NextGenCollection";
import NextGenNavigationHeader from "../../../../../components/nextGen/collections/NextGenNavigationHeader";
import { AuthContext } from "../../../../../components/auth/Auth";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";

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
  const router = useRouter();

  const { setTitle } = useContext(AuthContext);
  const tokenId: number = props.pageProps.token_id;
  const token: NextGenToken | null = props.pageProps.token;
  const traits: NextGenTrait[] = props.pageProps.traits;
  const tokenCount: number = props.pageProps.tokenCount;
  const collection: NextGenCollection = props.pageProps.collection;

  const [tokenView, setTokenView] = useState<ContentView>(props.pageProps.view);

  useEffect(() => {
    const viewFromUrl = getContentView(
      Array.isArray(router.query.view)
        ? router.query.view[0]
        : router.query.view ?? ""
    );
    setTokenView(viewFromUrl);
    const viewFromUrlDisplay =
      viewFromUrl !== ContentView.ABOUT ? viewFromUrl : "";
    const baseTitle = token?.name ?? `${collection.name} - #${tokenId}`;
    const title = viewFromUrlDisplay
      ? `${baseTitle} | ${viewFromUrlDisplay}`
      : baseTitle;
    setTitle({
      title,
    });
  }, [router.query.view]);

  const updateView = (newView?: ContentView) => {
    let newPath = `/nextgen/token/${tokenId}`;
    if (newView && newView !== ContentView.ABOUT) {
      newPath += `/${newView.toLowerCase().replaceAll(" ", "-")}`;
    }
    router.push(newPath, undefined, { shallow: true });
  };

  return (
    <main className={styles.main}>
      <NextGenNavigationHeader />
      {token ? (
        <NextGenTokenComponent
          collection={collection}
          token={token}
          traits={traits}
          tokenCount={tokenCount}
          view={tokenView}
          setView={updateView}
        />
      ) : (
        <NextGenTokenOnChainComponent
          collection={collection}
          token_id={tokenId}
        />
      )}
    </main>
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

  let tokenTraits: NextGenTrait[] = [];
  let tokenCount: number = 0;
  if (!token || isEmptyObject(token) || token.pending) {
    token = null;
  } else {
    tokenTraits = await commonApiFetch<NextGenTrait[]>({
      endpoint: `nextgen/tokens/${token.id}/traits`,
      headers: headers,
    });
    tokenCount = tokenTraits[0]?.token_count ?? 0;
  }

  const collectionId =
    token?.collection_id ?? Math.round(tokenId / 10000000000);

  const collection = await commonApiFetch<NextGenCollection>({
    endpoint: `nextgen/collections/${collectionId}`,
    headers: headers,
  });

  const view = req.query.view?.[0] ?? "";
  const tokenView: ContentView = getContentView(view);

  if (isEmptyObject(collection)) {
    return {
      redirect: {
        permanent: false,
        destination: "/404",
      },
      props: {},
    } as any;
  }

  const viewDisplay = tokenView !== ContentView.ABOUT ? tokenView : "";
  const baseTitle = token?.name ?? `${collection.name} - #${tokenId}`;
  const title = viewDisplay ? `${baseTitle} | ${viewDisplay}` : baseTitle;

  return {
    props: {
      token_id: tokenId,
      token: token,
      traits: tokenTraits,
      tokenCount: tokenCount,
      collection: collection,
      view: tokenView,
      metadata: {
        title,
        ogImage:
          token?.thumbnail_url ??
          token?.image_url ??
          collection.banner ??
          `${process.env.BASE_ENDPOINT}/nextgen.png`,
        description: "NextGen",
      },
    },
  };
}

function getContentView(view: string): ContentView {
  view = view?.toLowerCase().replaceAll("-", " ") ?? "";

  const allowedViews = [
    ContentView.DISPLAY_CENTER,
    ContentView.PROVENANCE,
    ContentView.RARITY,
  ];

  const matchedView = allowedViews.find((v) => v.toLowerCase() === view);

  return matchedView ?? ContentView.ABOUT;
}
