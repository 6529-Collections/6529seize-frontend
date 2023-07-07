import Head from "next/head";
import styles from "../../../../styles/Home.module.scss";

import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../../../components/header/HeaderPlaceholder";
import { useState } from "react";
import Breadcrumb, {
  Crumb,
} from "../../../../components/breadcrumb/Breadcrumb";

const Header = dynamic(() => import("../../../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const NextGenMintComponent = dynamic(
  () => import("../../../../components/nextGen/NextGenMint"),
  {
    ssr: false,
  }
);

interface Props {
  collection: number;
  name: string;
}

export default function NextGenCollectionMint(props: any) {
  const pagenameFull = `${props.name} | 6529 SEIZE`;
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "NextGen", href: "/nextgen" },
    {
      display: `Collection #${props.collection}`,
      href: `/nextgen/collection/${props.collection}`,
    },
    { display: `Mint` },
  ]);

  return (
    <>
      <Head>
        <title>{pagenameFull}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content={pagenameFull} />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/nextgen/collection/${props.id}`}
        />
        <meta property="og:title" content={props.name} />
        <meta property="og:image" content={props.image} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta name="twitter:card" content={pagenameFull} />
        <meta name="twitter:image:alt" content={props.name} />
        <meta name="twitter:title" content={props.name} />
        <meta name="twitter:description" content="6529 SEIZE" />
        <meta name="twitter:image" content={props.image} />
      </Head>

      <main className={styles.main}>
        <Header onSetWallets={(wallets) => setConnectedWallets(wallets)} />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <NextGenMintComponent collection={props.collection} />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const collection = req.query.collection;

  let name = `Mint NextGen Collection #${collection}`;
  const props: Props = {
    collection,
    name,
  };

  return {
    props: props,
  };
}
