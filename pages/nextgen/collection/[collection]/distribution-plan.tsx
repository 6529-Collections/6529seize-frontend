import styles from "../../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../../components/header/HeaderPlaceholder";
import { NextGenCollection } from "../../../../entities/INextgen";
import Breadcrumb from "../../../../components/breadcrumb/Breadcrumb";
import { useShallowRedirect } from "./[[...view]]";
import NextGenNavigationHeader from "../../../../components/nextGen/collections/NextGenNavigationHeader";
import { formatNameForUrl } from "../../../../components/nextGen/nextgen_helpers";
import {
  NextGenCollectionHead,
  getServerSideCollection,
} from "../../../../components/nextGen/collections/collectionParts/NextGenCollectionHeader";

const Header = dynamic(() => import("../../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

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
  const pagenameFull = `Distribution Plan | ${collection.name}`;

  const crumbs = [
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    {
      display: `${collection.name}`,
      href: `/nextgen/collection/${formatNameForUrl(collection.name)}`,
    },
    { display: `Distribution Plan` },
  ];
  return (
    <>
      <NextGenCollectionHead collection={collection} name={pagenameFull} />

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={crumbs} />
        <NextGenNavigationHeader />
        <NextGenCollectionMintingPlanComponent collection={collection} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  return await getServerSideCollection(req);
}
