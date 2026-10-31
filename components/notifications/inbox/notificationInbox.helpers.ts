import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { getCompetitionRoute } from "@/helpers/competition.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  DROP_POLL_VOTED_NOTIFICATION_CAUSE,
  type TypedNotification,
  type INotificationVotingCreditsReturned,
  type INotificationCompetitionLifecycle,
} from "@/types/feed.types";

const NOTIFICATIONS_ROUTE = "/notifications";

export function getInboxDrop(notification: TypedNotification) {
  if (!("related_drops" in notification)) return undefined;
  const drops = notification.related_drops;
  if (notification.cause === ApiNotificationCause.DropReplied) {
    return (
      drops.find(
        (drop) => drop.id === notification.additional_context.reply_drop_id
      ) ??
      drops[1] ??
      drops[0]
    );
  }
  if (notification.cause === ApiNotificationCause.DropQuoted) {
    return (
      drops.find(
        (drop) => drop.id === notification.additional_context.quote_drop_id
      ) ?? drops[0]
    );
  }
  return drops[0];
}

function getInboxCompetitionDestination(
  notification:
    | INotificationVotingCreditsReturned
    | INotificationCompetitionLifecycle
): string {
  const context = notification.additional_context;
  const route = getCompetitionRoute(context.wave_id, context.competition_id);
  const entry = context.entry_id;
  const deleted =
    notification.cause === ApiNotificationCause.VotingCreditsReturned &&
    notification.additional_context.reason === "AUTHOR_DELETED";
  return entry && !deleted
    ? `${route}?entry=${encodeURIComponent(entry)}`
    : route;
}

export function getInboxDestination(
  notification: TypedNotification,
  handle: string
): string {
  const drop = getInboxDrop(notification);
  if (drop) {
    return getWaveRoute({
      waveId: drop.wave.id,
      serialNo: drop.serial_no,
      isDirectMessage: drop.wave.is_direct_message ?? false,
      isApp: false,
    });
  }
  switch (notification.cause) {
    case ApiNotificationCause.IdentitySubscribed:
      return notification.related_identity.handle &&
        !notification.related_identity.is_anonymous
        ? `/${encodeURIComponent(notification.related_identity.handle)}`
        : NOTIFICATIONS_ROUTE;
    case ApiNotificationCause.IdentityRep:
      return handle
        ? `/${encodeURIComponent(handle)}/rep`
        : NOTIFICATIONS_ROUTE;
    case ApiNotificationCause.IdentityNic:
      return handle
        ? `/${encodeURIComponent(handle)}/nic`
        : NOTIFICATIONS_ROUTE;
    case ApiNotificationCause.WaveCreated:
      return getWaveRoute({
        waveId: notification.additional_context.wave_id,
        isDirectMessage:
          notification.related_wave?.is_direct_message ??
          notification.related_wave?.is_dm_wave ??
          false,
        isApp: false,
      });
    case ApiNotificationCause.SubscriptionCoverage:
      return `/${encodeURIComponent(notification.additional_context.profile_handle)}/subscriptions#profile-subscriptions-top-up`;
    case ApiNotificationCause.VotingCreditsReturned:
    case ApiNotificationCause.CompetitionLifecycle:
      return getInboxCompetitionDestination(notification);
    case ApiNotificationCause.MemeCollaboration: {
      const context = notification.additional_context;
      return context.wave_id && context.drop_id
        ? `/waves/${encodeURIComponent(context.wave_id)}?drop=${encodeURIComponent(context.drop_id)}`
        : NOTIFICATIONS_ROUTE;
    }
    case ApiNotificationCause.IdentityMentioned:
    case ApiNotificationCause.DropReplied:
    case ApiNotificationCause.DropQuoted:
    case ApiNotificationCause.DropVoted:
    case DROP_POLL_VOTED_NOTIFICATION_CAUSE:
    case ApiNotificationCause.DropReacted:
    case ApiNotificationCause.DropBoosted:
    case ApiNotificationCause.AllDrops:
    case ApiNotificationCause.PriorityAlert:
    default:
      return NOTIFICATIONS_ROUTE;
  }
}

export function getInboxSummary(
  notification: TypedNotification,
  locale: SupportedLocale
): string {
  const identity =
    "related_identity" in notification ? notification.related_identity : null;
  const actor = identity?.is_anonymous
    ? t(locale, "competitions.anonymousAuthor")
    : (identity?.handle ?? t(locale, "notifications.unknownProfile"));
  const params = { actor };
  switch (notification.cause) {
    case ApiNotificationCause.IdentitySubscribed:
      return t(locale, "notifications.inbox.follow", params);
    case ApiNotificationCause.IdentityMentioned:
      return t(locale, "notifications.inbox.mention", params);
    case ApiNotificationCause.DropReplied:
      return t(locale, "notifications.inbox.reply", params);
    case ApiNotificationCause.DropQuoted:
      return t(locale, "notifications.inbox.quote", params);
    case ApiNotificationCause.DropVoted:
      return t(locale, "notifications.inbox.vote", params);
    case DROP_POLL_VOTED_NOTIFICATION_CAUSE:
      return t(locale, "notifications.inbox.poll", params);
    case ApiNotificationCause.DropBoosted:
      return t(locale, "notifications.inbox.boost", params);
    case ApiNotificationCause.DropReacted:
      return t(locale, "notifications.inbox.react", {
        ...params,
        reaction: notification.additional_context.reaction,
      });
    case ApiNotificationCause.IdentityRep:
    case ApiNotificationCause.IdentityNic:
      return t(
        locale,
        notification.cause === ApiNotificationCause.IdentityRep
          ? "notifications.inbox.rep"
          : "notifications.inbox.nic",
        {
          ...params,
          amount: formatNumber(locale, notification.additional_context.amount, {
            signDisplay: "always",
          }),
        }
      );
    case ApiNotificationCause.WaveCreated:
      return t(locale, "notifications.inbox.wave", {
        ...params,
        wave:
          notification.related_wave?.name ??
          t(locale, "notifications.inbox.generic"),
      });
    case ApiNotificationCause.AllDrops:
      return t(locale, "notifications.inbox.drop", {
        ...params,
        wave: getInboxDrop(notification)?.wave.name ?? "",
      });
    case ApiNotificationCause.PriorityAlert: {
      const wave = getInboxDrop(notification)?.wave.name;
      return wave
        ? t(locale, "notifications.inbox.priority", { wave })
        : t(locale, "notifications.inbox.priorityFallback");
    }
    case ApiNotificationCause.SubscriptionCoverage:
      return t(locale, "subscriptions.notification.title");
    case ApiNotificationCause.MemeCollaboration: {
      const context = notification.additional_context;
      const artwork =
        context.artwork_name ??
        t(locale, "memes.collaborations.artworkFallback");
      if (context.event_type === "INVITED")
        return t(locale, "notifications.inbox.invited", { actor, artwork });
      if (context.event_type === "ACCEPTED")
        return t(locale, "notifications.inbox.accepted", { actor, artwork });
      if (context.event_type === "CANCELLED")
        return t(locale, "notifications.inbox.cancelled", { actor, artwork });
      return t(locale, "notifications.inbox.collaboration", { artwork });
    }
    case ApiNotificationCause.VotingCreditsReturned:
      return t(locale, "notifications.inbox.credits", {
        amount: formatNumber(locale, notification.additional_context.amount),
        competition: notification.additional_context.competition_title,
      });
    case ApiNotificationCause.CompetitionLifecycle:
      return t(locale, "notifications.inbox.results", {
        competition: notification.additional_context.competition_title,
      });
    default:
      return t(locale, "notifications.inbox.generic");
  }
}
