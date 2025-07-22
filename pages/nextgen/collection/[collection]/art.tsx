import styles from "@/styles/Home.module.scss";

import dynamic from "next/dynamic";
import { NextGenCollection } from "../../../../entities/INextgen";
import {
  NextGenCollectionHead,
  getServerSideCollection,
} from "../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader";

const NextGenCollectionTokenListComponent = dynamic(
  () =>
    import(
      "../../../../components/nextGen/collections/collectionParts/art/NextGenCollectionArtPage"
    ),
  { ssr: false }
);

export default function NextGenCollectionTokensPage(props: {
  readonly collection: NextGenCollection;
}) {
  const collection = props.collection;

  return (
    <>
      <NextGenCollectionHead collection={collection} />
      <main className={styles.main}>
        <NextGenCollectionTokenListComponent collection={collection} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return await getServerSideCollection(req, "Art");
}
