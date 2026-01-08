import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";

export interface DropdownSortOption {
  label: string;
  primarySort: ApiCommunityMembersSortOption;
  secondarySort: ApiCommunityMembersSortOption;
  primaryLabel: string;
  secondaryLabel: string;
}

export interface SimpleSortOption {
  value: ApiCommunityMembersSortOption;
  label: string;
}

export const DROPDOWN_SORT_OPTIONS: DropdownSortOption[] = [
  {
    label: "TDH",
    primarySort: ApiCommunityMembersSortOption.Tdh,
    secondarySort: ApiCommunityMembersSortOption.TdhRate,
    primaryLabel: "Value",
    secondaryLabel: "Rate",
  },
  {
    label: "xTDH",
    primarySort: ApiCommunityMembersSortOption.Xtdh,
    secondarySort: ApiCommunityMembersSortOption.XtdhRate,
    primaryLabel: "Value",
    secondaryLabel: "Rate",
  },
  {
    label: "Combined TDH",
    primarySort: ApiCommunityMembersSortOption.CombinedTdh,
    secondarySort: ApiCommunityMembersSortOption.CombinedTdhRate,
    primaryLabel: "Value",
    secondaryLabel: "Rate",
  },
  {
    label: "xTDH Grants",
    primarySort: ApiCommunityMembersSortOption.XtdhIncoming,
    secondarySort: ApiCommunityMembersSortOption.XtdhOutgoing,
    primaryLabel: "In",
    secondaryLabel: "Out",
  },
];

export const SIMPLE_SORT_OPTIONS: SimpleSortOption[] = [
  { value: ApiCommunityMembersSortOption.Level, label: "Level" },
  { value: ApiCommunityMembersSortOption.Rep, label: "REP" },
  { value: ApiCommunityMembersSortOption.Cic, label: "NIC" },
];

export function getDropdownDisplayLabel(
  option: DropdownSortOption,
  activeSort: ApiCommunityMembersSortOption
): string {
  const isSecondaryActive = activeSort === option.secondarySort && option.primarySort !== option.secondarySort;
  if (isSecondaryActive) {
    return `${option.label} (${option.secondaryLabel})`;
  }
  if (activeSort === option.primarySort) {
    return `${option.label} (${option.primaryLabel})`;
  }
  return option.label;
}

export function getDropdownActiveState(
  option: DropdownSortOption,
  activeSort: ApiCommunityMembersSortOption
): { isPrimaryActive: boolean; isSecondaryActive: boolean; isActive: boolean } {
  const isPrimaryActive = activeSort === option.primarySort;
  const isSecondaryActive = activeSort === option.secondarySort && option.primarySort !== option.secondarySort;
  const isActive = isPrimaryActive || isSecondaryActive;
  return { isPrimaryActive, isSecondaryActive, isActive };
}
