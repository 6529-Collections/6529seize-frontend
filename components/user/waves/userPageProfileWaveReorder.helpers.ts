export const getProfileWaveReorderGate = ({
  canClear,
  canManageCuration,
  dropCount,
  hasProfileCuration,
  isDropsFetching,
  isPermissionLoading,
}: {
  readonly canClear: boolean;
  readonly canManageCuration: boolean;
  readonly dropCount: number;
  readonly hasProfileCuration: boolean;
  readonly isDropsFetching: boolean;
  readonly isPermissionLoading: boolean;
}) => {
  const canLoadReorderGate = canClear && hasProfileCuration;
  const isLoadingDrops =
    canLoadReorderGate && dropCount === 0 && isDropsFetching;
  const isLoadingPermission =
    canLoadReorderGate && dropCount > 1 && isPermissionLoading;
  const isLoading = isLoadingDrops || isLoadingPermission;
  const canReorder = canClear && canManageCuration && dropCount > 1;

  return {
    canReorder,
    isLoading,
    shouldShowButton: canReorder || isLoading,
  };
};
