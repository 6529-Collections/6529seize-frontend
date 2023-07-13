import { useContext, useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { DistributionPlanToolContext } from "../../DistributionPlanToolContext";
import {
  AllowlistToolResponse,
  DistributionPlanSearchContractMetadataResult,
} from "../../../allowlist-tool/allowlist-tool.types";

export default function CreateSnapshotFormSearchCollectionModal({
  setCollection,
}: {
  setCollection: (param: { address: string; name: string }) => void;
}) {
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
    <div className="tw-mx-8">
      <div>
        <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-neutral-100">
          Contract name
        </label>
        <div className="tw-mt-2">
          <input
            type="text"
            name="keyword"
            value={keyword}
            onChange={handleKeywordChange}
            required
            autoComplete="off"
            placeholder="Contract name"
            className="tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-px-3 tw-bg-neutral-700/40 tw-text-white tw-font-light tw-caret-primary-500 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-neutral-700/40 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-500 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
          />
        </div>
      </div>
      <div>
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="tw-cursor-pointer"
            onClick={() =>
              setCollection({
                name: collection.name,
                address: collection.address,
              })
            }
          >
            {collection.name}
          </div>
        ))}
      </div>
    </div>
  );
}
