import type { ApiXTdhGrantsPage } from "@/generated/models/ApiXTdhGrantsPage";
import type { GrantedFilterStatuses } from "@/components/user/xtdh/user-page-xtdh-granted-list/types";

export interface UserPageXtdhGrantedListContentProps {
  readonly enabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string | undefined;
  readonly grants: ApiXTdhGrantsPage["data"];
  readonly isSelf: boolean;
  readonly onRetry: () => void;
  readonly statuses: GrantedFilterStatuses;
}
