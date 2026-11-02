import { updateWaveHub } from "@/services/api/wave-hub-api";
import { commonApiPatch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({ commonApiPatch: jest.fn() }));

it("sends only the changed wave field through the v3 PATCH endpoint", async () => {
  await updateWaveHub("wave-1", { picture: null });
  expect(commonApiPatch).toHaveBeenCalledWith({
    endpoint: "v3/waves/wave-1",
    body: { picture: null },
    errorMode: "structured",
  });
});
