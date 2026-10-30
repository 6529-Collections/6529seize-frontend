import {
  createInitialState,
  formReducer,
} from "@/components/waves/memes/submission/hooks/artworkSubmissionFormState";
import { transformToApiRequest } from "@/components/waves/memes/submission/utils/artworkSubmissionRequest";

it("keeps multiple invitations across form steps and includes their IDs in the signed submission payload", () => {
  const profiles = ["B", "C"].map((id) => ({
    id,
    handle: id,
    display: id,
    pfp: null,
  }));
  const initial = createInitialState({});
  const selected = formReducer(initial, {
    type: "SET_COLLABORATORS",
    payload: profiles,
  });
  const edited = formReducer(selected, {
    type: "SET_TRAIT_FIELD",
    payload: { field: "title", value: "Artwork" },
  });
  expect(edited.collaborators).toEqual(profiles);
  const request = transformToApiRequest({
    collaboratorIds: profiles.map((profile) => profile.id),
    waveId: "wave",
    traits: { ...edited.traits, collab: true },
    media: { url: "https://example.com/art.png", mime_type: "image/png" },
    signerAddress: "0x0000000000000000000000000000000000000001",
    isSafeSignature: false,
  });
  expect(request.collaborator_ids).toEqual(["B", "C"]);
  expect(request.mentioned_users).toEqual([]);
  expect(
    request.metadata.find((item) => item.data_key === "collab")?.data_value
  ).toBe("false");
  expect(createInitialState({}).collaborators).toEqual([]);
});
