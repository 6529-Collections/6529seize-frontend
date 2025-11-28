import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import type { GrantedFilterStatuses } from "@/components/user/xtdh/user-page-xtdh-granted-list/types";

export interface UserPageXtdhGrantedListContentProps {
  readonly enabled: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string;
  readonly grants: ApiTdhGrantsPage["data"];
  readonly isSelf: boolean;
  readonly onRetry: () => void;
  readonly statuses: GrantedFilterStatuses;
}
