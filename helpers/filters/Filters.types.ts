import { GroupFilterDirection } from "../../generated/models/GroupFilterDirection";


export interface FilterMinMax {
  readonly min: number | null;
  readonly max: number | null;
}

export interface FilterMinMaxDirectionAndUser extends FilterMinMax {
  readonly direction: GroupFilterDirection;
  readonly user: string | null;
}

export interface RepFilter extends FilterMinMaxDirectionAndUser {
  readonly category: string | null;
}

export type TDHFilter = FilterMinMax;
export type CICFilter = FilterMinMaxDirectionAndUser;
export type LevelFilter = FilterMinMax;

