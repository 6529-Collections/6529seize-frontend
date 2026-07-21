export type PepeKind = "asset" | "collection" | "artist" | "set";

export type Market = {
  bestAskSats?: number | undefined;
  lastSaleSats?: number | undefined;
  bestAskXcp?: number | undefined;
  lastSaleXcp?: number | undefined;
  approxEthPerBtc?: number | undefined;
  approxEthPerXcp?: number | undefined;
  updatedISO?: string | undefined;
};

export type BasePreview = {
  readonly kind: PepeKind;
  readonly href: string;
  readonly slug: string;
};

export type AssetPreview = BasePreview & {
  readonly kind: "asset";
  readonly asset?: string | undefined;
  readonly name?: string | undefined;
  readonly collection?: string | undefined;
  readonly artist?: string | undefined;
  readonly series?: number | null | undefined;
  readonly card?: number | null | undefined;
  readonly supply?: number | null | undefined;
  readonly holders?: number | null | undefined;
  readonly image?: string | null | undefined;
  readonly links?:
    | {
        readonly horizon?: string | undefined;
        readonly xchain?: string | undefined;
        readonly wiki?: string | undefined;
      }
    | null
    | undefined;
  readonly market?: Market | null | undefined;
};

export type CollectionPreview = BasePreview & {
  readonly kind: "collection";
  readonly name?: string | undefined;
  readonly image?: string | null | undefined;
  readonly stats?:
    | {
        readonly items?: number | null | undefined;
        readonly floorSats?: number | null | undefined;
      }
    | null
    | undefined;
};

export type ArtistPreview = BasePreview & {
  readonly kind: "artist";
  readonly name?: string | undefined;
  readonly image?: string | null | undefined;
  readonly stats?:
    | {
        readonly uniqueCards?: number | null | undefined;
        readonly collections?: string[] | null | undefined;
      }
    | null
    | undefined;
};

export type SetPreview = BasePreview & {
  readonly kind: "set";
  readonly name?: string | undefined;
  readonly image?: string | null | undefined;
  readonly stats?:
    | {
        readonly items?: number | null | undefined;
        readonly fullSetFloorSats?: number | null | undefined;
        readonly lastSaleValuationSats?: number | null | undefined;
      }
    | null
    | undefined;
  readonly links?:
    | {
        readonly wiki?: string | undefined;
      }
    | null
    | undefined;
};

export type Preview =
  | AssetPreview
  | CollectionPreview
  | ArtistPreview
  | SetPreview;
