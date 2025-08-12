import styles from "@/styles/Home.module.scss";
import dynamic from "next/dynamic";
import NextGenNavigationHeader from "../../../../components/nextGen/collections/NextGenNavigationHeader";
import {
  NextGenCollectionHead,
  getServerSideCollection,
} from "../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader";
import { NextGenCollection } from "../../../../entities/INextgen";
import { useShallowRedirect } from "./[[...view]]";

const NextGenCollectionMintingPlanComponent = dynamic(
  () =>
    import(
      "../../../../components/nextGen/collections/collectionParts/mint/NextgenCollectionMintingPlan"
    ),
  { ssr: false }
);

export default function NextGenCollectionTokensPage(props: {
  readonly collection: NextGenCollection;
}) {
  const collection = props.collection;
  useShallowRedirect(collection.name);

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
