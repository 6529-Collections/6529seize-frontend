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
import { useContext, useEffect } from "react";

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
  const { setTitle, title } = useContext(AuthContext);
  const tokenId: number = props.pageProps.token_id;
  const token: NextGenToken | null = props.pageProps.token;
  const traits: NextGenTrait[] = props.pageProps.traits;
  const tokenCount: number = props.pageProps.tokenCount;
  const collection: NextGenCollection = props.pageProps.collection;
  const pagenameFull = token?.name ?? `${collection.name} - #${tokenId}`;

  const tokenView = props.pageProps.view;

  useEffect(() => {
    setTitle({
      title: pagenameFull,
    });
  }, [pagenameFull]);

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

  let view = req.query.view as string;
  let tokenView: ContentView | null = null;
  if (view) {
    view = view[0].toLowerCase().replaceAll("-", " ");
    if (view === ContentView.DISPLAY_CENTER.toLowerCase()) {
      tokenView = ContentView.DISPLAY_CENTER;
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
      traits: tokenTraits,
      tokenCount: tokenCount,
      collection: collection,
      view: tokenView,
      metadata: {
        title: token?.name ?? `${collection.name} - #${tokenId}`,
        ogImage: token?.image_url ?? collection.image,
        description: "NextGen",
        twitterCard: "summary_large_image",
      },
    },
  };
}
