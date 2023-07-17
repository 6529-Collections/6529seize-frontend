import { useContext, useEffect, useRef, useState } from "react";
import AllowlistToolCommonModalWrapper, {
  AllowlistToolModalSize,
} from "../../../allowlist-tool/common/modals/AllowlistToolCommonModalWrapper";
import CreateSnapshotFormSearchCollectionModal from "./CreateSnapshotFormSearchCollectionModal";
import CreateSnapshotFormSearchCollectionDropdown from "./CreateSnapshotFormSearchCollectionDropdown";
import CreateSnapshotFormSearchCollectionInput from "./CreateSnapshotFormSearchCollectionInput";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  AllowlistToolResponse,
  DistributionPlanSearchContractMetadataResult,
} from "../../../allowlist-tool/allowlist-tool.types";

export default function CreateSnapshotFormSearchCollection({
  setCollection,
}: {
  setCollection: (param: { address: string; name: string }) => void;
}) {
  const searchCollectionRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const openDropdown = () => setIsOpen(true);
  const closeDropdown = () => setIsOpen(false);
  useClickAway(searchCollectionRef, () => closeDropdown());
  useKeyPressEvent("Escape", () => closeDropdown());

  const onCollection = (param: { address: string; name: string }) => {
    setCollection(param);
    closeDropdown();
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { setToasts } = useContext(DistributionPlanToolContext);
  const [keyword, setKeyword] = useState<string>("");
  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setKeyword(value);
  };
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>("");
  useDebounce(() => setDebouncedKeyword(keyword), 500, [keyword]);

  const [collections, setCollections] = useState<
    DistributionPlanSearchContractMetadataResult[]
  >([]);

  useEffect(() => {
    const fetchCollections = async () => {
      if (debouncedKeyword.length < 3) {
        setCollections([]);
        return;
      }
      setIsLoading(true);
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
        setIsLoading(false);
      }
    };
    fetchCollections();
  }, [debouncedKeyword, setToasts]);

  return (
    <div className="tw-relative tw-w-full" ref={searchCollectionRef}>
      <CreateSnapshotFormSearchCollectionInput openDropdown={openDropdown} />
      {isOpen && <CreateSnapshotFormSearchCollectionDropdown />}
    </div>
  );
}
