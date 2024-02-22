import styles from "../../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../../components/header/HeaderPlaceholder";
import { NextGenCollection } from "../../../../entities/INextgen";
import {
  formatNameForUrl,
  getCollectionBaseBreadcrums,
} from "../../../../components/nextGen/nextgen_helpers";
import NextGenNavigationHeader from "../../../../components/nextGen/collections/NextGenNavigationHeader";
import Breadcrumb from "../../../../components/breadcrumb/Breadcrumb";
import {
  NextGenCollectionHead,
  getServerSideCollection,
} from "../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader";

const Header = dynamic(() => import("../../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NextGenCollectorSets = dynamic(
  () =>
    import(
      "../../../../components/nextGen/collections/collectionParts/NextGenCollectorSets"
    ),
  { ssr: false }
);

export default function NextGenCollectionTokensPage(props: any) {
  const collection: NextGenCollection = props.pageProps.collection;
  const pagenameFull = `Collector Sets | ${collection.name}`;

  return (
    <>
      <NextGenCollectionHead collection={collection} name={pagenameFull} />

      <main className={styles.main}>
        <Header />
        <Breadcrumb
          breadcrumbs={getCollectionBaseBreadcrums(
            collection,
            "Collector Sets"
          )}
        />
        <NextGenNavigationHeader />
        <NextGenCollectorSets collection={collection} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return await getServerSideCollection(req);
}
