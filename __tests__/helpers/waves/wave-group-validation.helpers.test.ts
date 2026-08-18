import {
  getWaveGroupValidationRequest,
  getWaveUpdateGroupValidationRequest,
} from "@/helpers/waves/wave-group-validation.helpers";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWaveGroupRole } from "@/generated/models/ApiWaveGroupRole";

describe("wave group validation helpers", () => {
  it("preserves a public View scope as Everyone", () => {
    expect(
      getWaveGroupValidationRequest({
        groups: {
          canView: null,
          canDrop: null,
          canVote: null,
          canChat: null,
          admin: null,
        },
        waveType: ApiWaveType.Chat,
        chatEnabled: true,
      })
    ).toEqual({
      visibility_group_id: null,
      chat_group_id: null,
    });
  });

  it("checks only active Chat-wave roles and the default authenticated admin", () => {
    expect(
      getWaveGroupValidationRequest({
        groups: {
          canView: "view",
          canDrop: null,
          canVote: null,
          canChat: null,
          admin: null,
        },
        waveType: ApiWaveType.Chat,
        chatEnabled: true,
        includeAuthenticatedUserAsAdmin: true,
      })
    ).toEqual({
      visibility_group_id: "view",
      chat_group_id: null,
      include_authenticated_user_as_admin: true,
    });
  });

  it("includes open participation and voting scopes for non-Chat waves", () => {
    expect(
      getWaveGroupValidationRequest({
        groups: {
          canView: "view",
          canDrop: null,
          canVote: "vote",
          canChat: "chat",
          admin: "admin",
        },
        waveType: ApiWaveType.Rank,
        chatEnabled: false,
      })
    ).toEqual({
      visibility_group_id: "view",
      participation_group_id: null,
      voting_group_id: "vote",
      admin_group_id: "admin",
    });
  });

  it("builds an edit check from the complete Wave update body", () => {
    const body = {
      visibility: { scope: { group_id: "view" } },
      participation: { scope: { group_id: "drop" } },
      voting: { scope: { group_id: "vote" } },
      chat: { enabled: true, scope: { group_id: null } },
      wave: {
        type: ApiWaveType.Approve,
        admin_group: { group_id: "admin" },
      },
    } as never;
    const request = getWaveUpdateGroupValidationRequest(body);

    expect(request).toEqual({
      visibility_group_id: "view",
      participation_group_id: "drop",
      voting_group_id: "vote",
      chat_group_id: null,
      admin_group_id: "admin",
    });

    expect(
      getWaveUpdateGroupValidationRequest(body, [ApiWaveGroupRole.Chat])
    ).toEqual({
      visibility_group_id: "view",
      chat_group_id: null,
    });
  });

  it("checks the implicit authenticated admin when an edit has no admin group", () => {
    const body = {
      visibility: { scope: { group_id: "view" } },
      participation: { scope: { group_id: "drop" } },
      voting: { scope: { group_id: "vote" } },
      chat: { enabled: false, scope: { group_id: null } },
      wave: {
        type: ApiWaveType.Rank,
        admin_group: null,
      },
    } as never;

    expect(
      getWaveUpdateGroupValidationRequest(body, [ApiWaveGroupRole.Admin])
    ).toEqual({
      visibility_group_id: "view",
      include_authenticated_user_as_admin: true,
    });
  });
});
