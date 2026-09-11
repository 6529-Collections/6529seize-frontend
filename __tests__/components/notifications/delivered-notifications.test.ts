import {
  PushNotifications,
  type PushNotificationSchema,
} from "@capacitor/push-notifications";
import { commonApiFetch } from "@/services/api/common-api";
import { reconcileDeliveredNotifications } from "@/components/notifications/delivered-notifications";

jest.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    getDeliveredNotifications: jest.fn(),
    removeDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
    removeAllDeliveredNotifications: jest.fn(),
  },
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

const fetchMock = jest.mocked(commonApiFetch);
const getDelivered = jest.mocked(PushNotifications.getDeliveredNotifications);
const remove = jest.mocked(PushNotifications.removeDeliveredNotifications);
const push = (
  profile: string,
  id: number,
  wave = "shared-wave"
): PushNotificationSchema => ({
  id: `native-${id}`,
  data: {
    target_profile_id: profile,
    notification_id: String(id),
    wave_id: wave,
  },
});
const scope = () => ({
  profileId: "A",
  authJwt: "jwt-A",
  isCurrent: () => true,
});
const response = (id: number, read_at: number | null, unread_count = 1) => ({
  notifications: [{ id, read_at }],
  unread_count,
});

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockReset();
});

it("reading A preserves B and newer unread A entries without touching the badge", async () => {
  const a = push("A", 1),
    b = push("B", 2),
    newer = push("A", 3);
  getDelivered.mockResolvedValue({ notifications: [a, b, newer] });
  fetchMock
    .mockResolvedValueOnce(response(1, 100))
    .mockResolvedValueOnce(response(3, null));
  await reconcileDeliveredNotifications(scope());
  expect(remove).toHaveBeenCalledWith({ notifications: [a] });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenCalledWith(
    expect.objectContaining({ headers: { Authorization: "Bearer jwt-A" } })
  );
  expect(
    PushNotifications.removeAllDeliveredNotifications
  ).not.toHaveBeenCalled();
});

it("removes the final profile's read entry without overriding the backend's zero badge", async () => {
  const b = push("B", 2);
  getDelivered.mockResolvedValue({ notifications: [b] });
  fetchMock.mockResolvedValue(response(2, 100, 0));
  await reconcileDeliveredNotifications({
    ...scope(),
    profileId: "B",
    authJwt: "jwt-B",
  });
  expect(remove).toHaveBeenCalledWith({ notifications: [b] });
  expect(
    PushNotifications.removeAllDeliveredNotifications
  ).not.toHaveBeenCalled();
});

it("preserves Android tags and removes only the matching profile", async () => {
  const a = { ...push("A", 1), tag: "FCM-Notification:1" };
  getDelivered.mockResolvedValue({ notifications: [a, push("B", 2)] });
  fetchMock.mockResolvedValue(response(1, 100));
  await reconcileDeliveredNotifications(scope());
  expect(remove).toHaveBeenCalledWith({ notifications: [a] });
});

it("removes all confirmed read single-account entries", async () => {
  const a = push("A", 1),
    a2 = push("A", 2);
  getDelivered.mockResolvedValue({ notifications: [a, a2] });
  fetchMock
    .mockResolvedValueOnce(response(1, 100, 0))
    .mockResolvedValueOnce(response(2, 100, 0));
  await reconcileDeliveredNotifications(scope());
  expect(remove).toHaveBeenCalledWith({ notifications: [a, a2] });
});

it("preserves the entire snapshot if any state refresh fails", async () => {
  getDelivered.mockResolvedValue({
    notifications: [push("A", 1), push("A", 2), push("B", 3)],
  });
  fetchMock
    .mockResolvedValueOnce(response(1, 100))
    .mockRejectedValueOnce(new Error("offline"));
  await expect(reconcileDeliveredNotifications(scope())).rejects.toThrow(
    "offline"
  );
  expect(remove).not.toHaveBeenCalled();
  expect(
    PushNotifications.removeAllDeliveredNotifications
  ).not.toHaveBeenCalled();
});

it("a zero count does not prove a missing or unread record was read", async () => {
  getDelivered.mockResolvedValue({
    notifications: [push("A", 1), push("A", 2)],
  });
  fetchMock
    .mockResolvedValueOnce(response(0, 100, 0))
    .mockResolvedValueOnce(response(2, null, 0));
  await reconcileDeliveredNotifications(scope());
  expect(remove).not.toHaveBeenCalled();
});

it("wave cleanup requires both the profile and wave to match", async () => {
  const a = push("A", 1);
  getDelivered.mockResolvedValue({
    notifications: [a, push("B", 2), push("A", 3, "another-wave")],
  });
  fetchMock.mockResolvedValue(response(1, 100));
  await reconcileDeliveredNotifications({ ...scope(), waveId: "shared-wave" });
  expect(remove).toHaveBeenCalledWith({ notifications: [a] });
});

it("ignores missing profile metadata and malformed notification IDs", async () => {
  getDelivered.mockResolvedValue({
    notifications: [
      { id: "legacy", data: { notification_id: "1" } },
      {
        id: "invalid",
        data: { target_profile_id: "A", notification_id: "1bad" },
      },
    ],
  });
  await reconcileDeliveredNotifications(scope());
  expect(fetchMock).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
});

it("aborts cleanup when the account changes during refresh", async () => {
  let current = true;
  getDelivered.mockResolvedValue({ notifications: [push("A", 1)] });
  fetchMock.mockImplementation(async () => {
    current = false;
    return response(1, 100);
  });
  await reconcileDeliveredNotifications({
    ...scope(),
    isCurrent: () => current,
  });
  expect(remove).not.toHaveBeenCalled();
});

it("does not include pushes delivered after the snapshot", async () => {
  const notifications = [push("A", 1)];
  getDelivered.mockResolvedValue({ notifications });
  fetchMock.mockImplementation(async () => {
    notifications.push(push("A", 2));
    return response(1, 100);
  });
  await reconcileDeliveredNotifications(scope());
  expect(remove).toHaveBeenCalledWith({ notifications: [push("A", 1)] });
});

it("uses versioned Android tags when FCM payload data is absent", async () => {
  const a = { id: "0", tag: "6529:v1:A:1:shared-wave", data: {} };
  const b = { id: "0", tag: "6529:v1:B:2:shared-wave", data: {} };
  getDelivered.mockResolvedValue({ notifications: [a, b] });
  fetchMock.mockResolvedValue(response(1, 100));
  await reconcileDeliveredNotifications({ ...scope(), waveId: "shared-wave" });
  expect(remove).toHaveBeenCalledWith({ notifications: [a] });
});

it("preserves Android legacy tags and malformed tag encodings", async () => {
  getDelivered.mockResolvedValue({
    notifications: [
      { id: "0", tag: "FCM-Notification:123", data: {} },
      { id: "0", tag: "6529:v1:%invalid:1:", data: {} },
    ],
  });
  await reconcileDeliveredNotifications(scope());
  expect(remove).not.toHaveBeenCalled();
});
