/** @jest-environment node */

import { getMemesMintingRoots } from "@/services/api/memes-minting-claims-api";
import { commonApiFetch } from "@/services/api/common-api";
import { createDeferredPromise } from "../../utils/deferredPromise";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

test("does not share roots requests across server renders", async () => {
  const response = createDeferredPromise<[]>();
  const fetchRoots = jest.mocked(commonApiFetch);
  fetchRoots.mockReturnValue(response.promise);
  const first = getMemesMintingRoots(123);
  const second = getMemesMintingRoots(123);

  try {
    expect(fetchRoots).toHaveBeenCalledTimes(2);
  } finally {
    response.resolve([]);
    await Promise.all([first, second]);
  }
});
