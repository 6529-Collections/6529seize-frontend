import { IProfileAndConsolidations } from "../../entities/IProfile";
import FilterBuilderTargetTDH from "./FilterBuilderTargetTDH";
import FilterBuilderTargetLevel from "./FilterBuilderTargetLevel";
import FilterBuilderRep from "./FilterBuilderRep";
import FilterBuilderCIC from "./FilterBuilderCIC";
import { useEffect, useState } from "react";

export enum FilterDirection {
  RECEIVED = "RECEIVED",
  SENT = "SENT",
}

export interface FilterMinMax {
  readonly min: number | null;
  readonly max: number | null;
}

export interface FilterMinMaxDirectionAndUser extends FilterMinMax {
  readonly direction: FilterDirection | null;
  readonly user: string | null;
}

export interface FilterRep extends FilterMinMaxDirectionAndUser {
  readonly category: string | null;
}

export interface GeneralFilter {
  readonly tdh: FilterMinMax;
  readonly rep: FilterRep;
  readonly cic: FilterMinMaxDirectionAndUser;
  readonly level: FilterMinMax;
}

export default function FilterBuilder({
  profile,
  filters,
  onFilters,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly filters: GeneralFilter;
  readonly onFilters: (filters: GeneralFilter) => void;
}) {
  const setMinTDH = (newV: number | null) =>
    onFilters({ ...filters, tdh: { ...filters.tdh, min: newV } });
  const setMaxTDH = (newV: number | null) =>
    onFilters({ ...filters, tdh: { ...filters.tdh, max: newV } });
  const setMinLevel = (newV: number | null) =>
    onFilters({ ...filters, level: { ...filters.level, min: newV } });
  const setMaxLevel = (newV: number | null) =>
    onFilters({ ...filters, level: { ...filters.level, max: newV } });
  const setRepUser = (newV: string | null) =>
    onFilters({
      ...filters,
      rep: {
        ...filters.rep,
        user: newV,
        direction: newV ? filters.rep.direction ?? FilterDirection.SENT : null,
      },
    });
  const setRepCategory = (newV: string | null) =>
    onFilters({ ...filters, rep: { ...filters.rep, category: newV } });
  const setMinRep = (newV: number | null) =>
    onFilters({ ...filters, rep: { ...filters.rep, min: newV } });
  const setMaxRep = (newV: number | null) =>
    onFilters({ ...filters, rep: { ...filters.rep, max: newV } });
  const setRepDirection = (newV: FilterDirection | null) =>
    onFilters({ ...filters, rep: { ...filters.rep, direction: newV } });

  const setRepFromUser = (newV: boolean) => {
    if (!filters.rep.user) {
      setRepDirection(null);
      return;
    }
    setRepDirection(newV ? FilterDirection.SENT : FilterDirection.RECEIVED);
  };

  const setCICUser = (newV: string | null) =>
    onFilters({
      ...filters,
      cic: {
        ...filters.cic,
        user: newV,
        direction: newV ? filters.rep.direction ?? FilterDirection.SENT : null,
      },
    });
  const setMinCIC = (newV: number | null) =>
    onFilters({ ...filters, cic: { ...filters.cic, min: newV } });
  const setMaxCIC = (newV: number | null) =>
    onFilters({ ...filters, cic: { ...filters.cic, max: newV } });
  const setCICDirection = (newV: FilterDirection | null) =>
    onFilters({ ...filters, cic: { ...filters.cic, direction: newV } });
  const setCICFromUser = (newV: boolean) => {
    if (!filters.cic.user) {
      setCICDirection(null);
      return;
    }
    setCICDirection(newV ? FilterDirection.SENT : FilterDirection.RECEIVED);
  };

  return (
    <div>
      <br />
      <FilterBuilderTargetTDH
        minTDH={filters.tdh.min}
        maxTDH={filters.tdh.max}
        setMinTDH={setMinTDH}
        setMaxTDH={setMaxTDH}
      />
      <br />
      <FilterBuilderTargetLevel
        minLevel={filters.level.min}
        maxLevel={filters.level.max}
        setMinLevel={setMinLevel}
        setMaxLevel={setMaxLevel}
      />
      <br />
      <FilterBuilderRep
        user={filters.rep.user}
        category={filters.rep.category}
        minRep={filters.rep.min}
        maxRep={filters.rep.max}
        isFromUser={filters.rep.direction === FilterDirection.SENT}
        setUser={setRepUser}
        setCategory={setRepCategory}
        setMinRep={setMinRep}
        setMaxRep={setMaxRep}
        setIsFromUser={setRepFromUser}
      />
      <br />
      <FilterBuilderCIC
        user={filters.cic.user}
        minCIC={filters.cic.min}
        maxCIC={filters.cic.max}
        isFromUser={filters.cic.direction === FilterDirection.SENT}
        setUser={setCICUser}
        setMinCIC={setMinCIC}
        setMaxCIC={setMaxCIC}
        setIsFromUser={setCICFromUser}
      />
      <br />
    </div>
  );
}
