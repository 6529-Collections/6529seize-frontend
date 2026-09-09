import type { MentionAlias } from "@/entities/IMentionAlias";
import {
  fetchMentionAliases,
  normalizeMentionAliases,
} from "@/services/api/mention-aliases-api";
import { commonApiFetch } from "../../../services/api/common-api";

jest.mock("../../../services/api/common-api", () => ({
  commonApiDelete: jest.fn(),
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiPut: jest.fn(),
}));

const validAlias: MentionAlias = {
  id: "alias-1",
  alias: "collectors",
  members: [
    {
      profile_id: "profile-1",
      handle: "alice",
      pfp: null,
    },
  ],
};

describe("mention aliases API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an empty array for a malformed response", async () => {
    jest.mocked(commonApiFetch).mockResolvedValue({
      data: [],
      count: 0,
      page: 1,
      next: false,
    });

    await expect(fetchMentionAliases()).resolves.toEqual([]);
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "mention-aliases",
    });
  });

  it("keeps only complete alias records", () => {
    expect(
      normalizeMentionAliases([
        validAlias,
        { id: "alias-2", alias: "broken", members: {} },
      ])
    ).toEqual([validAlias]);
  });

  it("drops aliases containing malformed member records", () => {
    expect(
      normalizeMentionAliases([
        validAlias,
        {
          id: "alias-2",
          alias: "broken-member",
          members: [{ profile_id: "profile-2", handle: "bob" }],
        },
      ])
    ).toEqual([validAlias]);
  });
});
