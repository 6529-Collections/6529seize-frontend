export interface GroupsRequestParams {
  readonly group_name: string | null;
  readonly author_identity: string | null;
  readonly created_at_less_than?: string | null;
}

export enum GroupDescriptionType {
  TDH = "TDH",
  REP = "REP",
  CIC = "CIC",
  LEVEL = "LEVEL",
  OWNS_NFTS = "OWNS_NFTS",
  WALLETS = "WALLETS",
}
