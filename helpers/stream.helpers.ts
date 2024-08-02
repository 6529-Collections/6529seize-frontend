import { Notification } from "../generated/models/Notification";
import { TypedFeedItem, TypedNotification } from "../types/feed.types";
import { MyStreamItem } from "../types/stream.types";

export const convertToMyStreamType = (
  items: (TypedNotification | TypedFeedItem)[]
): MyStreamItem[] => {
  return [];
};
