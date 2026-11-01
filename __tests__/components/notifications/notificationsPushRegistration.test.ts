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

  it("accepts the content-free encrypted chat wake", () => {
    expect(
      parseDevicePushData({
        notification_id: "e2ee",
        redirect: "e2ee",
        target_profile_id: "profile-1",
        target_profile_handle: "sesamenoodles",
      })
    ).toEqual({
      notification_id: "e2ee",
      redirect: "e2ee",
      target_profile_id: "profile-1",
      target_profile_handle: "sesamenoodles",
    });
  });

  it("still rejects unknown redirects", () => {
    expect(
      parseDevicePushData({
        notification_id: "x",
        redirect: "e2ee-group",
        target_profile_id: "profile-1",
        target_profile_handle: "sesamenoodles",
      })
    ).toBeNull();
  });
});
