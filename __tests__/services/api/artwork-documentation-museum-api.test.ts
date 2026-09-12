import {
  appendMuseumRecord,
  getMuseumRecords,
  type MuseumRecordInput,
} from "@/services/api/artwork-documentation-museum-api";
import { ApiArtworkMuseumRecordInputEventStatusEnum } from "@/generated/models/ApiArtworkMuseumRecordInput";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../services/api/common-api";
jest.unmock("@/services/api/artwork-documentation-museum-api");
jest.mock("../../../services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));
it("sends the next journal cursor under the backend before parameter", async () => {
  await getMuseumRecords("context", "opaque-page-token");
  expect(commonApiFetch).toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: "artwork-documentation/contexts/context/museum-records",
      params: { before: "opaque-page-token" },
      cache: "no-store",
    })
  );
  await getMuseumRecords("context");
  expect(commonApiFetch).toHaveBeenLastCalledWith(
    expect.objectContaining({ params: {} })
  );
});

it("sends journal references as JSON arrays despite the generated unique-items Set type", async () => {
  const payload: MuseumRecordInput = {
    kind: "accession",
    title: "Recorded accession",
    event_status: ApiArtworkMuseumRecordInputEventStatusEnum.Completed,
    subject_ids: ["subject"],
    evidence_asset_ids: ["file"],
    details: {},
  };
  await appendMuseumRecord("context", 3, payload, "retry-key");
  expect(commonApiPost).toHaveBeenCalledWith(
    expect.objectContaining({ body: payload })
  );
  expect(
    JSON.parse(
      JSON.stringify(jest.mocked(commonApiPost).mock.calls[0]?.[0].body)
    )
  ).toMatchObject({
    subject_ids: ["subject"],
    evidence_asset_ids: ["file"],
  });
});
