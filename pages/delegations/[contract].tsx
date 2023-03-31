import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { useEffect, useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import {
  MEMES_CONTRACT,
  MEMELAB_CONTRACT,
  GRADIENT_CONTRACT,
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "../../constants";
import { areEqualAddresses } from "../../helpers/Helpers";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const CollectionDelegationComponent = dynamic(
  () => import("../../components/delegation/CollectionDelegation"),
  {
    ssr: false,
  }
);

export const MAX_BULK_ACTIONS = 5;

export interface DelegationCollection {
  display: string;
  contract: string;
  preview: string;
}

export const SUPPORTED_COLLECTIONS: DelegationCollection[] = [
  {
    display: "All",
    contract: "all",
    preview: "/Seize_Logo_Glasses_2-nobeta.png",
  },
  {
    display: "The Memes",
    contract: MEMES_CONTRACT,
    preview:
      "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/1.WEBP",
  },
  {
    display: "Meme Lab",
    contract: MEMELAB_CONTRACT,
    preview:
      "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb/1.WEBP",
  },
  {
    display: "6529Gradient",
    contract: GRADIENT_CONTRACT,
    preview:
      "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x0c58ef43ff3032005e472cb5709f8908acb00205/0.WEBP",
  },
];

export const CONSOLIDATION_USE_CASE = 99;
export const DELEGATION_USE_CASES = [
  {
    use_case: 1,
    display: "All (1-15)",
  },
  {
    use_case: 2,
    display: "Minting / Allowlist",
  },
  {
    use_case: 3,
    display: "Airdrops",
  },
  {
    use_case: 4,
    display: "Voting / Governance",
  },
  {
    use_case: 5,
    display: "Avatar Display",
  },
  {
    use_case: 6,
    display: "Social Media",
  },
  {
    use_case: 7,
    display: "Physical Events Access",
  },
  {
    use_case: 8,
    display: "Virtual Events Access",
  },
  {
    use_case: 9,
    display: "Club Access",
  },
  {
    use_case: 10,
    display: "Metaverse Access",
  },
  {
    use_case: 11,
    display: "Metaverse Land",
  },
  {
    use_case: 12,
    display: "Gameplay",
  },
  {
    use_case: 13,
    display: "IP Licensing",
  },
  {
    use_case: 14,
    display: "NFT rentals",
  },
  {
    use_case: 15,
    display: "View Access",
  },
  {
    use_case: 16,
    display: "Sub-delegation",
  },
  {
    use_case: CONSOLIDATION_USE_CASE,
    display: "Consolidation",
  },
];

interface Props {
  collection: DelegationCollection;
}

export default function Delegations(props: Props) {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Delegations", href: "/delegations" },
    { display: props.collection.display },
  ]);

  useEffect(() => {
    if (!props.collection) {
      window.location.href = "/404";
    }
  }, []);

  return (
    <>
      <Head>
        <title>{`${props.collection.display} Delegations | 6529 SEIZE`}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content={`${props.collection.display} Delegations | 6529 SEIZE`}
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/delagations/${props.collection.contract}`}
        />
        <meta
          property="og:title"
          content={`${props.collection.display} Delegations`}
        />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <CollectionDelegationComponent
          collection={props.collection}
          date={new Date()}
        />
      </main>
    </>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const contract = req.query.contract;
  let collection: DelegationCollection | null = null;
  SUPPORTED_COLLECTIONS.map((c) => {
    if (areEqualAddresses(c.contract, contract)) {
      collection = c;
    }
  });

  return {
    props: {
      collection: collection,
    },
  };
}
