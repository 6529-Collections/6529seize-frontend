import { IProfileAndConsolidations } from "../../entities/IProfile";
import FilterBuilderTargetTDH from "./FilterBuilderTargetTDH";
import FilterBuilderTargetLevel from "./FilterBuilderTargetLevel";
import FilterBuilderRep from "./FilterBuilderRep";
import FilterBuilderCIC from "./FilterBuilderCIC";

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
  filters,
  onFilters,
}: {
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
      },
    });
  const setRepCategory = (newV: string | null) =>
    onFilters({ ...filters, rep: { ...filters.rep, category: newV } });
  const setMinRep = (newV: number | null) =>
    onFilters({ ...filters, rep: { ...filters.rep, min: newV } });
  const setMaxRep = (newV: number | null) =>
    onFilters({ ...filters, rep: { ...filters.rep, max: newV } });
  const setRepDirection = (newV: FilterDirection) =>
    onFilters({ ...filters, rep: { ...filters.rep, direction: newV } });

  const setCICUser = (newV: string | null) =>
    onFilters({
      ...filters,
      cic: {
        ...filters.cic,
        user: newV,
      },
    });
  const setMinCIC = (newV: number | null) =>
    onFilters({ ...filters, cic: { ...filters.cic, min: newV } });
  const setMaxCIC = (newV: number | null) =>
    onFilters({ ...filters, cic: { ...filters.cic, max: newV } });
  const setCICDirection = (newV: FilterDirection) =>
    onFilters({ ...filters, cic: { ...filters.cic, direction: newV } });

  return (
    <div className="tw-w-full tw-space-y-8 tw-mt-4">
      <div className="tw-wf-full tw-space-y-2">
        <FilterBuilderTargetTDH
          minTDH={filters.tdh.min}
          maxTDH={filters.tdh.max}
          setMinTDH={setMinTDH}
          setMaxTDH={setMaxTDH}
        />

        <FilterBuilderTargetLevel
          minLevel={filters.level.min}
          maxLevel={filters.level.max}
          setMinLevel={setMinLevel}
          setMaxLevel={setMaxLevel}
        />
      </div>

      <FilterBuilderRep
        user={filters.rep.user}
        category={filters.rep.category}
        minRep={filters.rep.min}
        maxRep={filters.rep.max}
        userDirection={filters.rep.direction}
        setUser={setRepUser}
        setCategory={setRepCategory}
        setMinRep={setMinRep}
        setMaxRep={setMaxRep}
        setUserDirection={setRepDirection}
      />

      <FilterBuilderCIC
        user={filters.cic.user}
        minCIC={filters.cic.min}
        maxCIC={filters.cic.max}
        userDirection={filters.cic.direction}
        setUser={setCICUser}
        setMinCIC={setMinCIC}
        setMaxCIC={setMaxCIC}
        setUserDirection={setCICDirection}
      />
    </div>
  );
}
