"use client";

import DelegationCenterMenu from "@/components/delegation/DelegationCenterMenu";
import {
  getDelegationAppTitle,
  getDelegationRouteMetadata,
} from "@/components/delegation/delegation-page-metadata";
import { useSetTitle } from "@/contexts/TitleContext";
import { DelegationCenterSection } from "@/types/enums";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DelegationPageClient(props: {
  readonly section: DelegationCenterSection;
  readonly addressQuery: string;
  readonly collectionQuery: string;
  readonly useCaseQuery: number;
  readonly path?: string[] | undefined;
}) {
  const metadata = getDelegationRouteMetadata(props.path ?? [props.section]);
  useSetTitle(getDelegationAppTitle(metadata));
  const router = useRouter();
  const section = props.section;
  const [queryState, setQueryState] = useState({
    addressQuery: props.addressQuery ?? "",
    collectionQuery: props.collectionQuery ?? "",
    useCaseQuery: props.useCaseQuery,
  });
  const { addressQuery, collectionQuery, useCaseQuery } = queryState;

  function setAddressQuery(address: string) {
    setQueryState((current) => ({ ...current, addressQuery: address }));
  }

  function setCollectionQuery(collection: string) {
    setQueryState((current) => ({ ...current, collectionQuery: collection }));
  }

  function setUseCaseQuery(useCase: number) {
    setQueryState((current) => ({ ...current, useCaseQuery: useCase }));
  }

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
    }
    if (s === DelegationCenterSection.REGISTER_DELEGATION) {
      if (collectionQuery) {
        queryParams = { ...queryParams, collection: collectionQuery };
      }
      if (useCaseQuery) {
        queryParams = { ...queryParams, use_case: useCaseQuery };
      }
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
  };

  const updateQueryParams = (s: DelegationCenterSection) => {
    if (s === DelegationCenterSection.HTML) {
      return;
    }
    const queryParams = getQueryParams(s);
    router.replace(buildUrl(s, queryParams));
  };

  useEffect(() => {
    const nextQueryState = {
      addressQuery: props.addressQuery ?? "",
      collectionQuery: props.collectionQuery ?? "",
      useCaseQuery: props.useCaseQuery,
    };
    setQueryState((current) =>
      current.addressQuery === nextQueryState.addressQuery &&
      current.collectionQuery === nextQueryState.collectionQuery &&
      current.useCaseQuery === nextQueryState.useCaseQuery
        ? current
        : nextQueryState
    );
  }, [props.addressQuery, props.collectionQuery, props.useCaseQuery]);

  useEffect(() => {
    updateQueryParams(section);
  }, [addressQuery, collectionQuery, useCaseQuery]);

  return (
    <main className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
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
