import {
  ActivityLogParams,
  ActivityLogParamsConverted,
} from "@/components/profile-activity/ProfileActivityLogs";
import { FilterTargetType } from "@/components/utils/CommonFilterTargetSelect";

export const convertActivityLogParams = ({
  params,
  disableActiveGroup,
}: {
  readonly params: ActivityLogParams;
  readonly disableActiveGroup: boolean;
}): ActivityLogParamsConverted => {
  const converted: ActivityLogParamsConverted = {
    page: `${params.page}`,
    page_size: `${params.pageSize}`,
    log_type: params.logTypes?.length
      ? [...params.logTypes].sort((a, b) => a.localeCompare(b)).join(",")
      : "",
  };

  if (params.matter) {
    converted.rating_matter = params.matter;
  }
  if (params.groupId && !params.handleOrWallet && !disableActiveGroup) {
    converted.group_id = params.groupId;
  }

  if (!params.handleOrWallet) {
    return converted;
  }

  if (params.targetType === FilterTargetType.ALL) {
    converted.include_incoming = "true";
    converted.profile = params.handleOrWallet;
    return converted;
  }

  if (params.targetType === FilterTargetType.INCOMING) {
    converted.target = params.handleOrWallet;
    return converted;
  }

  if (params.targetType === FilterTargetType.OUTGOING) {
    converted.profile = params.handleOrWallet;
    return converted;
  }

  return converted;
};
