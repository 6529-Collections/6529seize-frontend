import Head from "next/head";
import styles from "../../styles/Home.module.scss";
import { FC, useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/Auth";
import { useRouter } from "next/router";
import { DelegationCenterSection } from "./DelegationCenterMenu";
import dynamic from "next/dynamic";

const DelegationCenterMenu = dynamic(
  () => import("./DelegationCenterMenu"),
  { ssr: false }
);

const DelegationCenterPage: FC = (props: any) => {
  const { setTitle, title } = useContext(AuthContext);
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
      if (s === DelegationCenterSection.HTML && pageProps.path) {
        router.push(
          {
            pathname: `/delegation/${pageProps.path.join("/")}`,
          },
          undefined,
          { shallow: true }
        );
      } else {
        const queryParams = getQueryParams(s);
        router.push(
          {
            pathname: `/delegation/${s}`,
            query: queryParams,
          },
          undefined,
          { shallow: true }
        );
      }
    }
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    updatePath(activeSection);
  }, [addressQuery, collectionQuery, useCaseQuery, pageProps.path]);

  useEffect(() => {
    setTitle({
      title: "Delegation | 6529.io",
    });
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Delegation | 6529.io" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/delegation/delegation-center`}
        />
        <meta property="og:title" content="Delegation" />
        <meta property="og:description" content="6529.io" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/6529io.png`}
        />
      </Head>

      <main className={styles.main}>
        <DelegationCenterMenu
          section={activeSection}
          path={pageProps.path}
          setActiveSection={(s) => {
            setActiveSection(s);
            updatePath(s);
          }}
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
};

export default DelegationCenterPage;
