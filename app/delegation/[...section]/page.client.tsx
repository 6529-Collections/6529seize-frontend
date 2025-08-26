"use client";

import DelegationCenterMenu from "@/components/delegation/DelegationCenterMenu";
import { useSetTitle } from "@/contexts/TitleContext";
import { DelegationCenterSection } from "@/enums";
import styles from "@/styles/Home.module.scss";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DelegationPageClient(props: {
  readonly section: DelegationCenterSection;
  readonly addressQuery: string;
  readonly collectionQuery: string;
  readonly useCaseQuery: number;
  readonly path?: string[];
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

  const buildUrl = (
    s: string,
    params: { [key: string]: string | number }
  ): string => {
    const url = new URL(`/delegation/${s}`, window.location.origin);
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, String(v))
    );
    return url.pathname + url.search;
  };

  const updatePath = (s: DelegationCenterSection) => {
    if (s) {
      if (s === DelegationCenterSection.HTML && props.path) {
        router.push(`/delegation/${props.path.join("/")}`);
      } else {
        const queryParams = getQueryParams(s);
        router.push(buildUrl(s, queryParams));
      }
    }
    window.scrollTo(0, 0);
  };

  const updateQueryParams = (s: DelegationCenterSection) => {
    if (s === DelegationCenterSection.HTML) {
      return;
    }
    const queryParams = getQueryParams(s);
    router.replace(buildUrl(s, queryParams));
  };

  useEffect(() => {
    updateQueryParams(section);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
