export enum FilterDirection {
  RECEIVED = "RECEIVED",
  SENT = "SENT",
}

export interface FilterMinMax {
  readonly min: number | null;
  readonly max: number | null;
}

export interface FilterMinMaxDirectionAndUser extends FilterMinMax {
  readonly direction: FilterDirection;
  readonly user: string | null;
}

export interface RepFilter extends FilterMinMaxDirectionAndUser {
  readonly category: string | null;
}

export type TDHFilter = FilterMinMax;
export type CICFilter = FilterMinMaxDirectionAndUser;
export type LevelFilter = FilterMinMax;

export interface GeneralFilter {
  readonly tdh: TDHFilter;
  readonly rep: RepFilter;
  readonly cic: CICFilter;
  readonly level: LevelFilter;
}
