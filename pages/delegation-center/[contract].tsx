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
import { DocumentationSection } from "../../components/delegation/documentation/DelegationDocumentation";

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
  title: string;
  display: string;
  contract: string;
  preview: string;
}

export const ANY_COLLECTION_PATH = "any-collection";

export const SUPPORTED_COLLECTIONS: DelegationCollection[] = [
  {
    title: "Any Collection",
    display: "Any Collection",
    contract: DELEGATION_ALL_ADDRESS,
    preview: "/nftdelegation.jpg",
  },
  {
    title: "The Memes",
    display: `The Memes - ${MEMES_CONTRACT}`,
    contract: MEMES_CONTRACT,
    preview:
      "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/1.WEBP",
  },
  {
    title: "Meme Lab",
    display: `Meme Lab - ${MEMELAB_CONTRACT}`,
    contract: MEMELAB_CONTRACT,
    preview:
      "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb/1.WEBP",
  },
  {
    title: "6529Gradient",
    display: `6529Gradient - ${GRADIENT_CONTRACT}`,
    contract: GRADIENT_CONTRACT,
    preview:
      "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x0c58ef43ff3032005e472cb5709f8908acb00205/0.WEBP",
  },
];

export const SUB_DELEGATION_USE_CASE = {
  index: 16,
  use_case: 998,
  display: "Sub-Delegation",
};

export const CONSOLIDATION_USE_CASE = {
  index: 17,
  use_case: 999,
  display: "Consolidation",
};

export const DELEGATION_USE_CASES = [
  {
    use_case: 1,
    display: "All",
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
    display: "Manage Access",
  },
];

export const ALL_USE_CASES = [
  ...DELEGATION_USE_CASES,
  SUB_DELEGATION_USE_CASE,
  CONSOLIDATION_USE_CASE,
];

interface Props {
  collection: DelegationCollection;
}

export default function Delegations(props: Props) {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Delegation Center", href: "/delegation-center" },
    { display: props.collection.display },
  ]);

  useEffect(() => {
    if (!props.collection) {
      window.location.href = "/404";
    }
  }, []);

  if (props.collection) {
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
            content={`${process.env.BASE_ENDPOINT}/delegations-center/${props.collection.contract}`}
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
          <CollectionDelegationComponent collection={props.collection} />
        </main>
      </>
    );
  }
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  if (req.query.contract == "getting-started") {
    return {
      redirect: {
        permanent: false,
        destination: `/delegation-center/getting-started/${DocumentationSection.REFERENCE_OVERVIEW}`,
      },
      props: {},
    };
  }

  const contract = req.query.contract;
  let collection: DelegationCollection | undefined = undefined;
  SUPPORTED_COLLECTIONS.map((c) => {
    if (areEqualAddresses(c.contract, contract)) {
      collection = c;
    } else if (areEqualAddresses(ANY_COLLECTION_PATH, contract)) {
      collection = SUPPORTED_COLLECTIONS.find((c) =>
        areEqualAddresses(c.contract, DELEGATION_ALL_ADDRESS)
      );
    }
  });

  return {
    props: {
      collection: collection ? collection : null,
    },
  };
}
