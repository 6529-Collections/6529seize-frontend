import styles from "@/styles/Home.module.scss";

import dynamic from "next/dynamic";
import {
  NextGenCollectionHead,
  getServerSideCollection,
} from "../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader";
import { NextGenCollection } from "../../../../entities/INextgen";
import { useShallowRedirect } from "./[[...view]]";

const NextGenCollectionMintComponent = dynamic(
  () =>
    import(
      "../../../../components/nextGen/collections/collectionParts/mint/NextGenCollectionMint"
    ),
  {
    ssr: false,
  }
);

export default function NextGenCollectionMintPage(props: {
  readonly collection: NextGenCollection;
}) {
  const collection = props.collection;
  useShallowRedirect(collection.name);

  return (
    <>
      <NextGenCollectionHead collection={collection} />

      <main className={styles.main}>
        <NextGenCollectionMintComponent collection={collection} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return await getServerSideCollection(req, "Mint");
}
