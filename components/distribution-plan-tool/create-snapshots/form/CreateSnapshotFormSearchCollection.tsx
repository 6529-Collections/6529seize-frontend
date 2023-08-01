import { useContext, useEffect, useRef, useState } from "react";
import CreateSnapshotFormSearchCollectionDropdown from "./CreateSnapshotFormSearchCollectionDropdown";
import CreateSnapshotFormSearchCollectionInput from "./CreateSnapshotFormSearchCollectionInput";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  AllowlistToolResponse,
  DistributionPlanSearchContractMetadataResult,
} from "../../../allowlist-tool/allowlist-tool.types";
import { MEMES_CONTRACT } from "../../../../constants";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../../allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import CreateSnapshotFormSearchCollectionMemesModal from "./CreateSnapshotFormSearchCollectionMemesModal";

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
      try {
        const url = `${process.env.ALLOWLIST_API_ENDPOINT}/other/memes-collections`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data: AllowlistToolResponse<
          DistributionPlanSearchContractMetadataResult[]
        > = await response.json();

        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
          return null;
        }
        setDefaultCollections(data);
      } catch (error) {
        setToasts({
          messages: ["Something went wrong"],
          type: "error",
        });
        return null;
      } finally {
        setIsLoadingDefaultCollections(false);
      }
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
      try {
        const url = `${process.env.ALLOWLIST_API_ENDPOINT}/other/search-contract-metadata`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keyword: debouncedKeyword,
          }),
        });

        const data: AllowlistToolResponse<
          DistributionPlanSearchContractMetadataResult[]
        > = await response.json();

        if ("error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
          return null;
        }
        setCollections(data);
      } catch (error) {
        setToasts({
          messages: ["Something went wrong"],
          type: "error",
        });
        return null;
      } finally {
        setIsLoadingCollections(false);
      }
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
        showTitle={true}
      >
        <CreateSnapshotFormSearchCollectionMemesModal
          onMemesCollection={onMemesCollection}
          collectionName="The Memes by 6529"
        />
      </AllowlistToolCommonModalWrapper>
    </div>
  );
}
