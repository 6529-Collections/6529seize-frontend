"use client";

import { useEffect, useState } from "react";
import {
  CollectedCollectionType,
  CollectionSeized,
} from "@/entities/IProfile";
import { MEMES_SEASON } from "@/enums";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
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
        switch (filters.szn) {
          case null:
            return "Congratulations, The Memes full setter!";
          case MEMES_SEASON.SZN1:
          case MEMES_SEASON.SZN2:
          case MEMES_SEASON.SZN3:
          case MEMES_SEASON.SZN4:
          case MEMES_SEASON.SZN5:
          case MEMES_SEASON.SZN6:
          case MEMES_SEASON.SZN7:
          case MEMES_SEASON.SZN8:
          case MEMES_SEASON.SZN9:
          case MEMES_SEASON.SZN10:
          case MEMES_SEASON.SZN11:
          case MEMES_SEASON.SZN12:
          case MEMES_SEASON.SZN13:
            return `Congratulations, ${filters.szn} full setter!`;
          default:
            assertUnreachable(filters.szn);
            return "";
        }
      case CollectedCollectionType.GRADIENTS:
        return "Congratulations, Gradient full setter!";
      case CollectedCollectionType.MEMELAB:
        return "Congratulations, Meme Lab full setter!";
      case CollectedCollectionType.NEXTGEN:
        return "Congratulations, Next Gen full setter!";
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
