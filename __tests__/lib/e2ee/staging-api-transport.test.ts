/** @jest-environment node */
import { buildE2eeApiClient } from "@/lib/e2ee/api-client";
import { E2eeApiError } from "@/lib/e2ee/api-errors";
import { buildStagingQaApi } from "../../../tests/support/staging-e2ee/api-transport";

const headers = {
  authorization: "qa-wallet-credential",
  "x-6529-auth": "qa-staging-credential",
};
const runtime = { buildE2eeApiClient, E2eeApiError };

it("preserves both staging credentials and refuses redirects", async () => {
  const response = { profile_id: "qa" };
  const fetch = jest.fn().mockResolvedValue({
    ok: () => true,
    status: () => 200,
    json: async () => response,
  });
  const api = buildStagingQaApi({ fetch }, headers, runtime);
  expect(await api.getMe()).toEqual(response);
  expect(fetch).toHaveBeenCalledWith(
    "https://api.staging.6529.io/api/e2ee/me",
    { method: "GET", headers, maxRedirects: 0 }
  );
});

it("reports status and structured codes without response bodies or credentials", async () => {
  const fetch = jest.fn().mockResolvedValue({
    ok: () => false,
    status: () => 401,
    json: async () => ({ code: "E2EE_UNAUTHORIZED", ...headers }),
  });
  const api = buildStagingQaApi({ fetch }, headers, runtime);
  await expect(api.getMe()).rejects.toMatchObject({
    name: "E2eeApiError",
    status: 401,
    code: "E2EE_UNAUTHORIZED",
    message: "Staging QA API GET failed (HTTP 401, E2EE_UNAUTHORIZED)",
  });
  fetch.mockResolvedValue({
    ok: () => false,
    status: () => 401,
    json: async () => ({ code: headers.authorization }),
  });
  await expect(api.getMe()).rejects.toMatchObject({
    code: null,
    message: "Staging QA API GET failed (HTTP 401)",
  });
  fetch.mockRejectedValue(new Error(JSON.stringify(headers)));
  await expect(api.getMe()).rejects.toThrow(/^Staging QA transport failed$/u);
});

it("retains the epoch hint used to recover from a concurrent group update", async () => {
  const fetch = jest.fn().mockResolvedValue({
    ok: () => false,
    status: () => 409,
    json: async () => ({ code: "E2EE_EPOCH_CONFLICT", current_epoch: 12 }),
  });
  const api = buildStagingQaApi({ fetch }, headers, runtime);
  await expect(api.getGroup("g", "device")).rejects.toMatchObject({
    status: 409,
    code: "E2EE_EPOCH_CONFLICT",
    currentEpoch: 12,
  });
});

it("redacts malformed response bodies while retaining failed HTTP status", async () => {
  const fetch = jest.fn().mockResolvedValue({
    ok: () => false,
    status: () => 503,
    json: async () => {
      throw new SyntaxError(JSON.stringify(headers));
    },
  });
  const api = buildStagingQaApi({ fetch }, headers, runtime);
  await expect(api.getMe()).rejects.toMatchObject({
    name: "E2eeApiError",
    status: 503,
    code: null,
    message: "Staging QA API GET failed (HTTP 503)",
  });
  fetch.mockResolvedValue({
    ok: () => true,
    status: () => 200,
    json: async () => {
      throw new SyntaxError(JSON.stringify(headers));
    },
  });
  await expect(api.getMe()).rejects.toThrow(
    /^Staging QA API GET returned invalid JSON$/u
  );
});
