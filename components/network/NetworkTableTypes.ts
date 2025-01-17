import { SortDirection } from "../../entities/ISort";

export enum NetworkTableSort {
  LEVEL = "level",
  TDH = "tdh",
  REP = "rep",
  NIC = "nic",
  ACTIVE = "active"
}

export interface NetworkMember {
  readonly rank: number;
  readonly handle: string;
  readonly profileImage: string;
  readonly level: number;
  readonly tdh: number;
  readonly rep: number;
  readonly nic: number;
  readonly active: boolean;
}

export interface NetworkTableSortState {
  readonly sort: NetworkTableSort;
  readonly sort_direction: SortDirection;
} 