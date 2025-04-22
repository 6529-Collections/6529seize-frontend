import styles from "../../../../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { NextGenCollection } from "../../../../entities/INextgen";
import NextGenNavigationHeader from "../../../../components/nextGen/collections/NextGenNavigationHeader";
import {
  NextGenCollectionHead,
  getServerSideCollection,
} from "../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader";

const NextGenTraitSets = dynamic(
  () =>
    import(
      "../../../../components/nextGen/collections/collectionParts/NextGenTraitSets"
    ),
  { ssr: false }
);

export default function NextGenCollectionTraitSetsPage(props: any) {
  const collection: NextGenCollection = props.pageProps.collection;
  const pagenameFull = `Trait Sets | ${collection.name}`;

  return (
    <>
      <NextGenCollectionHead collection={collection} name={pagenameFull} />

      <main className={styles.main}>
        <NextGenNavigationHeader />
        <NextGenTraitSets collection={collection} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return await getServerSideCollection(req);
}
