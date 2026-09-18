import { Capacitor } from "@capacitor/core";
import { clearAllAuthenticatedProfiles } from "@/components/auth/seizeConnectErrors";
import { queueNativePushLogout } from "@/services/notifications/push-installation";
import { clearAllWalletAuth } from "@/services/auth/auth.utils";
import { logoutSessionV2 } from "@/services/auth/session-v2.utils";

jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: jest.fn(() => true) },
}));
jest.mock("@/services/notifications/push-installation", () => ({
  queueNativePushLogout: jest.fn(),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  clearAllWalletAuth: jest.fn(),
  getConnectedWalletAccounts: jest.fn(() => [
    { address: "A" },
    { address: "B" },
  ]),
  getWalletAddress: jest.fn(() => "A"),
}));
jest.mock("@/services/auth/session-v2.utils", () => ({
  logoutSessionV2: jest.fn(),
}));
jest.mock("@/utils/security-logger", () => ({ logError: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});
it("queues one installation sweep before clearing credentials, without all-device session logout", async () => {
  await clearAllAuthenticatedProfiles();
  expect(queueNativePushLogout).toHaveBeenCalledWith(null, true);
  expect(clearAllWalletAuth).toHaveBeenCalledTimes(1);
  expect(
    jest.mocked(queueNativePushLogout).mock.invocationCallOrder[0]
  ).toBeLessThan(jest.mocked(clearAllWalletAuth).mock.invocationCallOrder[0]!);
  expect(logoutSessionV2).not.toHaveBeenCalled();
});
it("preserves credentials if it cannot durably record native sign-out", async () => {
  jest
    .mocked(queueNativePushLogout)
    .mockRejectedValueOnce(new Error("secure storage failed"));
  await expect(clearAllAuthenticatedProfiles()).rejects.toThrow(
    "secure storage failed"
  );
  expect(clearAllWalletAuth).not.toHaveBeenCalled();
});
it("preserves the existing web sign-out behavior", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValueOnce(false);
  await clearAllAuthenticatedProfiles();
  expect(queueNativePushLogout).not.toHaveBeenCalled();
  expect(logoutSessionV2).toHaveBeenCalledWith({
    address: "A",
    allSessions: true,
  });
  expect(logoutSessionV2).toHaveBeenCalledWith({
    address: "B",
    allSessions: true,
  });
});
