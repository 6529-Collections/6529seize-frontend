import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { useEffect, useState } from "react";
import Breadcrumb, { Crumb } from "../../components/breadcrumb/Breadcrumb";
import dynamic from "next/dynamic";
import HeaderPlaceholder from "../../components/header/HeaderPlaceholder";
import { useRouter } from "next/router";
import { DelegationCenterSection } from "../../components/delegation/DelegationCenterMenu";
import {
  DELEGATION_ALL_ADDRESS,
  MEMES_CONTRACT,
  MEMELAB_CONTRACT,
  GRADIENT_CONTRACT,
} from "../../constants";

const Header = dynamic(() => import("../../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

const DelegationCenterMenu = dynamic(
  () => import("../../components/delegation/DelegationCenterMenu"),
  { ssr: false }
);

export const MAX_BULK_ACTIONS = 5;

export interface DelegationCollection {
  title: string;
  display: string;
  contract: string;
  preview: string;
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

export default function DelegationsDocumentation(props: any) {
  const pageProps = props.pageProps;
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DelegationCenterSection>(
    pageProps.section
  );
  const [addressQuery, setAddressQuery] = useState<string>(
    pageProps.addressQuery
  );
  const [collectionQuery, setCollectionQuery] = useState<string>(
    pageProps.collectionQuery
  );
  const [useCaseQuery, setUseCaseQuery] = useState<number>(
    pageProps.useCaseQuery
  );

  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "Delegation", href: "/delegation/delegation-center" },
  ]);

  function getQueryParams() {
    let queryParams;
    if (
      addressQuery &&
      [
        DelegationCenterSection.CHECKER,
        DelegationCenterSection.ASSIGN_PRIMARY_ADDRESS,
      ].includes(activeSection)
    ) {
      queryParams = { address: addressQuery };
    } else {
      setAddressQuery("");
    }
    if (activeSection === DelegationCenterSection.REGISTER_DELEGATION) {
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

  useEffect(() => {
    if (activeSection) {
      if (activeSection === DelegationCenterSection.HTML && pageProps.path) {
        router.push(
          {
            pathname: `${pageProps.path.join("/")}`,
          },
          undefined,
          { shallow: true }
        );

        const sectionTitle: Crumb[] = [];

        pageProps.path.map((p: any, index: number) => {
          const title = p
            .replaceAll("-", " ")
            .replace(/(^\w{1})|(\s+\w{1})/g, (letter: any) =>
              letter.toUpperCase()
            )
            .replace("Faq", "FAQ")
            .replace("Sub Delegation", "Sub-Delegation");
          const crumb: any = { display: title };
          if (index != pageProps.path.length - 1) {
            crumb.href = `/delegation/${p}`;
          }
          sectionTitle.push(crumb);
        });

        setBreadcrumbs([
          { display: "Home", href: "/" },
          { display: "Delegation", href: "/delegation/delegation-center" },
          ...sectionTitle,
        ]);
      } else {
        const queryParams = getQueryParams();
        router.push(
          {
            pathname: `${activeSection}`,
            query: queryParams,
          },
          undefined,
          { shallow: true }
        );

        const sectionTitle = activeSection
          .replaceAll("-", " ")
          .replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase())
          .replace("Faq", "FAQ")
          .replace("Sub Delegation", "Sub-Delegation");

        setBreadcrumbs([
          { display: "Home", href: "/" },
          { display: "Delegation", href: "/delegation/delegation-center" },
          { display: sectionTitle },
        ]);
      }
      window.scrollTo(0, 0);
    }
  }, [activeSection, addressQuery, collectionQuery, useCaseQuery]);

  return (
    <>
      <Head>
        <title>Delegation | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Delegation | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/delegation/delegation-center`}
        />
        <meta property="og:title" content="Delegation" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={styles.main}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <DelegationCenterMenu
          section={activeSection}
          path={pageProps.path}
          setActiveSection={setActiveSection}
          address_query={addressQuery}
          setAddressQuery={setAddressQuery}
          collection_query={collectionQuery}
          setCollectionQuery={setCollectionQuery}
          use_case_query={useCaseQuery}
          setUseCaseQuery={setUseCaseQuery}
        />
      </main>
    </>
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
