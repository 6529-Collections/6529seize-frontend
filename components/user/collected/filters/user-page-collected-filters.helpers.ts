import { CollectedCollectionType, CollectionSort } from "../../../../entities/IProfile";

interface CollectedCollectionMeta {
  readonly label: string;
  readonly showCardDataRow: boolean;
  readonly filters: {
    readonly seized: boolean;
    readonly szn: boolean;
    readonly sort: CollectionSort[];
  };
  readonly cardPath: string;
}

export const COLLECTED_COLLECTIONS_META: Record<
  CollectedCollectionType,
  CollectedCollectionMeta
> = {
  [CollectedCollectionType.MEMES]: {
    label: "The Memes",
    showCardDataRow: true,
    filters: {
      seized: true,
      szn: true,
      sort: [CollectionSort.TOKEN_ID, CollectionSort.TDH, CollectionSort.RANK],
    },
    cardPath: "/the-memes",
  },
  [CollectedCollectionType.GRADIENTS]: {
    label: "Gradients",
    showCardDataRow: true,
    filters: {
      seized: false,
      szn: false,
      sort: [CollectionSort.TOKEN_ID, CollectionSort.TDH, CollectionSort.RANK],
    },
    cardPath: "/6529-gradient",
  },
  [CollectedCollectionType.NEXTGEN]: {
    label: "NextGen",
    showCardDataRow: true,
    filters: {
      seized: false,
      szn: false,
      sort: [CollectionSort.TOKEN_ID, CollectionSort.TDH, CollectionSort.RANK],
    },
    cardPath: "/nextgen/token",
  },
  [CollectedCollectionType.MEMELAB]: {
    label: "Meme Lab",
    showCardDataRow: false,
    filters: {
      seized: false,
      szn: false,
      sort: [CollectionSort.TOKEN_ID],
    },
    cardPath: "/meme-lab",
  },
};

export const convertAddressToLowerCase = (address: any) =>
  typeof address === "string" && address.length ? address.toLowerCase() : null;
