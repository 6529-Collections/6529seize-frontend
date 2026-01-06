import CommonDropdown from "@/components/utils/select/dropdown/CommonDropdown";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import { useXtdhCollectionsQuery } from "@/hooks/useXtdhCollectionsQuery";
import { useMemo } from "react";

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
      label: "All",
      mobileLabel: "All Collections",
      value: null,
      key: "all",
    };

    const collectionOptions = collections.map((c) => ({
      label: c.collection_name ?? "Unknown Collection",
      value: c.contract,
      key: c.contract,
    }));

    return [allOption, ...collectionOptions];
  }, [collections]);

  return (
    <CommonDropdown
      items={items}
      activeItem={selected}
      filterLabel="Collection"
      setSelected={setSelected}
    />
  );
}
