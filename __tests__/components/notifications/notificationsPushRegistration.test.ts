import { parseDevicePushData } from "@/components/notifications/notificationsPushRegistration";

describe("parseDevicePushData", () => {
  it("accepts subscription profile redirects", () => {
    expect(
      parseDevicePushData({
        notification_id: "notification-1",
        redirect: "profile",
        target_profile_id: "profile-1",
        target_profile_handle: "sesamenoodles",
        handle: "sesamenoodles",
        subroute: "subscriptions",
      })
    ).toEqual({
      notification_id: "notification-1",
      redirect: "profile",
      target_profile_id: "profile-1",
      target_profile_handle: "sesamenoodles",
      handle: "sesamenoodles",
      subroute: "subscriptions",
    });
  });

  it("drops unsupported profile subroutes without rejecting the push", () => {
    expect(
      parseDevicePushData({
        notification_id: "notification-1",
        redirect: "profile",
        target_profile_id: "profile-1",
        target_profile_handle: "sesamenoodles",
        subroute: "billing",
      })
    ).toEqual({
      notification_id: "notification-1",
      redirect: "profile",
      target_profile_id: "profile-1",
      target_profile_handle: "sesamenoodles",
    });
  });
});
