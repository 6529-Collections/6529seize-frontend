import type { ApiXTdhContribution } from "@/generated/models/ApiXTdhContribution";

import { InlineRetry, ListError, ListMessage } from "../../subcomponents/XtdhTokensFallbacks";
import { XtdhTokensSkeleton } from "../../subcomponents/XtdhTokensSkeleton";
import {
  TOKEN_CONTRIBUTORS_GROUP_BY_LABELS,
  type XtdhTokenContributorsGroupBy,
} from "@/components/xtdh/received/constants";
import { useXtdhTokenContributorsListState } from "../hooks/useXtdhTokenContributorsListState";
import { XtdhTokenContributorsListItem } from "./XtdhTokenContributorsListItem";

interface XtdhTokenContributorsListProps {
  readonly contributors: ApiXTdhContribution[];
  readonly groupBy: XtdhTokenContributorsGroupBy;
  readonly isEnabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string;
  readonly onRetry: () => void;
  readonly onSelectGrant: (grantId: string, label: string) => void;
}

export function XtdhTokenContributorsList({
  contributors,
  groupBy,
  isEnabled,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onSelectGrant,
}: Readonly<XtdhTokenContributorsListProps>) {
  const {
    isDisabled,
    showInitialLoading,
    showInitialError,
    showEmptyState,
    hasContributors,
  } = useXtdhTokenContributorsListState({
    contributors,
    isEnabled,
    isLoading,
    isError,
  });

  if (isDisabled) {
    return (
      <ListMessage>
        Unable to load contributors for this token. Please try again later.
      </ListMessage>
    );
  }

  if (showInitialLoading) {
    return <XtdhTokensSkeleton />;
  }

  if (showInitialError) {
    return (
      <ListError
        message={errorMessage ?? "Failed to load contributors."}
        onRetry={onRetry}
      />
    );
  }

  if (showEmptyState) {
    return (
      <ListMessage>
        No {TOKEN_CONTRIBUTORS_GROUP_BY_LABELS[groupBy].toLowerCase()} data was returned for
        this token.
      </ListMessage>
    );
  }

  return (
    <div className="tw-space-y-3">
      <ul className="tw-m-0 tw-flex tw-flex-col tw-gap-3 tw-p-0">
        {contributors.map((contribution, index) => {
          const key =
            contribution.grant?.id ?? contribution.grantor?.id ?? index;
          return (
            <XtdhTokenContributorsListItem
              key={key}
              contribution={contribution}
              onSelectGrant={onSelectGrant}
            />
          );
        })}
      </ul>
      {isError && hasContributors ? (
        <InlineRetry
          message={errorMessage ?? "Unable to load more contributors."}
          onRetry={onRetry}
        />
      ) : null}
    </div>
  );
}
