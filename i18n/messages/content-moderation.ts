export const CONTENT_MODERATION_MESSAGES = {
  "contentModeration.error.retry": "Please try again.",
  "contentModeration.preferences.metaTitle": "Content preferences",
  "contentModeration.preferences.metaDescription":
    "Manage your personal content visibility preferences.",
  "contentModeration.actions.report": "Report post",
  "contentModeration.actions.hide": "Hide post",
  "contentModeration.actions.block": "Block author",
  "contentModeration.actions.unhide": "Unhide post",
  "contentModeration.actions.unblock": "Unblock",
  "contentModeration.actions.unblockProfile": "Unblock {profile}",
  "contentModeration.report.title": "Report this post",
  "contentModeration.report.description":
    "Tell us why this post may violate the rules. Reports are reviewed independently from your personal visibility choices.",
  "contentModeration.report.reasonLabel": "Reason",
  "contentModeration.report.notesLabel": "Additional details (optional)",
  "contentModeration.report.notesPlaceholder":
    "Add context that will help a moderator understand the report.",
  "contentModeration.report.hideLabel": "Also hide this post for me",
  "contentModeration.report.blockLabel": "Also block this author for me",
  "contentModeration.report.submit": "Submit report",
  "contentModeration.report.cancel": "Cancel",
  "contentModeration.report.close": "Close report dialog",
  "contentModeration.report.reason.scam": "Scam or phishing",
  "contentModeration.report.reason.privateInformation":
    "Private information or doxxing",
  "contentModeration.report.reason.threats": "Threats or targeted harassment",
  "contentModeration.report.reason.hate": "Hate or discrimination",
  "contentModeration.report.reason.illegal":
    "Sexual exploitation or illegal content",
  "contentModeration.report.reason.spam": "Spam",
  "contentModeration.report.reason.other": "Other",
  "contentModeration.report.success": "Report submitted.",
  "contentModeration.report.error": "Couldn't submit this report.",
  "contentModeration.hide.success": "Post hidden for you.",
  "contentModeration.hide.error": "Couldn't hide this post.",
  "contentModeration.block.success": "Author blocked for you.",
  "contentModeration.block.error": "Couldn't block this author.",
  "contentModeration.unhide.success": "Post is visible again.",
  "contentModeration.unhide.error": "Couldn't unhide this post.",
  "contentModeration.unblock.success": "Profile unblocked.",
  "contentModeration.unblock.error": "Couldn't unblock this profile.",
  "contentModeration.tombstone.quarantined":
    "This post is unavailable while it is being checked.",
  "contentModeration.tombstone.removed":
    "This post was removed by a moderator.",
  "contentModeration.tombstone.blocked":
    "This post is hidden because you blocked its author.",
  "contentModeration.tombstone.hidden": "You hid this post.",
  "contentModeration.tombstone.show": "Show post",
  "contentModeration.preferences.menu": "Content preferences",
  "contentModeration.preferences.title": "Content preferences",
  "contentModeration.preferences.description":
    "Manage profiles you have blocked. Blocking only changes what you see.",
  "contentModeration.preferences.blockedTitle": "Blocked profiles",
  "contentModeration.preferences.empty": "You haven't blocked any profiles.",
  "contentModeration.preferences.loading": "Loading blocked profiles…",
  "contentModeration.preferences.loadError":
    "Couldn't load your blocked profiles.",
  "contentModeration.preferences.signIn":
    "Connect an authenticated profile to manage content preferences.",
  "contentModeration.moderator.menu": "Moderation queue",
  "contentModeration.moderator.metaTitle": "Content moderation",
  "contentModeration.moderator.metaDescription": "Review reported content.",
  "contentModeration.moderator.title": "Content moderation",
  "contentModeration.moderator.description":
    "Review reported posts and record a reason for every decision.",
  "contentModeration.moderator.loading": "Loading reports…",
  "contentModeration.moderator.empty": "There are no open reports.",
  "contentModeration.moderator.accessDenied":
    "You don't have access to content moderation.",
  "contentModeration.moderator.loadError":
    "Couldn't load the moderation queue.",
  "contentModeration.moderator.reason": "Decision reason",
  "contentModeration.moderator.reasonPlaceholder":
    "Explain why this decision is appropriate.",
  "contentModeration.moderator.allow": "Allow",
  "contentModeration.moderator.quarantine": "Quarantine",
  "contentModeration.moderator.remove": "Remove",
  "contentModeration.moderator.suspend": "Suspend author",
  "contentModeration.moderator.reinstate": "Reinstate author",
  "contentModeration.moderator.decisionSuccess": "Moderation decision saved.",
  "contentModeration.moderator.decisionError":
    "Couldn't save the moderation decision.",
  "contentModeration.moderator.profileSuccess": "Profile status updated.",
  "contentModeration.moderator.profileError":
    "Couldn't update the profile status.",
  "contentModeration.moderator.reportCount.one": "{count} report",
  "contentModeration.moderator.reportCount.many": "{count} reports",
  "contentModeration.moderator.reportedFor": "Reported for {reason}",
  "contentModeration.moderator.author": "Author: {profileId}",
  "contentModeration.moderator.currentState": "State: {state}",
  "contentModeration.moderator.parentContext": "Reply context",
  "contentModeration.moderator.reportedAssets": "Reported media and files",
  "contentModeration.moderator.noTextContent": "No text content",
  "contentModeration.moderator.aiAssessment": "AI assessment",
  "contentModeration.moderator.aiRecommendation": "AI recommendation: {value}",
  "contentModeration.moderator.aiCategory": "Category: {value}",
  "contentModeration.moderator.noAiRecommendation":
    "No AI recommendation is available.",
  "contentModeration.moderator.history": "State history ({count})",
  "contentModeration.moderator.noHistory": "No state changes recorded yet.",
  "contentModeration.moderator.stateChanged": "State changed",
  "contentModeration.postRejected":
    "This post couldn't be submitted because it was flagged by the safety check. Please review it and try again.",
} as const;
