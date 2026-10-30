import { resolvePushRedirectUrl } from "@/components/notifications/push-redirect";
import type { DevicePushData } from "@/components/notifications/device-push.types";

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
