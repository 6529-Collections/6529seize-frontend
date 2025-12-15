"use client";

import { CollectedCollectionType, CollectionSeized } from "@/entities/IProfile";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { useEffect, useState } from "react";
import { ProfileCollectedFilters } from "../UserPageCollected";

export default function UserPageCollectedCardsNoCards({
  filters,
}: {
  readonly filters: ProfileCollectedFilters;
}) {
  const getMsg = (): string => {
    if (filters.seized !== CollectionSeized.NOT_SEIZED) {
      return "No cards to display";
    }
    switch (filters.collection) {
      case null:
        return "Congratulations, full setter!";
      case CollectedCollectionType.MEMES:
        if (filters.szn === null) {
          return "Congratulations, The Memes full setter!";
        }
        return `Congratulations, ${filters.szn.display} full setter!`;
      case CollectedCollectionType.GRADIENTS:
        return "Congratulations, Gradient full setter!";
      case CollectedCollectionType.MEMELAB:
        return "Congratulations, Meme Lab full setter!";
      case CollectedCollectionType.NEXTGEN:
        return "Congratulations, Next Gen full setter!";
      case CollectedCollectionType.NETWORK:
        return "No network tokens found";
      default:
        assertUnreachable(filters.collection);
        return "";
    }
  };

  const [msg, setMsg] = useState(getMsg());

  useEffect(() => {
    setMsg(getMsg());
  }, [filters]);

  return (
    <div className="tw-py-4 tw-text-sm tw-italic tw-text-iron-500">{msg}</div>
  );
}
