import type { ApiXTdhContribution } from "@/generated/models/ApiXTdhContribution";

interface UseXtdhTokenContributorsListStateParams {
  readonly contributors: ApiXTdhContribution[];
  readonly isEnabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

interface XtdhTokenContributorsListState {
  readonly isDisabled: boolean;
  readonly showInitialLoading: boolean;
  readonly showInitialError: boolean;
  readonly showEmptyState: boolean;
  readonly hasContributors: boolean;
}

export function useXtdhTokenContributorsListState({
  contributors,
  isEnabled,
  isLoading,
  isError,
}: Readonly<UseXtdhTokenContributorsListStateParams>): XtdhTokenContributorsListState {
  const hasContributors = contributors.length > 0;
  const showInitialLoading = isLoading && !hasContributors;
  const showInitialError = isError && !hasContributors;
  const showEmptyState =
    !isLoading && !isError && !hasContributors && isEnabled;

  return {
    isDisabled: !isEnabled,
    showInitialLoading,
    showInitialError,
    showEmptyState,
    hasContributors,
  };
}
