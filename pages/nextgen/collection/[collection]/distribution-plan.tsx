import styles from "../../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { NextGenCollection } from "../../../../entities/INextgen";
import { useShallowRedirect } from "./[[...view]]";
import NextGenNavigationHeader from "../../../../components/nextGen/collections/NextGenNavigationHeader";
import {
  NextGenCollectionHead,
  getServerSideCollection,
} from "../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader";

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

  return (
    <>
      <NextGenCollectionHead collection={collection} />

      <main className={styles.main}>
        <NextGenNavigationHeader />
        <NextGenCollectionMintingPlanComponent collection={collection} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return await getServerSideCollection(req, "Distribution Plan");
}
