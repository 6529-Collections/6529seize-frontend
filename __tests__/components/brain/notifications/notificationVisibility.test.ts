import {
  getVisibleNotificationCauses,
  getExcludedNotificationCauses,
  isNotificationVisible,
} from "@/components/brain/notifications/utils/notificationVisibility";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { NotificationDisplayItem } from "@/types/feed.types";

it("excludes coverage from the default query and a stale coverage-only selection", () => {
  for (const causes of [
    undefined,
    [ApiNotificationCause.SubscriptionCoverage],
  ]) {
    const visible = getVisibleNotificationCauses(causes, true);
    expect(visible).toBeNull();
  }
  expect(getExcludedNotificationCauses(true)).toEqual([
    ApiNotificationCause.SubscriptionCoverage,
  ]);
  expect(getExcludedNotificationCauses(false)).toBeNull();
});

it("preserves ordinary selected notification causes", () => {
  const causes = [
    ApiNotificationCause.SubscriptionCoverage,
    ApiNotificationCause.IdentityMentioned,
  ];
  expect(getVisibleNotificationCauses(causes, true)).toEqual([
    ApiNotificationCause.IdentityMentioned,
  ]);
  expect(getVisibleNotificationCauses(causes, false)).toEqual(causes);
  expect(getVisibleNotificationCauses(undefined, false)).toBeNull();
});

it("suppresses a cached coverage item without suppressing social follows", () => {
  const coverage = {
    cause: ApiNotificationCause.SubscriptionCoverage,
  } as NotificationDisplayItem;
  const follow = {
    cause: ApiNotificationCause.IdentitySubscribed,
  } as NotificationDisplayItem;
  expect(isNotificationVisible(coverage, true)).toBe(false);
  expect(isNotificationVisible(coverage, false)).toBe(true);
  expect(isNotificationVisible(follow, true)).toBe(true);
});
