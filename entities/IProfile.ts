export interface IProfileConsolidation {
  readonly wallet: `0x${string}`;
  readonly tdh: number;
}

export interface IProfileAndConsolidations {
  readonly profile: IProfile | null;
  readonly consolidation: {
    wallets: IProfileConsolidation[];
    tdh: number;
  };
}

export interface IProfile {
  readonly normalised_handle: string;
  readonly handle: string;
  readonly primary_wallet: `0x${string}`;
  readonly created_at: Date;
  readonly created_by_wallet: string;
  readonly updated_at?: Date | undefined;
  readonly updated_by_wallet?: string | undefined;
  readonly pfp_url?: string | undefined;
  readonly banner_1?: string | undefined;
  readonly banner_2?: string | undefined;
  readonly website?: string | undefined;
}
