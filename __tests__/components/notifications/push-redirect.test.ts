import { resolvePushRedirectUrl } from "@/components/notifications/push-redirect";
import { isE2eeEnabled } from "@/config/e2eeEnv";

jest.mock("@/config/e2eeEnv", () => ({ isE2eeEnabled: jest.fn() }));

const isE2eeEnabledMock = isE2eeEnabled as jest.Mock;

const e2eeWake = {
  notification_id: "e2ee",
  redirect: "e2ee" as const,
  target_profile_id: "profile-1",
  target_profile_handle: "alice",
};

describe("resolvePushRedirectUrl for encrypted chat wakes", () => {
  it("opens the encrypted chats list when encrypted chats are enabled", () => {
    isE2eeEnabledMock.mockReturnValue(true);
    expect(resolvePushRedirectUrl(e2eeWake)).toBe("/messages/encrypted");
  });

  it("falls back to the messages list when the build has them off", () => {
    isE2eeEnabledMock.mockReturnValue(false);
    expect(resolvePushRedirectUrl(e2eeWake)).toBe("/messages");
  });

  it("never routes to a specific chat (the wake carries no group)", () => {
    isE2eeEnabledMock.mockReturnValue(true);
    expect(
      resolvePushRedirectUrl({ ...e2eeWake, wave_id: "w", drop_id: "d" })
    ).toBe("/messages/encrypted");
  });

  it("keeps wave redirects unchanged", () => {
    isE2eeEnabledMock.mockReturnValue(true);
    expect(
      resolvePushRedirectUrl({
        ...e2eeWake,
        redirect: "waves",
        wave_id: "wave-1",
        drop_id: "",
      })
    ).toBe("/waves/wave-1");
  });
});
