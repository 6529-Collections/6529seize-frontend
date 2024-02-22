import styles from "../../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../../components/header/HeaderPlaceholder";
import { NextGenCollection } from "../../../../entities/INextgen";
import {
  NextGenCollectionHead,
  getServerSideCollection,
} from "../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader";

const Header = dynamic(() => import("../../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NextGenCollectionTokenListComponent = dynamic(
  () =>
    import(
      "../../../../components/nextGen/collections/collectionParts/art/NextGenCollectionArtPage"
    ),
  { ssr: false }
);

export default function NextGenCollectionTokensPage(props: any) {
  const collection: NextGenCollection = props.pageProps.collection;
  const pagenameFull = `Art | ${collection.name}`;

  return (
    <>
      <NextGenCollectionHead collection={collection} name={pagenameFull} />

      <main className={styles.main}>
        <Header />
        <NextGenCollectionTokenListComponent collection={collection} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return await getServerSideCollection(req);
}
