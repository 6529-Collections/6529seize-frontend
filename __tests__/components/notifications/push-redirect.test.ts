import { resolvePushRedirectUrl } from "@/components/notifications/push-redirect";
import type { DevicePushData } from "@/components/notifications/device-push.types";
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
  it("opens the encrypted chats list, marked as a wake, when encrypted chats are enabled", () => {
    isE2eeEnabledMock.mockReturnValue(true);
    expect(resolvePushRedirectUrl(e2eeWake)).toBe("/messages/encrypted?wake=1");
  });

  it("falls back to the messages list when the build has them off", () => {
    isE2eeEnabledMock.mockReturnValue(false);
    expect(resolvePushRedirectUrl(e2eeWake)).toBe("/messages");
  });

  it("never routes to a specific chat (the wake carries no group)", () => {
    isE2eeEnabledMock.mockReturnValue(true);
    expect(
      resolvePushRedirectUrl({ ...e2eeWake, wave_id: "w", drop_id: "d" })
    ).toBe("/messages/encrypted?wake=1");
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

const creditReturn: DevicePushData = {
  notification_id: "1",
  redirect: "waves",
  target_profile_id: "voter",
  target_profile_handle: "voter",
  wave_id: "wave",
  competition_id: "competition",
};

it("opens the surviving competition for deleted-entry credit-return pushes without a drop id", () => {
  expect(resolvePushRedirectUrl(creditReturn)).toBe(
    "/waves/wave/competitions/competition"
  );
});

it("opens the winning entry when the push includes its competition entry id", () => {
  expect(
    resolvePushRedirectUrl({ ...creditReturn, competition_entry_id: "entry" })
  ).toBe("/waves/wave/competitions/competition?entry=entry");
});
