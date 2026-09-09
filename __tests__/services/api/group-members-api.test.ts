import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { getOnlyMeGroupDescription } from "@/components/waves/create-wave/services/waveGroupService";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  fetchGroupMembersPage,
  GROUP_MEMBERS_SEARCH_MAX_LENGTH,
} from "@/services/api/group-members-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const page = { data: [], count: 0, page: 1, next: false };

describe("group members API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(commonApiFetch).mockResolvedValue(page);
    jest.mocked(commonApiPost).mockResolvedValue(page);
  });

  it("uses the saved group member endpoint", async () => {
    await fetchGroupMembersPage({
      target: {
        kind: "saved",
        group: { id: "group-1", name: "Collectors" } as ApiGroupFull,
      },
      params: { page: 2, pageSize: 20, param: "alice" },
    });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "community-members/top",
        params: expect.objectContaining({
          page: 2,
          page_size: 20,
          group_id: "group-1",
          param: "alice",
        }),
      })
    );
    expect(commonApiPost).not.toHaveBeenCalled();
  });

  it("posts draft criteria to the read-only preview endpoint", async () => {
    const group = getOnlyMeGroupDescription("0xcreator");
    await fetchGroupMembersPage({
      target: { kind: "draft", group, name: "Draft", summary: "1 rule" },
      params: { page: 1, pageSize: 20, param: "alice" },
    });

    expect(commonApiPost).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "groups/preview-members",
        body: { group },
        params: expect.objectContaining({
          page: 1,
          page_size: 20,
          param: "alice",
        }),
      })
    );
    expect(commonApiFetch).not.toHaveBeenCalled();
  });

  it("accepts a 200-character search parameter", async () => {
    const param = "a".repeat(GROUP_MEMBERS_SEARCH_MAX_LENGTH);

    await fetchGroupMembersPage({
      target: {
        kind: "saved",
        group: { id: "group-1", name: "Collectors" } as ApiGroupFull,
      },
      params: { page: 1, pageSize: 20, param },
    });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ param }),
      })
    );
  });

  it("truncates a 201-character search parameter before sending it", async () => {
    const param = "a".repeat(GROUP_MEMBERS_SEARCH_MAX_LENGTH + 1);

    await fetchGroupMembersPage({
      target: {
        kind: "saved",
        group: { id: "group-1", name: "Collectors" } as ApiGroupFull,
      },
      params: { page: 1, pageSize: 20, param },
    });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          param: "a".repeat(GROUP_MEMBERS_SEARCH_MAX_LENGTH),
        }),
      })
    );
  });
});
