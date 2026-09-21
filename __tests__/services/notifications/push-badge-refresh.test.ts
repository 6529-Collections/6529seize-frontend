import { requestPushBadgeRefresh } from "@/services/notifications/push-badge-refresh";
import { getPushInstallationBadgeRefreshRequest } from "@/services/notifications/push-installation";
import { commonApiPost } from "@/services/api/common-api";
jest.mock("@/services/notifications/push-installation", () => ({
  getPushInstallationBadgeRefreshRequest: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
const registration = { deviceId: "phone", token: "token", authKey: "auth-A" };
const body = {
  device_id: "phone",
  installation_secret: "a".repeat(64),
  revision: 2,
};
const post = jest.mocked(commonApiPost);
const proof = jest.mocked(getPushInstallationBadgeRefreshRequest);
beforeEach(() => {
  jest.clearAllMocks();
  proof.mockReset().mockResolvedValue(body);
  post.mockReset().mockResolvedValue({ queued: true });
});
it("coalesces overlapping requests and sends only installation proof", async () => {
  let finish!: (value: unknown) => void;
  post.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const a = requestPushBadgeRefresh(registration, () => true);
  const b = requestPushBadgeRefresh(registration, () => true);
  await Promise.resolve();
  expect(post).toHaveBeenCalledTimes(1);
  expect(post).toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: "push-notifications/installations/badge-refresh",
      includeWalletAuth: false,
      body,
    })
  );
  finish({ queued: true });
  await Promise.all([a, b]);
  await requestPushBadgeRefresh(registration, () => true);
  expect(post).toHaveBeenCalledTimes(2);
});
it("does not send after activation or authentication becomes obsolete during storage access", async () => {
  await requestPushBadgeRefresh(registration, () => false);
  expect(post).not.toHaveBeenCalled();
});
it("does not send when the registration proof is no longer current", async () => {
  proof.mockResolvedValue(null);
  await requestPushBadgeRefresh(registration, () => true);
  expect(post).not.toHaveBeenCalled();
});
it.each([403, 409, 500])(
  "releases failed requests (%s) for a later activation without clearing state",
  async (status) => {
    post.mockRejectedValueOnce({ status });
    await expect(
      requestPushBadgeRefresh(registration, () => true)
    ).rejects.toEqual({ status });
    await requestPushBadgeRefresh(registration, () => true);
    expect(post).toHaveBeenCalledTimes(2);
  }
);
it("aborts a stalled request so it cannot block subsequent activation forever", async () => {
  jest.useFakeTimers();
  try {
    post.mockImplementationOnce(
      ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal!.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );
    const work = requestPushBadgeRefresh(registration, () => true);
    const rejected = expect(work).rejects.toThrow("aborted");
    await jest.advanceTimersByTimeAsync(15000);
    await rejected;
    await requestPushBadgeRefresh(registration, () => true);
    expect(post).toHaveBeenCalledTimes(2);
  } finally {
    jest.useRealTimers();
  }
});
