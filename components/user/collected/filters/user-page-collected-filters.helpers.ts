import {
  CollectedCollectionType,
  CollectionSort,
} from "@/entities/IProfile";

interface CollectedCollectionMeta {
  readonly label: string;
  readonly showCardDataRow: boolean;
  readonly dataRows: {
    readonly seizedCount: boolean;
  };
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
    dataRows: {
      seizedCount: true,
    },
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
    dataRows: {
      seizedCount: false,
    },
    filters: {
      seized: false,
      szn: false,
      sort: [CollectionSort.TOKEN_ID, CollectionSort.TDH, CollectionSort.RANK],
    },
    cardPath: "/6529-gradient",
  },
  [CollectedCollectionType.NEXTGEN]: {
    label: "NextGen",
    dataRows: {
      seizedCount: false,
    },
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
    dataRows: {
      seizedCount: true,
    },
    showCardDataRow: false,
    filters: {
      seized: false,
      szn: false,
      sort: [CollectionSort.TOKEN_ID],
    },
    cardPath: "/meme-lab",
  },
  [CollectedCollectionType.NETWORK]: {
    label: "Network",
    dataRows: {
      seizedCount: false,
    },
    showCardDataRow: true,
    filters: {
      seized: false,
      szn: false,
      sort: [CollectionSort.XTDH, CollectionSort.XTDH_DAY],
    },
    cardPath: "/network",
  },
};

export const convertAddressToLowerCase = (address: any) =>
  typeof address === "string" && address.length ? address.toLowerCase() : null;
