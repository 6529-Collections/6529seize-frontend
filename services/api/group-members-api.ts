import type { ApiCommunityMembersPage } from "@/generated/models/ApiCommunityMembersPage";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiGroupMembersPreviewRequest } from "@/generated/models/ApiGroupMembersPreviewRequest";
import { SortDirection } from "@/entities/ISort";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

export const GROUP_MEMBERS_SEARCH_MAX_LENGTH = 200;

export type GroupMembersPreviewTarget =
  | {
      readonly kind: "saved";
      readonly group: ApiGroupFull;
    }
  | {
      readonly kind: "draft";
      readonly group: ApiCreateGroupDescription;
      readonly name: string;
      readonly summary: string;
    };

interface GroupMembersPageParams {
  readonly page: number;
  readonly pageSize: number;
  readonly param?: string | undefined;
}

interface GroupMembersApiQuery {
  readonly page: number;
  readonly page_size: number;
  readonly sort: ApiCommunityMembersSortOption;
  readonly sort_direction: SortDirection;
  readonly group_id?: string | undefined;
  readonly param?: string | undefined;
}

function buildGroupMembersQuery(
  params: GroupMembersPageParams,
  groupId?: string
): GroupMembersApiQuery {
  const searchParam = params.param?.slice(0, GROUP_MEMBERS_SEARCH_MAX_LENGTH);
  return {
    page: params.page,
    page_size: params.pageSize,
    sort: ApiCommunityMembersSortOption.Display,
    sort_direction: SortDirection.ASC,
    ...(groupId ? { group_id: groupId } : {}),
    ...(searchParam ? { param: searchParam } : {}),
  };
}

export async function fetchSavedGroupMembersPage({
  groupId,
  params,
  signal,
}: {
  readonly groupId: string;
  readonly params: GroupMembersPageParams;
  readonly signal?: AbortSignal | undefined;
}): Promise<ApiCommunityMembersPage> {
  return await commonApiFetch<ApiCommunityMembersPage, GroupMembersApiQuery>({
    endpoint: "community-members/top",
    params: buildGroupMembersQuery(params, groupId),
    signal,
  });
}

export function getGroupMembersTargetKey(
  target: GroupMembersPreviewTarget
): readonly unknown[] {
  return target.kind === "saved"
    ? [target.kind, target.group.id]
    : [target.kind, target.group];
}

export function getGroupMembersTargetName(
  target: GroupMembersPreviewTarget
): string {
  return target.kind === "saved" ? target.group.name : target.name;
}

export async function fetchGroupMembersPage({
  target,
  params,
  signal,
}: {
  readonly target: GroupMembersPreviewTarget;
  readonly params: GroupMembersPageParams;
  readonly signal?: AbortSignal | undefined;
}): Promise<ApiCommunityMembersPage> {
  if (target.kind === "saved") {
    return await fetchSavedGroupMembersPage({
      groupId: target.group.id,
      params,
      signal,
    });
  }

  return await commonApiPost<
    ApiGroupMembersPreviewRequest,
    ApiCommunityMembersPage,
    GroupMembersApiQuery
  >({
    endpoint: "groups/preview-members",
    body: { group: target.group },
    params: buildGroupMembersQuery(params),
    signal,
  });
}
