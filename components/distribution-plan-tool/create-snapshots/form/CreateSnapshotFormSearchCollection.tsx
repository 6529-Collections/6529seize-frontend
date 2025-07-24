"use client";

import { useContext, useEffect, useRef, useState } from "react";
import CreateSnapshotFormSearchCollectionDropdown from "./CreateSnapshotFormSearchCollectionDropdown";
import CreateSnapshotFormSearchCollectionInput from "./CreateSnapshotFormSearchCollectionInput";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  DistributionPlanSearchContractMetadataResult,
} from "../../../allowlist-tool/allowlist-tool.types";
import { MEMES_CONTRACT } from "../../../../constants";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../../allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import CreateSnapshotFormSearchCollectionMemesModal from "./CreateSnapshotFormSearchCollectionMemesModal";
import {
  distributionPlanApiFetch,
  distributionPlanApiPost,
} from "../../../../services/distribution-plan-api";

export default function CreateSnapshotFormSearchCollection({
  setCollection,
}: {
  setCollection: (param: {
    address: string;
    name: string;
    tokenIds: string | null;
  }) => void;
}) {
  const searchCollectionRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const openDropdown = () => setIsOpen(true);
  const closeDropdown = () => setIsOpen(false);
  useClickAway(searchCollectionRef, () => closeDropdown());
  useKeyPressEvent("Escape", () => closeDropdown());

  const [isOnMemesCollection, setIsOnMemesCollection] = useState(false);

  const onCollection = (param: {
    address: string;
    name: string;
    tokenIds: string | null;
  }) => {
    if (param.address === MEMES_CONTRACT.toLowerCase()) {
      closeDropdown();
      setIsOnMemesCollection(true);
      return;
    }
    setCollection(param);
    closeDropdown();
  };

  const [isLoadingDefaultCollections, setIsLoadingDefaultCollections] =
    useState<boolean>(false);
  const [isLoadingCollections, setIsLoadingCollections] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(isLoadingDefaultCollections || isLoadingCollections);
  }, [isLoadingDefaultCollections, isLoadingCollections]);

  const { setToasts } = useContext(DistributionPlanToolContext);
  const [keyword, setKeyword] = useState<string>("");

  const [debouncedKeyword, setDebouncedKeyword] = useState<string>("");
  useDebounce(() => setDebouncedKeyword(keyword), 500, [keyword]);

  const [collections, setCollections] = useState<
    DistributionPlanSearchContractMetadataResult[]
  >([]);

  const [defaultCollections, setDefaultCollections] = useState<
    DistributionPlanSearchContractMetadataResult[]
  >([]);

  useEffect(() => {
    const fetchDefaultCollections = async () => {
      setIsLoadingDefaultCollections(true);
      const endpoint = `/other/memes-collections`;
      const { data } = await distributionPlanApiFetch<
        DistributionPlanSearchContractMetadataResult[]
      >(endpoint);
      setIsLoadingDefaultCollections(false);
      setDefaultCollections(data ?? []);
    };
    fetchDefaultCollections();
  }, []);

  useEffect(() => {
    const fetchCollections = async () => {
      if (debouncedKeyword.length < 3) {
        setCollections([]);
        return;
      }
      setIsLoadingCollections(true);
      const endpoint = `/other/search-contract-metadata`;
      const { success, data } = await distributionPlanApiPost<
        DistributionPlanSearchContractMetadataResult[]
      >({
        endpoint,
        body: {
          keyword: debouncedKeyword,
        },
      });
      setIsLoadingCollections(false);
      if (!success) {
        return null;
      }
      setCollections(data ?? []);
    };
    fetchCollections();
  }, [debouncedKeyword, setToasts]);

  const onMemesCollection = (param: {
    address: string;
    name: string;
    tokenIds: string | null;
  }): void => {
    setCollection(param);
    setIsOnMemesCollection(false);
  };

  return (
    <div className="tw-relative tw-max-w-lg" ref={searchCollectionRef}>
      <CreateSnapshotFormSearchCollectionInput
        openDropdown={openDropdown}
        keyword={keyword}
        setKeyword={setKeyword}
        loading={isLoading}
      />
      {isOpen && (
        <CreateSnapshotFormSearchCollectionDropdown
          collections={collections}
          defaultCollections={defaultCollections}
          onCollection={onCollection}
        />
      )}
      <AllowlistToolCommonModalWrapper
        showModal={isOnMemesCollection}
        onClose={() => setIsOnMemesCollection(false)}
        title={`Select "The Memes by 6529" Seasons`}
        modalSize={AllowlistToolModalSize.X_LARGE}
        showTitle={false}>
        <CreateSnapshotFormSearchCollectionMemesModal
          onMemesCollection={onMemesCollection}
          collectionName="The Memes by 6529"
        />
      </AllowlistToolCommonModalWrapper>
    </div>
  );
}
