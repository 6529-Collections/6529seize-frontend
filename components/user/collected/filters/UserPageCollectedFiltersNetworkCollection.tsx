import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { useXtdhCollectionsQuery } from "@/hooks/useXtdhCollectionsQuery";
import { useMemo } from "react";
import { getCollectedFilterMessage } from "./user-page-collected-filter-labels";

export default function UserPageCollectedFiltersNetworkCollection({
  identity,
  selected,
  setSelected,
}: {
  readonly identity: string;
  readonly selected: string | null;
  readonly setSelected: (selected: string | null) => void;
}) {
  const { collections } = useXtdhCollectionsQuery({
    identity,
    pageSize: 100, // Fetch enough collections
    sortField: "xtdh",
    order: "DESC",
  });

  const items: CommonSelectItem<string | null>[] = useMemo(() => {
    const allOption: CommonSelectItem<string | null> = {
      label: getCollectedFilterMessage("user.collected.filters.collection.all"),
      mobileLabel: getCollectedFilterMessage(
        "user.collected.filters.collection.allCollections"
      ),
      value: null,
      key: "all",
    };

    const collectionOptions = collections.map((c) => ({
      label:
        c.collection_name ??
        getCollectedFilterMessage("user.collected.filters.collection.unknown"),
      value: c.contract,
      key: c.contract,
    }));

    return [allOption, ...collectionOptions];
  }, [collections]);

  return (
    <CommonDropdown
      items={items}
      activeItem={selected}
      filterLabel={getCollectedFilterMessage(
        "user.collected.filters.collection"
      )}
      setSelected={setSelected}
      size="sm"
    />
  );
}
