import { getComposerMediaUploadPurpose } from "@/components/waves/create-drop-content/content-helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import {
  ActiveDropAction,
  type ActiveDropState,
} from "@/types/dropInteractionTypes";

const activeDrop = (action: ActiveDropAction): ActiveDropState => ({
  action,
  drop: { id: "drop-1" } as ApiDrop,
  partId: 1,
});

describe("getComposerMediaUploadPurpose", () => {
  it("uploads drop-mode media as a decision entry", () => {
    expect(getComposerMediaUploadPurpose(true, null)).toBe(
      ApiMediaUploadPurpose.DecisionEntry
    );
    expect(
      getComposerMediaUploadPurpose(true, activeDrop(ActiveDropAction.QUOTE))
    ).toBe(ApiMediaUploadPurpose.DecisionEntry);
  });

  it("uploads chat and drop-mode replies as chat", () => {
    expect(getComposerMediaUploadPurpose(false, null)).toBe(
      ApiMediaUploadPurpose.Chat
    );
    expect(
      getComposerMediaUploadPurpose(true, activeDrop(ActiveDropAction.REPLY))
    ).toBe(ApiMediaUploadPurpose.Chat);
  });
});
