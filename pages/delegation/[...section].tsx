import styles from "@/styles/Home.module.scss";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { DelegationCenterSection } from "../../components/delegation/DelegationCenterMenu";
import {
  DELEGATION_ALL_ADDRESS,
  MEMES_CONTRACT,
  MEMELAB_CONTRACT,
  GRADIENT_CONTRACT,
} from "../../constants";
import { useSetTitle } from "../../contexts/TitleContext";

const DelegationCenterMenu = dynamic(
  () => import("../../components/delegation/DelegationCenterMenu"),
  { ssr: false }
);

export const MAX_BULK_ACTIONS = 5;

export interface DelegationCollection {
  readonly title: string;
  readonly display: string;
  readonly contract: string;
  readonly preview: string;
}

export const ANY_COLLECTION_PATH = "any-collection";

export const ANY_COLLECTION: DelegationCollection = {
  title: "Any Collection",
  display: "Any Collection",
  contract: DELEGATION_ALL_ADDRESS,
  preview: "/nftdelegation.jpg",
};

export const MEMES_COLLECTION: DelegationCollection = {
  title: "The Memes",
  display: `The Memes - ${MEMES_CONTRACT}`,
  contract: MEMES_CONTRACT,
  preview:
    "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/1.WEBP",
};

export const MEME_LAB_COLLECTION: DelegationCollection = {
  title: "Meme Lab",
  display: `Meme Lab - ${MEMELAB_CONTRACT}`,
  contract: MEMELAB_CONTRACT,
  preview:
    "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb/1.WEBP",
};

export const GRADIENTS_COLLECTION: DelegationCollection = {
  title: "6529Gradient",
  display: `6529Gradient - ${GRADIENT_CONTRACT}`,
  contract: GRADIENT_CONTRACT,
  preview:
    "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x0c58ef43ff3032005e472cb5709f8908acb00205/0.WEBP",
};

export const SUPPORTED_COLLECTIONS: DelegationCollection[] = [
  ANY_COLLECTION,
  MEMES_COLLECTION,
  MEME_LAB_COLLECTION,
  GRADIENTS_COLLECTION,
];

export const ALL_USE_CASE = {
  use_case: 1,
  display: "All",
};

export const MINTING_USE_CASE = {
  use_case: 2,
  display: "Minting / Allowlist",
};

export const AIRDROPS_USE_CASE = {
  use_case: 3,
  display: "Airdrops",
};

export const PRIMARY_ADDRESS_USE_CASE = {
  index: 17,
  use_case: 997,
  display: "Primary Address",
};

export const SUB_DELEGATION_USE_CASE = {
  index: 18,
  use_case: 998,
  display: "Delegation Management (Sub-Delegation)",
};

export const CONSOLIDATION_USE_CASE = {
  index: 19,
  use_case: 999,
  display: "Consolidation",
};

export const DELEGATION_USE_CASES = [
  ALL_USE_CASE,
  MINTING_USE_CASE,
  AIRDROPS_USE_CASE,
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
  {
    use_case: 17,
    display: "Mint To Address",
  },
];

export const ALL_USE_CASES = [
  ...DELEGATION_USE_CASES,
  PRIMARY_ADDRESS_USE_CASE,
  SUB_DELEGATION_USE_CASE,
  CONSOLIDATION_USE_CASE,
];

export default function DelegationsDocumentation(props: {
  readonly section: DelegationCenterSection;
  readonly addressQuery: string;
  readonly collectionQuery: string;
  readonly useCaseQuery: number;
  readonly path: string[];
}) {
  useSetTitle("Delegation | 6529.io");
  const router = useRouter();
  const section = props.section;
  const [addressQuery, setAddressQuery] = useState<string>(
    props.addressQuery ?? ""
  );
  const [collectionQuery, setCollectionQuery] = useState<string>(
    props.collectionQuery ?? ""
  );
  const [useCaseQuery, setUseCaseQuery] = useState<number>(props.useCaseQuery);

  function getQueryParams(s: DelegationCenterSection) {
    let queryParams: { [key: string]: string | number } = {};
    if (
      addressQuery &&
      [
        DelegationCenterSection.CHECKER,
        DelegationCenterSection.ASSIGN_PRIMARY_ADDRESS,
      ].includes(s)
    ) {
      queryParams = { address: addressQuery };
    } else {
      setAddressQuery("");
    }
    if (s === DelegationCenterSection.REGISTER_DELEGATION) {
      if (collectionQuery) {
        queryParams = { ...queryParams, collection: collectionQuery };
      }
      if (useCaseQuery) {
        queryParams = { ...queryParams, use_case: useCaseQuery };
      }
    } else {
      setCollectionQuery("");
      setUseCaseQuery(0);
    }
    return queryParams;
  }

  const updatePath = (s: DelegationCenterSection) => {
    if (s) {
      if (s === DelegationCenterSection.HTML && props.path) {
        router.push({
          pathname: `/delegation/${props.path.join("/")}`,
        });
      } else {
        const queryParams = getQueryParams(s);
        router.push({
          pathname: `/delegation/${s}`,
          query: queryParams,
        });
      }
    }
    window.scrollTo(0, 0);
  };

  const updateQueryParams = (s: DelegationCenterSection) => {
    if (s === DelegationCenterSection.HTML) {
      return;
    }
    const queryParams = getQueryParams(s);
    router.push(
      {
        pathname: `/delegation/${s}`,
        query: queryParams,
      },
      undefined,
      { shallow: true }
    );
  };

  useEffect(() => {
    updateQueryParams(section);
  }, [addressQuery, collectionQuery, useCaseQuery]);

  return (
    <main className={styles.main}>
      <DelegationCenterMenu
        section={section}
        path={props.path}
        setActiveSection={(s) => updatePath(s)}
        address_query={addressQuery}
        setAddressQuery={setAddressQuery}
        collection_query={collectionQuery}
        setCollectionQuery={setCollectionQuery}
        use_case_query={useCaseQuery}
        setUseCaseQuery={setUseCaseQuery}
      />
    </main>
  );
}

export async function getServerSideProps(req: any, res: any, resolvedUrl: any) {
  const sectionPath = req.query.section;
  const mySection = sectionPath.length > 1 ? sectionPath : sectionPath[0];

  const addressQuery = req.query.address;
  const collectionQuery = req.query.collection;
  const useCaseQuery = req.query.use_case;
  const useCaseQueryInt = !isNaN(parseInt(useCaseQuery))
    ? parseInt(useCaseQuery)
    : 0;

  if (
    mySection &&
    Object.values(DelegationCenterSection).includes(
      mySection as DelegationCenterSection
    )
  ) {
    const section = mySection as DelegationCenterSection;

    return {
      props: {
        section,
        addressQuery: addressQuery ?? null,
        collectionQuery: collectionQuery ?? null,
        useCaseQuery: useCaseQueryInt,
        metadata: {
          title: section
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          description: "NFT Delegation",
          twitterCard: "summary_large_image",
        },
      },
    };
  } else {
    return {
      props: {
        section: DelegationCenterSection.HTML,
        path: sectionPath,
      },
    };
  }
}
