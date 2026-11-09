import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import { getDropMediaUploadPurpose } from "@/services/uploads/mediaUploadPurpose";

describe("getDropMediaUploadPurpose", () => {
  it("keeps the original file for a decision entry", () => {
    expect(
      getDropMediaUploadPurpose({ drop_type: ApiDropType.Participatory })
    ).toBe(ApiMediaUploadPurpose.DecisionEntry);
  });

  it("treats a participatory reply as chat, since it is not a decision entry", () => {
    expect(
      getDropMediaUploadPurpose({
        drop_type: ApiDropType.Participatory,
        reply_to: { drop_id: "drop-1", drop_part_id: 1 },
      })
    ).toBe(ApiMediaUploadPurpose.Chat);
  });

  it.each([ApiDropType.Chat, ApiDropType.Winner, undefined])(
    "treats a %s drop as chat",
    (dropType) => {
      expect(getDropMediaUploadPurpose({ drop_type: dropType })).toBe(
        ApiMediaUploadPurpose.Chat
      );
    }
  );
});
