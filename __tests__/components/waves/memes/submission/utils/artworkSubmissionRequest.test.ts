import { transformToApiRequest } from "@/components/waves/memes/submission/utils/artworkSubmissionRequest";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  createInitialState,
  formReducer,
} from "@/components/waves/memes/submission/hooks/artworkSubmissionFormState";
import { buildMemesSubmissionDraftFromDrop } from "@/components/waves/memes/submission/utils/submissionDraft";

describe("transformToApiRequest", () => {
  it("round-trips a plan through submission metadata and resubmission, excluding unchecked drafts", () => {
    const plan =
      "If selected, send prints to five voters.\nShipping is included.";
    let state = createInitialState({});
    state = formReducer(state, {
      type: "SET_ADDITIONAL_ACTION_PLAN",
      payload: plan,
    });
    state = formReducer(state, {
      type: "SET_ADDITIONAL_ACTION_PROMISED",
      payload: true,
    });
    const input = {
      waveId: "main-stage",
      traits: { ...state.traits, title: "Artwork", description: "Description" },
      operationalData: state.operationalData,
      media: { url: "https://cdn.example/art.png", mime_type: "image/png" },
      signerAddress: "0x0000000000000000000000000000000000000001",
      isSafeSignature: false,
    };
    const request = transformToApiRequest({
      ...input,
      isAdditionalActionPromised: state.isAdditionalActionPromised,
    });
    expect(request.metadata).toContainEqual({
      data_key: "additional_action_plan",
      data_value: plan,
    });
    const draft = buildMemesSubmissionDraftFromDrop(
      request as unknown as ApiDrop
    );
    expect(draft.isAdditionalActionPromised).toBe(true);
    expect(draft.operationalData.additional_action_plan).toBe(plan);
    expect(draft.operationalData.about_artist).toBe("");
    const unchecked = transformToApiRequest({
      ...input,
      isAdditionalActionPromised: false,
    });
    expect(unchecked.is_additional_action_promised).toBe(false);
    expect(
      unchecked.metadata.some(
        (item) => item.data_key === "additional_action_plan"
      )
    ).toBe(false);
  });

  it("preserves the upload reference and strips response-only media fields", () => {
    const request = transformToApiRequest({
      waveId: "main-stage",
      traits: {
        title: "  Artwork  ",
        description: "Description",
      } as TraitsData,
      media: {
        url: "https://cdn.example/drops/artwork.png",
        mime_type: "image/png",
        media_upload_id: "upload-123",
        media_status: ApiDropMediaStatus.Ready,
        media_error: "response-only detail",
      },
      signerAddress: "0x0000000000000000000000000000000000000001",
      isSafeSignature: false,
    });

    expect(request.parts[0]?.media[0]).toEqual({
      url: "https://cdn.example/drops/artwork.png",
      mime_type: "image/png",
      media_upload_id: "upload-123",
    });
    expect(request.title).toBe("Artwork");
  });
});
