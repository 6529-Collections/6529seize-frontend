/* eslint max-lines: "off" */

import {
  DISTRIBUTION_MESSAGES,
  LINK_PREVIEW_MESSAGES,
  MEDIA_VIDEO_MESSAGES,
  MEME_CALENDAR_MESSAGES,
  MEME_LAB_DETAIL_MESSAGES,
  THE_MEMES_DETAIL_ACTIVITY_MESSAGES,
  THE_MEMES_DETAIL_ART_MESSAGES,
  THE_MEMES_DETAIL_LIVE_MESSAGES,
  THE_MEMES_DETAIL_REFERENCES_MESSAGES,
  THE_MEMES_DETAIL_TIMELINE_MESSAGES,
  TIMELINE_MESSAGES,
} from "@/i18n/messages/collection-detail";
import aboutMessages from "@/i18n/messages/about.en-US.json";
import join6529Messages from "@/i18n/messages/join6529.en-US.json";
import toolsMessages from "@/i18n/messages/tools.en-US.json";
import { QR_SCANNER_MESSAGES } from "@/i18n/messages/qr-scanner";
import profileCmsArtDisplayMessages from "@/i18n/messages/profileCmsArtDisplay.en-US.json";
import { EN_US_THE_MEMES_COLLECTORS_MESSAGES } from "@/i18n/messages/the-memes-collectors";

type MessageEntry = readonly [key: string, value: string];

type NamespacedMessages<
  Prefix extends string,
  Entries extends readonly MessageEntry[],
> = {
  readonly [Entry in Entries[number] as `${Prefix}.${Entry[0]}`]: Entry[1];
};

function namespaceMessages<
  Prefix extends string,
  Entries extends readonly MessageEntry[],
>(prefix: Prefix, entries: Entries): NamespacedMessages<Prefix, Entries> {
  return Object.fromEntries(
    entries.map(([key, value]) => [`${prefix}.${key}`, value])
  ) as NamespacedMessages<Prefix, Entries>;
}

type MessageMap = Record<string, string>;

const PLEASE_TRY_AGAIN = "Please try again.";

type ObjectMessages<Prefix extends string, Entries extends MessageMap> = {
  readonly [Entry in keyof Entries as `${Prefix}.${Entry & string}`]: Entries[Entry];
};

function objectMessages<Prefix extends string, Entries extends MessageMap>(
  prefix: Prefix,
  entries: Entries
): ObjectMessages<Prefix, Entries> {
  return Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [`${prefix}.${key}`, value])
  ) as ObjectMessages<Prefix, Entries>;
}

const REMEMES_DETAIL_MESSAGES = namespaceMessages("rememes.detail", [
  ["documentTitle", "{name} | ReMemes"],
  ["browserTitle", "{name} | ReMemes | 6529.io"],
  ["backLink.ariaLabel", "Back to ReMemes"],
  ["heading.ariaLabel", "ReMemes - {name}"],
  ["sections.details", "ReMeme details"],
  ["sections.tabs", "ReMemes page sections"],
  ["collection", "Collection"],
  ["createdBy", "Created by"],
  ["addedBy", "Added by"],
  ["external.etherscan", "View {collectionName} on Etherscan"],
  ["external.website", "Open collection website: {url}"],
  ["external.twitter", "Open @{username} on X"],
  ["tabs.overview", "Overview"],
  ["tabs.metadata", "Metadata"],
  ["tabs.references", "References"],
  ["replicas.title", "Replicas"],
  ["replicas.count", "(x{count})"],
  ["replicas.description", "* Replicas are tokens with identical images"],
  ["replicas.link", "View replica #{tokenId}"],
  ["tokenUri", "Token URI"],
  ["tokenType", "Token Type"],
  ["metadata.title", "Metadata"],
  ["properties.title", "Properties"],
  ["references.title", "The Memes References"],
  ["references.fetching", "Fetching references"],
  ["references.card", "View referenced Meme Card #{tokenId}: {name}"],
  ["references.artistName", "Artist Name: {artist}"],
  ["references.artistProfile", "Artist Profile:"],
] as const);

const USER_COLLECTED_STATS_MESSAGES = namespaceMessages(
  "user.collected.stats",
  [
    ["metrics.nextGen", "NextGen"],
    ["metrics.memeSets", "Meme Sets"],
    ["metrics.memes", "Memes"],
    ["metrics.gradients", "Gradients"],
    ["metrics.boost", "Boost"],
    ["metrics.unique", "unique x{value}"],
    ["metric.value", "x{value}"],
    ["details.show", "Details"],
    ["details.hide", "Hide Details"],
    ["details.unavailable", "Stats are unavailable for this profile."],
    ["seasons.title", "Seasons"],
    ["seasons.startedCount", "{started}/{total} started"],
    ["seasons.showLess", "Show less"],
    ["seasons.showMore", "+{count} more"],
    ["seasons.showMoreAriaLabel", "Show {count} more started seasons"],
    ["seasons.unseized", "Unseized"],
    ["seasonTile.sets.zero", "0 sets"],
    ["seasonTile.sets.one", "{count} set"],
    ["seasonTile.sets.many", "{count} sets"],
    ["seasonTile.label", "SZN{seasonNumber}"],
    ["seasonTile.toNextSet", "{held}/{total} to set {setNumber}"],
    ["seasonTile.setComplete", "Set {count} complete"],
  ] as const
);

const USER_COLLECTED_STATS_DETAILS_MESSAGES = objectMessages(
  "user.collected.stats.details",
  {
    "collected.title": "Collected",
    overview: "Overview",
    "tables.overviewCaption": "Collected holdings summary by collection",
    "tables.column.total": "Total",
    "tables.column.memes": "Memes",
    "tables.column.nextGen": "NextGen",
    "tables.column.gradient": "Gradient",
    "tables.column.memeLab": "Meme Lab",
    "rows.cards": "Cards",
    "rows.rank": "Rank",
    "rows.tdh": "TDH",
    "rows.noTdh": "* No TDH",
    memesBySeason: "Memes Breakdown By Season",
    "tables.memesBySeasonCaption": "Collected Memes breakdown by season",
    "tables.column.unique": "Unique",
    "tables.column.sets": "Sets",
    seasonLabel: "Season {seasonNumber}",
    uniqueProgress: "{held} / {total}",
    uniqueProgressPercent: "({percent})",
  } as const
);

const USER_COLLECTED_STATS_BOOST_MESSAGES = objectMessages(
  "user.collected.stats.boostBreakdown",
  {
    title: "Boost Breakdown",
    versionLink: "TDH Version: {version}",
    tableCaption: "TDH boost breakdown by source",
    "columns.type": "Type",
    "columns.potential": "Potential Boost",
    "columns.actual": "Actual Boost",
    "groups.memes": "Memes",
    "rows.fullCollectionSet": "Full Collection Set",
    "rows.genesisSet": "Genesis Set",
    "rows.nakamoto": "Nakamoto",
    "rows.gradients": "Gradients",
    "rows.total": "TOTAL BOOST",
    seasonLabel: "SZN{seasonNumber}",
    "info.totalPotential": "Total Potential Boost",
    "info.totalActual": "Total Actual Boost",
    "info.ariaLabel": "Show boost detail",
  } as const
);

const REP_CATEGORY_MESSAGES = objectMessages("rep.categories", {
  "loading.details": "Loading REP category details",
  "pill.openGlobalAriaLabel": "Open global REP category {category}",
  "pill.editAriaLabel": "Edit REP category {category}",
  "sidebar.otherTools": "Other Tools",
  "sidebar.repCategories": "REP Categories",
  "sidebar.api": "API",
  "search.minChars": "Type at least 3 characters to search.",
  "search.loading": "Searching REP categories",
  "search.error": "Could not search REP categories.",
  "search.empty": "No matching categories found.",
  "search.view": "View",
  "search.label": "Search REP categories",
  "search.placeholder": "Type a category name",
  "search.resultsLabel": "REP category search results",
  "helpBotReserved.error": "{category} is managed by help6529.",
  "suggested.loading": "Loading active REP categories",
  "suggested.error": "Could not load active REP categories.",
  "suggested.empty": "No active REP categories found yet.",
  "suggested.rep": "REP",
  "suggested.ratings": "Ratings",
  "suggested.title": "Active REP categories",
  "suggested.description": "Categories with the most profile REP activity.",
  "wave.tabs.waves": "Waves",
  "wave.tabs.contributors": "Contributors",
  "wave.sort.repDesc": "REP impact high",
  "wave.sort.repAsc": "REP impact low",
  "wave.sort.recent": "Recent",
  "wave.metrics.rep": "Wave REP",
  "wave.metrics.waves": "Waves",
  "wave.metrics.contributors": "Contributors",
  "wave.preview.waves": "Waves preview",
  "wave.preview.contributors": "Contributors preview",
  "wave.table.wavesCaption": "Waves using REP category {category}",
  "wave.table.contributorsCaption":
    "Wave REP contributors for category {category}",
  "wave.table.rank": "Rank",
  "wave.table.wave": "Wave",
  "wave.table.rep": "REP",
  "wave.table.contributors": "Contributors",
  "wave.table.leadingContributors": "Leading contributors",
  "wave.table.lastModified": "Last modified",
  "wave.table.contributor": "Contributor",
  "wave.sort.label": "Sort Wave REP rows",
  "wave.sections.label": "Wave REP category sections",
  "wave.loading.overview": "Loading Wave REP category overview",
  "wave.loading.rows": "Loading Wave REP {tab}",
  "wave.error.overviewTitle": "Could not load Wave REP",
  "wave.error.overviewMessage": "Wave REP for this category failed to load.",
  "wave.error.rowsTitle": "Could not load Wave REP rows",
  "wave.error.rowsMessage": "Wave REP rows failed to load.",
  "wave.empty.title": "No Wave REP found",
  "wave.empty.message": "This category has not been used for Wave REP yet.",
  "wave.empty.contributors": "None yet",
  "wave.loadMore": "Load more",
  "wave.loadingMore": "Loading...",
} as const);

const USER_COLLECTED_STATS_ACTIVITY_MESSAGES = objectMessages(
  "user.collected.stats.activityOverview",
  {
    title: "Activity Overview",
    overview: "Overview",
    memesBySeason: "Memes Breakdown By Season",
    "tables.overviewCaption": "Collected activity summary by collection",
    "tables.memesBySeasonCaption":
      "Collected Meme activity breakdown by season",
    "tables.memesBySeasonEmpty": "No Meme activity by season yet.",
    "rows.airdrops": "Airdrops",
    "rows.transfersIn": "Transfers In",
    "rows.mints": "Mints",
    "rows.mintsEth": "Mints (ETH)",
    "rows.purchases": "Purchases",
    "rows.purchasesEth": "Purchases (ETH)",
    "rows.transfersOut": "Transfers Out",
    "rows.burns": "Burns",
    "rows.sales": "Sales",
    "rows.salesEth": "Sales (ETH)",
    seasonLabel: "Season {seasonNumber}",
  } as const
);

const USER_COLLECTED_STATS_ACTIVITY_TABS_MESSAGES = objectMessages(
  "user.collected.stats.activityTabs",
  {
    listLabel: "Activity details sections",
    walletActivity: "Wallet Activity",
    distributions: "Distributions",
    tdhHistory: "TDH History",
  } as const
);

const USER_STATS_ROW_MESSAGES = objectMessages("user.statsRow", {
  "labels.tdh": "TDH",
  "labels.xtdh": "xTDH",
  "labels.nic": "NIC",
  "labels.rep": "Rep",
  "labels.followers.one": "Follower",
  "labels.followers.other": "Followers",
  "links.tdh": "View {handle}'s collected TDH: {value}",
  "links.tdhWithRate": "View {handle}'s collected TDH: {value}, +{rate}",
  "links.xtdh": "View {handle}'s xTDH: {value}",
  "links.xtdhWithRate": "View {handle}'s xTDH: {value}, +{rate}",
  "links.nic": "View {handle}'s NIC: {value}",
  "links.rep": "View {handle}'s Rep: {value}",
  "links.followers": "View {handle}'s followers: {value} {followersLabel}",
  "buttons.followers": "Open {handle}'s followers: {value} {followersLabel}",
} as const);

const NEW_VERSION_TOAST_MESSAGES = objectMessages("newVersionToast", {
  refreshAction: "Refresh page",
  title: "A new version is available",
  eyebrow: "Yes, again!",
} as const);

const NAVIGATION_MESSAGES = objectMessages("navigation", {
  "primary.nfts": "NFTs",
  "primary.waves": "Waves",
  "primary.dms": "DMs",
  "primary.join6529": "Join 6529",
  "primary.about": "About",
  "primary.home": "Home",
  "account.notifications": "Notifications",
  "section.main": "Main",
  "section.utility": "Utility",
  "section.account": "Account",
  "waves.discover": "Discover Waves",
  "network.nerd": "Network Nerd",
  "subsection.networkPeople": "Network & Reputation",
  "subsection.networkData": "Network & Reputation",
  "subsection.nftReportingTools": "Collections & Minting",
  "subsection.developerOpenData": "Data & Developer Tools",
} as const);

const WAVE_SCORE_NAVIGATION_MESSAGES = objectMessages("waveScore.navigation", {
  "back.wave": "Back to wave",
  "back.previous": "Back to previous page",
  "back.about": "Back to About",
  breadcrumb: "About / Network & Reputation / Wave Score",
  description:
    "This Network page explains the score shown on waves across discovery, the sidebar, home, and wave pages. Find it in About under Network & Reputation whenever you want the formula or a live wave calculation.",
} as const);

const MEMES_QUICK_VOTE_MESSAGES = objectMessages("memes.quickVote", {
  leftThisRound: "{count} left this round",
  unrated: "{count} unrated",
  summary: "{leftThisRound}, {unrated}",
  inMemesWave: "{leftThisRound}, {unrated} in the memes wave",
} as const);

const MEMES_WAVE_FOOTER_MESSAGES = objectMessages("memes.waveFooter", {
  "quickVote.label": "Quick vote",
  "quickVote.open": "Open quick vote",
  "uncastPower.ariaLabel":
    "Uncast Power, {power} {votingLabel} left, {leftThisRound}, {unrated}",
  "uncastPower.title": "Uncast Power",
  "uncastPower.visibleValue": "{power} {votingLabel}",
  "uncastPower.votes": "Votes",
  "uncastPower.votesVisible": "votes",
} as const);

const DROP_REACTION_MESSAGES = objectMessages("drops.reactions", {
  "rateLimit.retryAfter.moment":
    "You are reacting too quickly. Try again in a moment.",
  "rateLimit.retryAfter.seconds.one":
    "You are reacting too quickly. Try again in {count} second.",
  "rateLimit.retryAfter.seconds.other":
    "You are reacting too quickly. Try again in {count} seconds.",
  "rateLimit.retryAfter.minutes.one":
    "You are reacting too quickly. Try again in {count} minute.",
  "rateLimit.retryAfter.minutes.other":
    "You are reacting too quickly. Try again in {count} minutes.",
} as const);

const WAVES_MOBILE_MESSAGES = objectMessages("waves.mobile", {
  "profileFeed.title": "Profile Waves Feed",
  "profileFeed.subtitle": "Featured drops from profile waves",
} as const);

const WAVE_DROP_ACTIONS_MESSAGES = objectMessages("waves.drop.actions", {
  copyText: "Copy text",
  copyLink: "Copy link",
  copied: "Copied!",
  copyFailed: "Copy failed",
} as const);

const WAVE_POLL_MESSAGES = objectMessages("waves.poll", {
  "actions.viewResults": "View results",
  "actions.vote": "Vote",
  "actions.changeVote": "Change vote",
  "status.voted": "Voted",
  "status.updated": "Updated",
} as const);

const WAVE_SUBMISSION_BUTTON_LABEL_MESSAGES = objectMessages(
  "waves.submissionButtonLabel",
  {
    counter: "{count}/{max}",
    defaultCreateProposal: "Create Proposal",
    defaultDrop: "Drop",
    defaultDropArt: "Drop Art",
    defaultSubmitDrop: "Submit drop",
    editLabel: "Edit submission button label",
    errorTooLong: "Label must be {max} characters or fewer.",
    label: "Submission button label",
    rowLabel: "Submission button",
    toastAuthFailed:
      "Couldn't authenticate. Reconnect your wallet and try again.",
    toastRetry: PLEASE_TRY_AGAIN,
    toastSaveFailedTitle: "Couldn't save this submission button label.",
    useDefault: "Use default",
  } as const
);

const USER_COLLECTED_STATS_WALLET_ACTIVITY_MESSAGES = objectMessages(
  "user.collected.stats.walletActivity",
  {
    title: "Wallet Activity",
    filterButtonLabel: "Wallet activity filter: {filter}",
    filterOptionsLabel: "Wallet activity filter options",
    optionAriaLabel: "Show {filter} wallet activity",
    tableCaption: "Wallet activity transactions",
    "filters.all": "All",
    "filters.airdrops": "Airdrops",
    "filters.mints": "Mints",
    "filters.sales": "Sales",
    "filters.purchases": "Purchases",
    "filters.transfers": "Transfers",
    "filters.burns": "Burns",
    "empty.all": "No transactions",
    "empty.airdrops": "No airdrops",
    "empty.mints": "No mints",
    "empty.sales": "No sales",
    "empty.purchases": "No purchases",
    "empty.transfers": "No transfers",
    "empty.burns": "No burns",
  } as const
);

const USER_COLLECTED_STATS_DISTRIBUTIONS_MESSAGES = objectMessages(
  "user.collected.stats.distributions",
  {
    title: "Distributions",
    empty: "No distributions found",
    loading: "Loading distributions",
    tableCaption: "Profile distribution claims",
    tokenLinkAriaLabel: "View {collection} token #{tokenId}",
    "columns.collection": "Collection",
    "columns.token": "Token",
    "columns.name": "Name",
    "columns.wallet": "Wallet",
    "columns.minted": "Minted",
    "columns.total": "Total",
    "collections.memes": "The Memes",
    "collections.gradients": "6529Gradient",
    "collections.memeLab": "Meme Lab",
    "phases.airdrop": "Airdrop",
  } as const
);

const USER_COLLECTED_STATS_TDH_HISTORY_MESSAGES = objectMessages(
  "user.collected.stats.tdhHistory",
  {
    title: "TDH History",
    empty: "No TDH history found",
    loading: "Loading TDH history",
    chartListLabel: "TDH history charts",
    chartAriaLabel: "{title} chart",
    "charts.totalTdh.title": "Total TDH",
    "charts.totalTdh.totalBoosted": "Total Boosted TDH",
    "charts.netDailyChange.title": "Net TDH Daily Change",
    "charts.netDailyChange.netBoosted": "Net Boosted TDH",
    "charts.createdDailyChange.title": "Created TDH Daily Change",
    "charts.createdDailyChange.createdBoosted": "Created Boosted TDH",
    "charts.destroyedDailyChange.title": "Destroyed TDH Daily Change",
    "charts.destroyedDailyChange.destroyedBoosted": "Destroyed Boosted TDH",
  } as const
);

const USER_PROFILE_TABS_MESSAGES = objectMessages("user.profile.tabs", {
  navigationLabel: "Profile sections",
  scrollLeft: "Scroll profile sections left",
  scrollRight: "Scroll profile sections right",
  identity: "Identity",
  brain: "Brain",
  curation: "Curation",
  collected: "Collected",
  xtdh: "xTDH",
  subscriptions: "Subscriptions",
  proxy: "Proxy",
  "badges.beta": "Beta",
} as const);

const USER_PROFILE_HEADER_MESSAGES = objectMessages("user.profileHeader", {
  "name.edit": "Edit {name}'s profile name",
  "dm.createFailed.title": "Couldn't create this direct message.",
  "dm.createFailed.description": PLEASE_TRY_AGAIN,
  "name.profileEnabled": "Profile enabled: {date}",
  "pfp.alt": "{name}'s profile picture",
  "pfp.edit": "Edit {name}'s profile picture",
  "banner.edit": "Edit {name}'s profile banner",
  "about.add": "Add About statement",
  "about.edit": "Edit About statement",
  "about.empty": "Click to add an About statement",
  "about.expand": "See more",
  "about.collapse": "See less",
  "aboutEdit.textareaLabel": "About statement",
  "aboutEdit.placeholder": "Write an About statement",
  "aboutEdit.characterCount": "{count}/{max}",
  "aboutEdit.cancel": "Cancel",
  "aboutEdit.save": "Save",
  "aboutEdit.success": "About statement added.",
  "aboutEdit.errors.saveFailed":
    "Couldn't save this about statement. Please try again.",
  "aboutEdit.errors.close": "Dismiss About statement error",
  "aboutEdit.errors.unknown.title": "Unknown Error",
  "aboutEdit.errors.hateSpeech.title": "Error: Hate Speech",
  "aboutEdit.errors.hateSpeech.value":
    "Your About text was not accepted because our automated checks flagged it for potentially containing hate speech. We want to keep seize a welcoming place! We'd appreciate it if you adjusted your text.",
  "aboutEdit.errors.personalInsults.title": "Error: Personal Insults",
  "aboutEdit.errors.personalInsults.value":
    "Your About text was not accepted because our automated checks flagged it for potentially containing a personal insult. We want to keep seize a welcoming place! We'd appreciate it if you adjusted your text.",
  "aboutEdit.errors.inappropriateLanguage.title":
    "Error: Inappropriate Language",
  "aboutEdit.errors.inappropriateLanguage.value":
    "Your About text was not accepted because our automated checks flagged it for potentially containing inappropriate language that may make others uncomfortable. We want to keep seize a welcoming place! We'd appreciate it if you adjusted your text.",
  "aboutEdit.errors.doxxing.title": "Error: Doxxing of Another Person",
  "aboutEdit.errors.doxxing.value":
    "Your About text was not accepted because our automated checks flagged it for potentially doxxing another user of the system. We have a strong cultural value around respecting pseudonymity, so we'd appreciate it if you adjusted your text.",
} as const);

const FOLLOWERS_MESSAGES = objectMessages("followers", {
  "modal.title": "Followers",
  "list.label": "Followers",
  "list.loading": "Loading followers",
  "profile.linkAriaLabel": "View {handle}'s profile",
  "profile.avatarAlt": "{handle}'s profile image",
} as const);

const WAVES_SIDEBAR_MESSAGES = objectMessages("waves.sidebar", {
  highlyRated: "Worth Checking Out",
  highlyRatedInfoTooltip: "Highly rated waves you don’t follow yet.",
  "highlyRatedPreviewOpenAriaLabel.none": "Open {waveName}",
  "highlyRatedPreviewOpenAriaLabel.withScore": "Open {waveName}, score {score}",
  highlyRatedPreviewScore: "Score {score}",
  pinned: "Pinned",
  allWaves: "All Waves",
  all: "All",
  filterAriaLabel: "Wave list filter",
  filterAll: "All",
  filterJoined: "Joined",
  joinedEmptyMessage: "No joined waves to display",
  announcementWavesAriaLabel: "Announcement waves",
  highlyRatedAriaLabel: "Worth checking out waves",
  pinnedAriaLabel: "Pinned waves",
  followingListAriaLabel: "Following waves list",
  allRecentActivityAriaLabel: "All recent waves list",
  allQualityRankedAriaLabel: "All quality-ranked waves list",
  directMessagesAriaLabel: "Direct message conversations",
  expandControlExpandAriaLabel: "Expand {waveName} subwaves",
  expandControlCollapseAriaLabel: "Collapse {waveName} subwaves",
  expandControlLoadingAriaLabel: "Loading {waveName} subwaves",
  subwavesToggleView: "View subwaves",
  subwavesToggleViewCountOne: "View {count} subwave",
  subwavesToggleViewCountMany: "View {count} subwaves",
  subwavesToggleHide: "Hide subwaves",
  subwavesToggleLoading: "Loading subwaves",
  subwavesToggleUnreadBadge: "{count} new",
  subwavesToggleViewAriaLabel: "View {waveName} subwaves",
  subwavesToggleViewCountOneAriaLabel: "View {count} subwave for {waveName}",
  subwavesToggleViewCountManyAriaLabel: "View {count} subwaves for {waveName}",
  subwavesToggleHideAriaLabel: "Hide {waveName} subwaves",
  subwavesToggleLoadingAriaLabel: "Loading {waveName} subwaves",
} as const);

const QUICK_DM_MESSAGES = objectMessages("quickDm", {
  regionAriaLabel: "Quick direct messages",
  openButtonAriaLabel: "Open quick direct messages",
  openButtonUnreadAriaLabel:
    "Open quick direct messages, {count} unread messages",
  openButtonTitle: "Direct messages",
  listTitle: "Messages",
  chatTitleFallback: "Messages",
  closeAriaLabel: "Close quick direct messages",
  newDirectMessageAriaLabel: "New direct message",
  createModalTitle: "New Direct Message",
  createModalCloseAriaLabel: "Close new direct message modal",
  backAriaLabel: "Back to direct message list",
  backUnreadAriaLabel: "Back to direct message list, unread messages available",
  openAll: "Open all messages",
  openAllAriaLabel: "Open all direct messages",
  showAll: "Show all",
  openConversation: "Open conversation",
  openConversationAriaLabel: "Open conversation with {name}",
  unreadCountAriaLabel: "{count} unread messages",
  unreadPreview: "New messages",
  noMessagesYet: "No messages yet",
  emptyTitle: "No direct messages yet",
  loadingStatus: "Loading direct messages",
  chatLoadError: "Unable to load this conversation.",
} as const);

const NOTIFICATIONS_FOLLOW_BUTTON_MESSAGES = objectMessages(
  "notifications.followButton",
  {
    follow: "Follow",
    following: "Following",
    "error.missingHandleTitle": "Couldn't follow this profile.",
    "error.missingHandleDescription": "This profile is missing a handle.",
  } as const
);

const NOTIFICATIONS_WAVE_CREATED_MESSAGES = objectMessages(
  "notifications.waveCreated",
  {
    normalCopy: "created a wave you can access:",
    dmCopy: "started a DM with you:",
    openDm: "Open DM",
    joinWave: "Join wave",
    joinedWave: "Joined",
    followCreator: "Follow creator",
    followingCreator: "Following creator",
  } as const
);

const NOTIFICATIONS_WAVE_FOLLOW_BUTTON_MESSAGES = objectMessages(
  "notifications.waveFollowButton",
  {
    join: "Join",
    joined: "Joined",
  } as const
);

const WAVE_HEADER_MESSAGES = objectMessages("waves.header", {
  createdLabel: "Created {relativeTime} · {date}",
  "postsCount.one": "{count} Post",
  "postsCount.other": "{count} Posts",
} as const);

const WAVE_NOTIFICATION_SETTINGS_MESSAGES = namespaceMessages(
  "waves.notificationSettings",
  [
    ["trigger.tooltip", "Notification settings"],
    ["trigger.ariaLabel", "Open notification settings"],
    ["allMentions.label", "ALL mentions"],
    ["allMentions.ariaLabel", "Receive ALL mention notifications"],
    ["allMessages.label", "All messages"],
    ["allMessages.ariaLabel", "Receive notifications for all messages"],
    [
      "allMessages.limit.unavailableDescription",
      "Below {count} followers only.",
    ],
    [
      "allMessages.limit.reenableDescription",
      "Re-enable below {count} followers.",
    ],
    ["mute.label", "Mute"],
    ["mute.activeLabel", "Muted"],
    ["mute.ariaLabel", "Mute wave"],
    ["mute.unmuteAriaLabel", "Unmute wave"],
    ["mute.tooltip.enable", "Click to mute this wave"],
    ["mute.tooltip.disable", "Click to unmute this wave"],
    ["mute.error.muteTitle", "Couldn't mute this wave."],
    ["mute.error.unmuteTitle", "Couldn't unmute this wave."],
    ["mute.error.description", PLEASE_TRY_AGAIN],
    ["mute.error.fallbackMute", "Unable to mute wave"],
    ["mute.error.fallbackUnmute", "Unable to unmute wave"],
    ["preferences.error.updateTitle", "Couldn't update notification settings."],
    ["preferences.error.description", PLEASE_TRY_AGAIN],
    [
      "preferences.error.enableAllMentions",
      "Unable to enable @ALL notifications",
    ],
    [
      "preferences.error.disableAllMentions",
      "Unable to disable @ALL notifications",
    ],
    [
      "preferences.error.enableAllMessages",
      "Unable to enable all-message notifications",
    ],
    [
      "preferences.error.disableAllMessages",
      "Unable to disable all-message notifications",
    ],
    ["retry.label", "Retry"],
    ["retry.ariaLabel", "Retry notification settings"],
  ] as const
);

const WAVE_CREATE_GROUPS_MESSAGES = objectMessages("waves.create.groups", {
  accessHelper:
    "The {viewGroupName} group controls who can access this wave. Your followers who can view the wave may be notified when it is created.",
  limitedAccessTitle: "Warning: Limited Access",
  limitedAccessDescription:
    'This wave is configured with restricted access. It can only be viewed by members of the "{viewGroupName}" group and managed by members of the "{adminGroupName}" group. If you are not in a group that can view it, you will not be able to access this wave.',
  "inlineIdentities.emptyHelper":
    "Add identities one by one to build this access group.",
  "inlineIdentities.creatorExcludedWarning":
    "Warning: You are not included in this group. If it controls who can view the wave, you may not be able to access the wave after creating it.",
} as const);

const GROUP_NFT_OWNERSHIP_MESSAGES = objectMessages("groups.nftOwnership", {
  "collection.gradients": "Gradients",
  "collection.memelab": "Meme Lab",
  "collection.memes": "Memes",
  "collection.nextgen": "NextGen",
  "matchMode.any": "Own any",
  "matchMode.all": "Own all",
  requirementLabel: "{collection} requirement",
  tokenRequirementLabel: "{collection} token requirement",
  description:
    "Choose whether identities must own any selected token or all selected tokens.",
  "card.tooltip": "Internal NFT ownership requirements for this group.",
  "card.anyCollectionToken": "{collection}: any collection token",
  "card.anySelected": "{collection}: any selected ({count})",
  "card.allSelected": "{collection}: all selected ({count})",
} as const);

const WAVE_CHAT_MESSAGES = objectMessages("waves.chat", {
  fileUploadAreaAriaLabel: "Wave chat file upload area",
} as const);

const WAVE_LOADING_MESSAGES = objectMessages("waves", {
  loadingStatus: "Loading waves",
} as const);

const WAVE_DROPS_SEARCH_MODAL_MESSAGES = objectMessages(
  "waves.drops.searchModal",
  {
    authorFallback: "unknown author",
    clear: "Clear search",
    close: "Close search",
    description: "Search in {waveName}",
    "empty.description": "Try a different word or phrase.",
    "empty.title": "No messages found",
    "error.description": "Change the query or reopen search to try again.",
    "error.title": "Couldn't load results",
    "idle.description":
      "Type at least {minLength} characters to search this wave.",
    "idle.title": "Ready to search",
    inputLabel: "Search messages in {waveName}",
    loadMore: "Load more",
    loadingMore: "Loading...",
    "loading.description": "Looking through {waveName}.",
    "loading.title": "Searching messages",
    placeholder: "Search messages",
    "result.open": "Open message {serialNo} by {author}",
    "results.count.many": "{count} results",
    "results.count.one": "{count} result",
    "results.query": 'for "{query}"',
    "results.status.many": '{count} results for "{query}"',
    "results.status.one": '{count} result for "{query}"',
    title: "Search messages",
  } as const
);

const WAVE_GIF_PICKER_MESSAGES = objectMessages("waves.gifPicker", {
  dialogTitle: "GIF search",
  searchPlaceholder: "Search GIFs",
  noResults: "No GIFs found.",
  poweredBy: "Powered by {brandName}",
  poweredByPrefix: "Powered by",
  "status.checking": "Checking GIF search...",
  "status.ready": "GIF search is ready.",
  "unavailable.title": "GIF search is temporarily unavailable.",
  "unavailable.hint": "You can upload a GIF file instead.",
} as const);

const WAVE_EXPLORE_CARD_MESSAGES = objectMessages("waves.explore.card", {
  coverAlt: "{waveName} cover",
  "dropsCount.one": "{timeAgo} · {count} drop",
  "dropsCount.other": "{timeAgo} · {count} drops",
  noDropsYet: "No drops yet",
  viewAriaLabel: "View wave {waveName}",
  viewWithScoreAriaLabel: "View wave {waveName}. {scoreSummary}",
} as const);

const WAVE_SCORE_SUMMARY_MESSAGES = objectMessages("waves.score.summary", {
  title: "Score",
  quality: "Quality",
  hotness: "Hotness",
  waveRep: "Wave REP",
  learnMore: "Learn more",
  detailsAriaLabel: "Wave score details",
  openDetailsAriaLabel: "Open {waveName} score details, score {score}",
  scoreAria: "Wave score {visibilityScore}",
  qualityAria: "Quality {qualityScore}, 65% of visibility",
  hotnessAria: "Hotness {hotnessScore}, gated, 35% of visibility",
  repRawAndScore: "REP: {rawRep} raw, {repSortScore} score",
  repRaw: "REP: {rawRep} raw",
  repScore: "REP score: {repSortScore}",
  qualityValue: "{qualityScore} / 65%",
  hotnessValue: "{hotnessScore} / 35% gated",
  repRawAndScoreValue: "{rawRep} / score {repSortScore}",
  repScoreValue: "score {repSortScore}",
  lastMessage: "Last message",
  noMessagesYet: "No messages yet",
} as const);

const WAVE_SCORE_DETAILS_MESSAGES = objectMessages("waves.score.details", {
  statsAriaLabel: "Wave trust stats",
  visibilityAria: "Visibility score {visibilityScore} out of 100",
  hotnessAria: "Hotness score {hotnessScore} out of 100",
  hotnessTitle: "Hotness score: {hotnessScore}",
  qualityInput: "Quality input: {qualityScore} (35% of hotness)",
  recentTrustedActivity: "Recent trusted activity carries the other 65%",
  hotnessQualityGate: "Hotness is gated by quality before visibility",
  repRaw: "Wave REP: {rawRep} raw",
  repScore: "REP score: {repSortScore}",
  repQualityWeight: "REP contributes 35% of quality",
  repPositive: "positive {value}",
  repNegative: "negative {value}",
  repNeutral: "{value}",
  repAriaRaw: "Wave REP {value}",
  repTotalAria: "Wave REP total {value}",
  repAriaScore: "Wave REP score {repScore} out of 100",
  scoreLabel: "Score",
  hotLabel: "Hot",
  repLabel: "REP",
} as const);

const WAVE_REP_ACTION_MESSAGES = objectMessages("waves.rep.action", {
  add: "Add REP",
  edit: "Edit REP",
  addAriaLabel: "Add Wave REP to this wave",
  editAriaLabel:
    "Edit your Wave REP for this wave. Current contribution {contribution}",
  tooltip:
    "Add, increase, decrease, or remove your Wave REP using your available TDH-backed REP credit.",
} as const);

const WAVE_REP_MODAL_MESSAGES = objectMessages("waves.rep.modal", {
  remove: "Remove",
  removeAriaLabel: "Remove Wave REP",
  noAvailableCredit:
    "No available Wave REP credit for this category. You can adjust existing REP when you have a current contribution, or come back when more credit is available.",
} as const);

const WAVE_REP_DETAILS_MESSAGES = objectMessages("waves.rep.details", {
  "summary.title": "Wave REP",
  "summary.contributors.one": "{count} contributor",
  "summary.contributors.other": "{count} contributors",
  "summary.total": "Total",
  "summary.yourRep": "Your REP",
  "summary.positive": "Positive",
  "summary.negative": "Negative",
  "categories.title": "Categories",
  "categories.loading": "Loading",
  "categories.all": "All",
  "categories.active": "Category",
  "categories.activeAriaLabel": "Choose active Wave REP category",
  "categories.browse": "Show all categories",
  "categories.searchPlaceholder": "Search categories",
  "categories.searchAriaLabel": "Search Wave REP categories",
  "categories.noMatches": "No matching categories",
  "categories.allAriaLabel":
    "Show all contributors, {rep} Wave REP from {contributors}",
  "categories.categoryAriaLabel":
    "Show contributors in {category}, {rep} Wave REP from {contributors}",
  "categories.empty": "No REP categories yet.",
  "categories.error": "Could not load categories.",
  "categories.loadMoreError": "Could not load more categories.",
  "categories.loadingMore": "Loading categories",
  "categories.loadMore": "Load more categories",
  "view.ariaLabel": "Wave REP detail view",
  "view.contributors": "Contributors",
  "view.activity": "Activity",
  "contributors.heading.all": "All contributors by Wave REP",
  "contributors.heading.category": "Contributors in {category}",
  "contributors.description.all": "{contributors}",
  "contributors.description.category": "{contributors}, {rep}",
  "contributors.categoryFilter": "Category: {category}",
  "contributors.categoryFilterAll": "All",
  "contributors.error": "Could not load contributors.",
  "contributors.empty.all": "No Wave REP yet.",
  "contributors.empty.category": "No contributors in {category} yet.",
  "contributors.loadMoreError": "Could not load more contributors.",
  "contributors.loadingMore": "Loading contributors",
  "contributors.loadMore": "Load more contributors",
  "activity.title": "Wave REP activity",
  "activity.description": "Recent edits across all categories",
  "activity.unknownRater": "Unknown",
  "activity.error": "Could not load Wave REP activity.",
  "activity.empty": "No Wave REP activity yet.",
  "activity.loadMoreError": "Could not load more activity.",
  "activity.loadingMore": "Loading activity",
  "activity.loadMore": "Load more activity",
  "activity.reason.lostTdh": "Lost TDH",
  "activity.reason.unknown": "{reason}",
  "actions.retry": "Retry",
  profileAvatarAlt: "{profile} profile",
  "rep.positive": "+{value}",
} as const);

const PROFILE_ACTIVITY_RATE_MESSAGES = objectMessages("profileActivity.rate", {
  "matter.waveRep": "Wave REP",
} as const);

const USER_RATE_MESSAGES = objectMessages("user.rate", {
  "subtitle.waveRep": "give Wave REP for",
} as const);

const ABOUT_TECH_MESSAGES = objectMessages("about.tech", {
  "metadata.title": "Tech",
  "metadata.description": "About",
  "index.prsCovered": "PRs Covered",
  "notes.walletAuthentication.ariaLabel":
    "Wallet authentication upgrade: what is changing with the new secure session",
  "report.total": "Total",
  "report.repos": "Repos",
  "report.daily": "Daily",
  "report.prCount": "{count} PRs",
  "report.repoSummary": "{focus}. {count} PRs, {stateSummary}.",
  "report.tocDescription":
    "This report is split by repository. Use this index to jump directly to the area you want, or read through from the frontend app work into backend, Stream contracts, Safe app hardening, and review bot updates.",
  "walletAuth.metadata.title": "Wallet Authentication Update",
  "walletAuth.metadata.description":
    "A simple explanation of the new 6529 wallet authentication session.",
  "walletAuth.backToTech": "Back to Tech",
  "walletAuth.eyebrow": "Wallet Authentication",
  "walletAuth.title": "Wallet Authentication Update",
  "walletAuth.lead":
    "6529 is moving wallet sign-in to a newer secure session. Most people only need to sign once when they are prompted.",
  "walletAuth.whatIsChanging.title": "What is changing",
  "walletAuth.whatIsChanging.identity":
    "Your wallet is still your identity. The update changes the browser session that 6529 creates after you sign in.",
  "walletAuth.whatIsChanging.session":
    "The new session is easier to refresh, easier to revoke, and better for sharing a connection with your own devices.",
  "walletAuth.whatToDo.title": "What you need to do",
  "walletAuth.whatToDo.upgrade":
    "If you see the {prompt} prompt, connect the same wallet and sign the message.",
  "walletAuth.whatToDo.prompt": "Upgrade Authentication",
  "walletAuth.whatToDo.noGas":
    "The signature does not cost gas and does not send a transaction.",
  "walletAuth.whatToDo.reminder":
    "If you choose {action}, you can still upgrade from your profile menu.",
  "walletAuth.whatToDo.reminderAction": "Remind me later",
  "walletAuth.whyNow.title": "Why you may see this prompt",
  "walletAuth.whyNow.deadline":
    "Some older sessions can keep working until the upgrade deadline. During that time, 6529 may remind you to upgrade before the older session expires.",
  "walletAuth.whyNow.features":
    "Some newer features, including mobile connection sharing, need the new session before they can work.",
  "walletAuth.same.title": "What stays the same",
  "walletAuth.same.profile": "Your wallet address and profile do not change.",
  "walletAuth.same.assets": "You do not need to move tokens or assets.",
  "walletAuth.same.desktop":
    "The 6529 Desktop app continues using the existing connection flow during this rollout.",
  "walletAuth.builders.title": "Building with the API",
  "walletAuth.builders.body":
    "External clients should use the session-v2 API authentication guide instead of the user upgrade notes on this page.",
  "walletAuth.builders.link": "Open API authentication guide",
} as const);

const ATTACHMENT_MESSAGES = namespaceMessages("attachment", [
  ["safety.ariaLabel", "Scanned and validated attachment"],
  ["safety.badge", "Scanned and validated"],
  ["safety.heading", "Attachment safety"],
  ["safety.hideDetails", "Hide safety details"],
  ["safety.sha256", "SHA-256"],
  ["safety.size", "Size {size}"],
  ["safety.viewDetails", "View safety details"],
] as const);

const COMMON_MESSAGES = objectMessages("common", {
  close: "Close",
} as const);

export const EN_US_MESSAGES = {
  ...join6529Messages,
  "auth.sessionUpgrade.action": "Upgrade Authentication",
  "auth.signModal.connectionUpdateRequired": "Connection Update Required",
  "auth.signModal.upgradeAuthentication": "Upgrade Authentication",
  "auth.signModal.authenticationRequest": "Sign Authentication Request",
  "auth.signModal.connectionShareLead":
    "This shared connection uses the previous authentication flow. Reshare the connection from a device that is already signed in with the new authentication.",
  "auth.signModal.sessionUpgradeLead":
    "We have upgraded wallet authentication. Sign once to move this connected wallet to the new secure session.",
  "auth.signModal.authLead":
    "To connect your wallet, you will need to sign a message to confirm your identity.",
  "auth.signModal.connectionSharePrimary":
    "Use connection sharing from an active session-v2 web connection, then open the new shared connection on this device.",
  "auth.signModal.disconnectedUpgradePrimary":
    "Reconnect this wallet and sign once to upgrade this browser session.",
  "auth.signModal.sessionUpgradePrimary":
    "Your current connection will stay available while the new session is created.",
  "auth.signModal.authPrimary":
    "This signature will be used to generate a secure token (JWT) to authenticate your session.",
  "auth.signModal.sharedConnection":
    "If this is a shared connection, reshare the connection from a device that is already signed in with the new authentication.",
  "auth.signModal.timeLeft": "Time left to upgrade: {timeLeft}.",
  "auth.signModal.timeLeft.now": "now",
  "auth.signModal.timeLeft.lessThanOneHour": "less than 1 hour",
  "auth.signModal.timeLeft.days.one": "{count} day",
  "auth.signModal.timeLeft.days.many": "{count} days",
  "auth.signModal.timeLeft.hours.one": "{count} hour",
  "auth.signModal.timeLeft.hours.many": "{count} hours",
  "auth.signModal.manualUpgrade":
    "Connection sharing and some newer features need the new secure session.",
  "auth.signModal.connectWalletPrompt": "Connect your wallet to continue.",
  "auth.signModal.noGas":
    "Your signature will not cost any gas and is purely for authentication purposes.",
  "auth.signModal.connect": "Connect",
  "auth.signModal.sign": "Sign",
  "auth.signModal.learnMore": "Learn more about this update",
  "auth.signModal.remindLater": "Remind me later",
  "auth.signModal.cancel": "Cancel",
  "auth.signModal.confirmInWallet": "Confirm in your wallet",
  "acceptConnection.title": "Accept Connection Sharing",
  "acceptConnection.sharedConnectionFallback": "Shared connection",
  "acceptConnection.home": "Take me home",
  "acceptConnection.limit.title": "Connected profile limit reached",
  "acceptConnection.limit.message":
    "You can keep up to {maxCount} connected profiles. Sign out from one profile, then scan this connection link again.",
  "acceptConnection.incoming.title": "Incoming connection from",
  "acceptConnection.incoming.profileStatsLabel": "TDH: {tdh} - Level: {level}",
  "acceptConnection.currentProfile.prefix": "Your current profile",
  "acceptConnection.currentProfile.willStayAvailable": "will stay available.",
  "acceptConnection.currentProfile.switchAfterAccepting":
    "You can switch between both after accepting.",
  "acceptConnection.action.processing": "Processing",
  "acceptConnection.action.accept": "Accept connection",
  "acceptConnection.unsupportedWeb":
    "Open this connection link in the 6529 mobile app.",
  "acceptConnection.missingParameters": "Missing required parameters",
  "acceptConnection.toast.maxProfiles": "Maximum connected profiles reached",
  "acceptConnection.toast.invalidResponse": "Invalid connection response",
  "acceptConnection.toast.persistFailed": "Failed to store connected profile",
  "acceptConnection.toast.acceptFailed":
    "Couldn't accept this connection. Please try again.",
  "navigation.primary.ariaLabel": "Primary navigation",
  "appWallet.validation.name.alphanumericSpaces":
    "Name can only contain alphanumeric characters and spaces",
  "appWallet.validation.password.minLength":
    "Password must be at least {count} characters long",
  "appWallet.validation.password.noWhitespace":
    "Password must not contain any whitespace characters",
  "appWallet.validation.password.lowercase":
    "Password must include a lowercase letter",
  "appWallet.validation.password.uppercase":
    "Password must include an uppercase letter",
  "appWallet.validation.password.number": "Password must include a number",
  "appWallet.validation.password.symbol": "Password must include a symbol",
  "headerShare.trigger.ariaLabel": "QR Code",
  "headerShare.trigger.title": "QR Code",
  "headerShare.trigger.text": "Share",
  "headerShare.modal.title": "Share",
  "headerShare.modal.closeAriaLabel": "Close share modal",
  "headerShare.menu.shareType": "Share Type",
  "headerShare.menu.selectPlatform": "Select Platform",
  "headerShare.menu.openLinkIn": "Open Link In",
  "headerShare.menu.openUrlIn": "Open URL In",
  "headerShare.menu.connection": "Connection",
  "headerShare.menu.currentUrl": "Current URL",
  "headerShare.menu.apps": "6529 Apps",
  "headerShare.menu.mobile": "6529 Mobile",
  "headerShare.menu.browser": "Browser",
  "headerShare.menu.desktop": "6529 Desktop",
  "headerShare.qr.browserAlt": "Browser Link - QR Code",
  "headerShare.qr.mobileAlt": "Mobile App Link - QR Code",
  "headerShare.qr.shareConnectionAlt": "Share Connection - QR Code",
  "headerShare.core.alt": "6529 Desktop",
  "headerShare.core.open": "Open in 6529 Desktop",
  "headerShare.connectionNotice.legacyTitle": "Update Authentication",
  "headerShare.connectionNotice.loadingTitle": "Preparing Connection",
  "headerShare.connectionNotice.errorTitle": "Connection Sharing Unavailable",
  "headerShare.connectionNotice.unauthenticatedTitle": "Sign In Required",
  "headerShare.connectionNotice.legacyMessage":
    "You can't share a connection from your current authentication. Update to the new secure session first.",
  "headerShare.connectionNotice.loadingMessage":
    "Creating a one-time connection code.",
  "headerShare.connectionNotice.errorMessage":
    "We couldn't create a connection share. Close this dialog and try again.",
  "headerShare.connectionNotice.unauthenticatedMessage":
    "Connect and authenticate your wallet before sharing a connection.",
  "headerShare.connectionNotice.cancel": "Cancel",
  "headerShare.connectionNotice.update": "Update",
  "headerShare.invalidShareSubmode": "Invalid submode for SHARE",
  "headerShare.copy.ariaLabel": "Copy URL",
  "headerShare.copy.default": "Copy URL",
  "headerShare.copy.copied": "Copied!",
  "headerPageShare.trigger.ariaLabel": "Share page",
  "headerPageShare.trigger.title": "Share page",
  "headerWaveLinkAction.share": "Share wave",
  "headerWaveLinkAction.copy": "Copy wave link",
  "headerWaveLinkAction.feedback.shared": "Link shared",
  "headerWaveLinkAction.feedback.copied": "Link copied",
  "acceptConnection.incoming.profileStats": "TDH: {tdh} · Level: {level}",
  "tools.api.authCallout.title": "v2 API authentication",
  "tools.api.authCallout.description":
    "New external clients should use session-v2 wallet authentication: request a signable message, sign it exactly, exchange the signature for an access token, then send that token as bearer auth.",
  "tools.api.authCallout.link": "Read the full external-client auth guide",
  "tools.api.authentication.title": "Authentication quickstart",
  "tools.api.authentication.basedOnSignatures":
    "Authentication is based on Ethereum signatures. For scripts and other external clients, request a native session-v2 challenge.",
  "tools.api.authentication.externalNote":
    "This example shows the short native/script flow for external API clients.",
  "tools.api.authentication.fullGuideLink":
    "Use the full guide for refresh, logout, and security notes.",
  "tools.api.authentication.flowIntro": "The flow works as follows:",
  "tools.api.authentication.requestSessionMessage":
    "Request a session-v2 signable message for the wallet you want to authenticate.",
  "tools.api.authentication.signMessage":
    "Sign the signable message exactly using your wallet.",
  "tools.api.authentication.sendSignature":
    "Send the signature back to the server.",
  "tools.api.authentication.receiveToken":
    "Receive a JWT bearer token, which you can include in headers of subsequent requests.",
  "home.boostedDrop.anonymousAuthor": "Anonymous",
  "home.boostedDrop.badge": "Boosted drop",
  "home.boostedDrop.boost": "Boost",
  "home.boostedDrop.boostDrop": "Boost drop by {author}",
  "home.boostedDrop.boosted": "Boosted",
  "home.boostedDrop.boostCount.one": "{count} boost",
  "home.boostedDrop.boostCount.many": "{count} boosts",
  "home.boostedDrop.compactAuthor": "by {author}",
  "home.boostedDrop.internalLinkSource": "{source} link",
  "home.boostedDrop.internalLinks.networkWaveScoreTitle": "Network: Wave Score",
  "home.boostedDrop.openDrop": "Open boosted drop from {author}",
  "home.boostedDrop.removeBoost": "Remove boost",
  "home.boostedDrop.removeBoostFromDrop": "Remove boost from drop by {author}",
  "home.boostedDrop.viewAuthor": "View {author}'s profile",
  "home.mintSubscriptions.balanceLabel": "Balance",
  "home.mintSubscriptions.infoLinkAriaLabel":
    "Learn more about The Memes subscriptions",
  "home.mintSubscriptions.profileSubscriptionsLink": "My subscriptions",
  "home.mintSubscriptions.manageSubscriptionsLink": "Manage",
  "home.mintSubscriptions.connectToSubscribe": "Connect to Subscribe",
  "home.mintSubscriptions.connectFailed":
    "Failed to open wallet connection. Please try again.",
  "home.mintSubscriptions.awarenessLabel": "Subscription Minting",
  "home.mintSubscriptions.action.manage": "Manage",
  "home.mintSubscriptions.action.setUp": "Set up",
  "home.mintSubscriptions.subscribeLabel": "Subscribe",
  "home.mintSubscriptions.subscribedLabel": "Subscribed",
  "home.mintSubscriptions.subscribersCount": "x{count} subscribers",
  "home.mintSubscriptions.subscribersLoading": "Loading subscriber count",
  "home.mintSubscriptions.tooltip.connect":
    "Connect to set up subscription minting.",
  "home.mintSubscriptions.tooltip.dropped":
    "Subscription minting is closed for this drop.",
  "home.mintSubscriptions.tooltip.manage.one":
    "You are subscribed for x{count} copy of this drop.",
  "home.mintSubscriptions.tooltip.manage.many":
    "You are subscribed for x{count} copies of this drop.",
  "home.mintSubscriptions.tooltip.manageFallback":
    "You are subscribed for this drop.",
  "home.mintSubscriptions.tooltip.mintDay":
    "Subscription minting cannot be changed on mint day.",
  "home.mintSubscriptions.tooltip.profileSubscribe":
    "You are not subscribed for this drop.",
  "home.mintSubscriptions.tooltip.proxy":
    "Manage subscriptions from your own profile, not a proxy session.",
  "waveChat.boostedDrops.display.description":
    "Choose how inserted boosted-drop cards appear in wave chat on this device.",
  "waveChat.boostedDrops.display.expanded": "Expanded",
  "waveChat.boostedDrops.display.hidden": "Hidden",
  "waveChat.boostedDrops.display.compact": "Compact",
  "waveChat.boostedDrops.display.label": "Boosted drops",
  "waveChat.boostedDrops.display.menuCurrent": "Boosted drops: {mode}",
  "waveChat.boostedDrops.display.sectionTitle": "Your display",
  "theMemes.documentTitle": "The Memes | Collections",
  "theMemes.description.collections": "Collections",
  "theMemes.title": "The Memes",
  "theMemes.sorting.regionLabel": "Meme sorting",
  "theMemes.sorting.sortBy": "Sort by",
  "theMemes.sorting.directionLegend": "Sort direction",
  "theMemes.sorting.ascendingLabel": "Sort ascending",
  "theMemes.sorting.descendingLabel": "Sort descending",
  "theMemes.sorting.sortButtonLabel": "Sort by {sort}",
  "theMemes.filters.triggerAriaLabel": "{filter}: {value}",
  "theMemes.filters.year.label": "Year",
  "theMemes.filters.year.all": "All Years",
  "theMemes.filters.year.option": "Year {year}",
  "theMemes.filters.season.label": "Season",
  "theMemes.filters.season.all": "All Seasons",
  "theMemes.filters.season.allForYear": "All Year {year}",
  "theMemes.loading.fetching": "Fetching",
  "theMemes.empty.title": "No memes found",
  "theMemes.empty.description": "Try a different season or sort option.",
  "theMemes.card.linkAriaLabel": "View {name}, card #{tokenId}",
  "theMemes.card.metric.unavailable": "-",
  "theMemes.card.metric.editionSize": "Edition Size: {value}",
  "theMemes.card.metric.tdh": "TDH: {value}",
  "theMemes.card.metric.collectors": "Collectors: {value}",
  "theMemes.card.metric.unique": "Unique: {value}",
  "theMemes.card.metric.uniqueExMuseum": "Unique Ex-Museum: {value}",
  "theMemes.card.metric.floorPrice": "Floor Price: {value}",
  "theMemes.card.metric.floorPriceUnavailable": "Floor Price: N/A",
  "theMemes.card.metric.highestOffer": "Highest Offer: {value}",
  "theMemes.card.metric.highestOfferUnavailable": "Highest Offer: N/A",
  "theMemes.card.metric.marketCap": "Market Cap: {value}",
  "theMemes.card.metric.marketCapUnavailable": "Market Cap: N/A",
  "theMemes.card.metric.volume": "Volume ({volumeType}): {value}",
  "theMemes.card.metric.ethValue": "{value} ETH",
  "theMemes.detail.backLink.ariaLabel": "Back to The Memes",
  "theMemes.detail.heading.card": "Card {tokenId}",
  "theMemes.detail.heading.ariaLabel": "Card {tokenId} - {name}",
  "theMemes.detail.sections.ariaLabel": "Meme page sections",
  "theMemes.detail.history.ariaLabel": "Meme history sections",
  "theMemes.detail.tabs.overview": "Overview",
  "theMemes.detail.tabs.yourCards": "Your Cards",
  "theMemes.detail.tabs.theArt": "The Art",
  "theMemes.detail.tabs.references": "References",
  "theMemes.detail.tabs.collectors": "Collectors",
  "theMemes.detail.tabs.history": "History",
  "theMemes.detail.tabs.activity": "Activity",
  "theMemes.detail.tabs.cardActivity": "Card Activity",
  "theMemes.detail.tabs.timeline": "Timeline",
  "theMemes.detail.tabs.yourTransactions": "Your Transactions",
  ...EN_US_THE_MEMES_COLLECTORS_MESSAGES,
  ...THE_MEMES_DETAIL_LIVE_MESSAGES,
  ...THE_MEMES_DETAIL_ACTIVITY_MESSAGES,
  ...THE_MEMES_DETAIL_TIMELINE_MESSAGES,
  ...THE_MEMES_DETAIL_REFERENCES_MESSAGES,
  ...THE_MEMES_DETAIL_ART_MESSAGES,
  ...TIMELINE_MESSAGES,
  ...MEME_CALENDAR_MESSAGES,
  "theMemes.sort.age": "Age",
  "theMemes.sort.editionSize": "Edition Size",
  "theMemes.sort.meme": "Meme",
  "theMemes.sort.collectors": "Collectors",
  "theMemes.sort.tdh": "TDH",
  "theMemes.sort.uniquePercent": "Unique %",
  "theMemes.sort.uniquePercentExMuseum": "Unique % Exc. Museum",
  "theMemes.sort.floorPrice": "Floor Price",
  "theMemes.sort.marketCap": "Market Cap",
  "theMemes.sort.volume": "Volume",
  "theMemes.sort.highestOffer": "Highest Offer",
  "theMemes.volume.trigger": "Volume",
  "theMemes.volume.triggerWithValue": "Volume: {volumeType}",
  "theMemes.volume.24Hours": "24 Hours",
  "theMemes.volume.7Days": "7 Days",
  "theMemes.volume.30Days": "30 Days",
  "theMemes.volume.allTime": "All Time",
  "memeLab.documentTitle": "Meme Lab | Collections",
  "memeLab.title": "Meme Lab",
  "memeLab.collections.title": "Meme Lab Collections",
  "memeLab.collections.documentTitle":
    "{collectionName} | Meme Lab Collections",
  "memeLab.description.collections": "Collections",
  "memeLab.sorting.regionLabel": "Meme Lab sorting",
  "memeLab.sorting.collectionRegionLabel": "Meme Lab collection sorting",
  "memeLab.sorting.sortBy": "Sort by",
  "memeLab.sorting.directionLegend": "Sort direction",
  "memeLab.sorting.ascendingLabel": "Sort ascending",
  "memeLab.sorting.descendingLabel": "Sort descending",
  "memeLab.sorting.sortButtonLabel": "Sort by {sort}",
  "memeLab.loading.fetching": "Fetching",
  "memeLab.results.gridLabel": "Meme Lab cards",
  "memeLab.results.artistGridLabel": "Meme Lab cards by {artistName}",
  "memeLab.results.collectionGridLabel": "Meme Lab cards in {collectionName}",
  "memeLab.collection.view": "view",
  "memeLab.collection.viewAriaLabel": "View {collectionName} collection",
  "memeLab.card.linkAriaLabel": "View {name}, Meme Lab card #{tokenId}",
  "memeLab.card.metric.unavailable": "-",
  "memeLab.card.metric.artists": "Artists: {value}",
  "memeLab.card.metric.editionSize": "Edition Size: {value}",
  "memeLab.card.metric.collectors": "Collectors: {value}",
  "memeLab.card.metric.unique": "Unique: {value}",
  "memeLab.card.metric.uniqueExMuseum": "Unique Ex-Museum: {value}",
  "memeLab.card.metric.floorPrice": "Floor Price: {value}",
  "memeLab.card.metric.floorPriceUnavailable": "Floor Price: N/A",
  "memeLab.card.metric.highestOffer": "Highest Offer: {value}",
  "memeLab.card.metric.highestOfferUnavailable": "Highest Offer: N/A",
  "memeLab.card.metric.marketCap": "Market Cap: {value}",
  "memeLab.card.metric.marketCapUnavailable": "Market Cap: N/A",
  "memeLab.card.metric.volume": "Volume ({volumeType}): {value}",
  "memeLab.card.metric.volumeUnavailable": "Volume ({volumeType}): N/A",
  "memeLab.card.metric.ethValue": "{value} ETH",
  "memeLab.sort.age": "Age",
  "memeLab.sort.editionSize": "Edition Size",
  "memeLab.sort.artists": "Artists",
  "memeLab.sort.collections": "Collections",
  "memeLab.sort.collectors": "Collectors",
  "memeLab.sort.uniquePercent": "Unique %",
  "memeLab.sort.uniquePercentExMuseum": "Unique % Exc. Museum",
  "memeLab.sort.floorPrice": "Floor Price",
  "memeLab.sort.marketCap": "Market Cap",
  "memeLab.sort.volume": "Volume",
  "memeLab.sort.highestOffer": "Highest Offer",
  ...MEME_LAB_DETAIL_MESSAGES,
  ...DISTRIBUTION_MESSAGES,
  "rememes.documentTitle": "ReMemes | Collections",
  "rememes.title": "ReMemes",
  "rememes.description.collections": "Collections",
  "rememes.logoAlt": "ReMemes",
  "rememes.actions.add": "Add ReMeme",
  "rememes.results.count": "(x{count})",
  "rememes.results.gridLabel": "ReMemes results",
  "rememes.sorting.filterLabel": "Sort",
  "rememes.sort.random": "Random",
  "rememes.sort.recentlyAdded": "Recently Added",
  "rememes.tokenType.filterLabel": "Token Type",
  "rememes.tokenType.all": "All",
  "rememes.tokenType.erc721": "ERC-721",
  "rememes.tokenType.erc1155": "ERC-1155",
  "rememes.memeReference.filterLabel": "Meme Reference",
  "rememes.memeReference.all": "All",
  "rememes.loading.fetching": "Fetching",
  "rememes.refresh.ariaLabel": "Refresh ReMemes results",
  "rememes.refresh.tooltip": "Refresh results",
  "rememes.card.linkAriaLabel": "View {name}, ReMeme #{tokenId}",
  "rememes.card.tokenAriaLabel": "Token #{tokenId}",
  "rememes.card.replicaCount": "(x{count})",
  "user.collected.cards.listLabel": "Collected cards",
  "user.collected.empty.noCards": "No cards to display",
  "user.collected.empty.fullSetter": "Congratulations, full setter!",
  "user.collected.empty.memesFullSetter":
    "Congratulations, The Memes full setter!",
  "user.collected.empty.seasonFullSetter":
    "Congratulations, {season} full setter!",
  "user.collected.empty.gradientFullSetter":
    "Congratulations, Gradient full setter!",
  "user.collected.empty.memeLabFullSetter":
    "Congratulations, Meme Lab full setter!",
  "user.collected.empty.nextGenFullSetter":
    "Congratulations, Next Gen full setter!",
  "user.collected.filters.view": "View",
  "user.collected.filters.view.native": "Native",
  "user.collected.filters.view.network": "Network",
  "user.collected.filters.collection": "Collection",
  "user.collected.filters.collection.all": "All",
  "user.collected.filters.collection.allCollections": "All Collections",
  "user.collected.filters.collection.unknown": "Unknown Collection",
  "user.collected.filters.collection.memes": "The Memes",
  "user.collected.filters.collection.nextgen": "NextGen",
  "user.collected.filters.collection.gradients": "Gradients",
  "user.collected.filters.collection.memeLab": "Meme Lab",
  "user.collected.filters.collection.network": "Network",
  "user.collected.filters.sortBy": "Sort By",
  "user.collected.filters.sort.tokenId": "Token ID",
  "user.collected.filters.sort.tdh": "TDH",
  "user.collected.filters.sort.rank": "Rank",
  "user.collected.filters.sort.xtdh": "xTDH",
  "user.collected.filters.sort.xtdhDay": "xTDH/day",
  "user.collected.filters.seized": "Seized",
  "user.collected.filters.seized.all": "All",
  "user.collected.filters.seized.allCards": "All Cards",
  "user.collected.filters.seized.seized": "Seized",
  "user.collected.filters.seized.notSeized": "Not Seized",
  "user.collected.filters.scrollLeft": "Scroll filters left",
  "user.collected.filters.scrollRight": "Scroll filters right",
  "profileCms.header.openWebsite": "Open {handle} website",
  "profileCms.header.website": "Website",
  "profileCms.nav.label": "{siteTitle} navigation",
  "profileCms.state.eyebrow": "Profile website",
  "profileCms.state.loading.title": "Loading website",
  "profileCms.state.empty.title": "Website page not found",
  "profileCms.state.empty.description":
    "This profile website is published, but this page is not available.",
  "profileCms.state.routeUnavailable.title": "Website route unavailable",
  "profileCms.error.title": "Website unavailable",
  "profileCms.error.retry": "Try again",
  "profileCms.error.description": "This profile website could not be rendered.",
  "profileCms.block.unsupported": "Unsupported block",
  "profileCms.block.videoUnavailable": "Video unavailable",
  "profileCms.block.audioUnavailable": "Audio unavailable",
  "profileCms.block.galleryUnavailable": "Gallery unavailable",
  "profileCms.block.openLink": "Open link",
  "profileCms.block.linkUnavailable": "Link unavailable",
  "profileCms.block.nftReferenceUnavailable": "NFT reference unavailable",
  "profileCms.block.collectionFallback": "Collection",
  "profileCms.block.transactionFallback": "Transaction",
  "profileCms.block.imageUnavailable": "Image unavailable",
  "profileCms.media.noCaptions":
    "No captions were provided for this media asset.",
  "profileCms.media.captionTrackLabel": "Description",
  "profileCms.reference.tokenTitle": "Token #{tokenId}",
  "profileCms.reference.chain": "Chain {chainId}",
  "profileCms.walletGallery.title": "Wallet gallery",
  "profileCms.walletGallery.summary.one": "{count} wallet",
  "profileCms.walletGallery.summary.many": "{count} wallets",
  "profileCms.walletGallery.blockNumber": "Block",
  "profileCms.walletGallery.capturedAt": "Captured",
  ...profileCmsArtDisplayMessages,
  "profileCms.interactive.deepZoom.title": "Deep zoom preview",
  "profileCms.interactive.deepZoom.description":
    "This V1 renderer keeps deep zoom static until the interactive viewer is enabled.",
  "profileCms.interactive.embed.title": "Embedded media preview",
  "profileCms.interactive.embed.description":
    "This embed is not marked for sandboxed rendering.",
  "profileCms.interactive.embed.iframeTitle": "Embedded profile website media",
  "profileCms.interactive.object.title": "3D object preview",
  "profileCms.interactive.object.description":
    "Load the GLB or glTF viewer when you are ready to inspect the model.",
  "profileCms.interactive.room.title": "Room preview",
  "profileCms.interactive.room.description":
    "Enter a simple exhibition room. Every artwork still links to its canonical 2D detail page.",
  "profileCms.interactive.openSourceMedia": "Open source media",
  "profileCms.interactive.enterRoom": "Enter room",
  "profileCms.interactive.fullscreen": "Full screen",
  "profileCms.interactive.exitFullscreen": "Exit full screen",
  "profileCms.interactive.loadObject": "Load 3D object",
  "profileCms.interactive.loading": "Loading {progress}%",
  "profileCms.interactive.loadError":
    "The 3D preview could not be loaded. Use the 2D links below.",
  "profileCms.interactive.mobileFallback":
    "This mobile view uses the static poster and 2D links for a lighter, more reliable experience.",
  "profileCms.interactive.openFallback": "Open 2D fallback",
  "profileCms.interactive.roomWorksLabel": "Room artworks",
  "profileCms.interactive.canvasLabel": "Interactive 3D preview",
  "profileCms.interactive.budgetWarning":
    "This 3D asset is above the declared performance budget, so loading may be slow.",
  "profileCms.builder.pageTitle": "Profile CMS builder",
  "profileCms.builder.pageDescription":
    "Build and preview a profile-native CMS site package.",
  "profileCms.builder.workspaceLabel": "CMS builder workspace",
  "profileCms.builder.tab.editor": "Editor",
  "profileCms.builder.tab.preview": "Preview",
  "profileCms.builder.tab.json": "JSON",
  "profileCms.builder.tab.agent": "Agent",
  "profileCms.builder.cta.saveDraft": "Save draft",
  "profileCms.builder.cta.serverValidate": "Server validate",
  "profileCms.builder.cta.publish": "Publish",
  "profileCms.builder.templates.title": "Site template",
  "profileCms.builder.templates.homepage": "Basic homepage",
  "profileCms.builder.templates.walletGallery": "Wallet gallery",
  "profileCms.builder.templates.gallery": "Gallery",
  "profileCms.builder.templates.room": "3D room",
  "profileCms.builder.templates.status.comingSoon": "Coming soon",
  "profileCms.builder.gallery.settings": "Gallery settings",
  "profileCms.builder.gallery.wallets.title": "Wallet sources",
  "profileCms.builder.gallery.wallets.label": "Wallets or ENS names",
  "profileCms.builder.gallery.wallets.help":
    "Paste one or more ETH addresses or ENS names, separated by commas, spaces, or new lines.",
  "profileCms.builder.gallery.wallets.emptyError":
    "Enter at least one ETH address or ENS name.",
  "profileCms.builder.gallery.wallets.invalidError":
    "These wallet entries need attention: {entries}",
  "profileCms.builder.gallery.snapshot.request": "Request snapshot",
  "profileCms.builder.gallery.snapshot.loading": "Requesting...",
  "profileCms.builder.gallery.snapshot.loadingDetail":
    "Collecting holdings and media candidates for review.",
  "profileCms.builder.gallery.snapshot.failed":
    "Gallery snapshot could not be created.",
  "profileCms.builder.gallery.snapshot.fixture": "Fixture snapshot",
  "profileCms.builder.gallery.snapshot.api": "Backend snapshot",
  "profileCms.builder.gallery.snapshot.warning.fixtureBackendDisabled":
    "Fixture snapshot used until the gallery backend snapshot endpoint is enabled.",
  "profileCms.builder.gallery.snapshot.warning.partialMedia":
    "Some media may be pending or unavailable in the reviewed snapshot.",
  "profileCms.builder.gallery.review.title": "Snapshot review",
  "profileCms.builder.gallery.review.description":
    "Review the frozen wallet snapshot before saving the generated gallery package.",
  "profileCms.builder.gallery.review.empty":
    "Request a wallet snapshot to review assets, collections, media status, and generated preview.",
  "profileCms.builder.gallery.summary.wallets": "Wallets",
  "profileCms.builder.gallery.summary.visible": "Visible works",
  "profileCms.builder.gallery.summary.hidden": "Hidden works",
  "profileCms.builder.gallery.summary.partial": "Partial media",
  "profileCms.builder.gallery.collections.title": "Featured collections",
  "profileCms.builder.gallery.collections.count": "{count} visible works",
  "profileCms.builder.gallery.collections.feature": "Feature collection",
  "profileCms.builder.gallery.collections.unfeature": "Unfeature collection",
  "profileCms.builder.gallery.assets.title": "Works",
  "profileCms.builder.gallery.assets.empty": "No works were found.",
  "profileCms.builder.gallery.assets.mediaReady": "Media ready",
  "profileCms.builder.gallery.assets.mediaPartial": "Media pending",
  "profileCms.builder.gallery.assets.owner": "Owner: {owner}",
  "profileCms.builder.gallery.assets.hide": "Hide",
  "profileCms.builder.gallery.assets.unhide": "Unhide",
  "profileCms.builder.gallery.assets.feature": "Feature work",
  "profileCms.builder.gallery.assets.unfeature": "Unfeature work",
  "profileCms.builder.gallery.assets.moveUp": "Move up",
  "profileCms.builder.gallery.assets.moveDown": "Move down",
  "profileCms.builder.siteSettings": "Site settings",
  "profileCms.builder.pageSettings": "Homepage settings",
  "profileCms.builder.field.siteTitle": "Site title",
  "profileCms.builder.field.siteDescription": "Site description",
  "profileCms.builder.field.themeAccent": "Theme accent",
  "profileCms.builder.field.pageTitle": "Page title",
  "profileCms.builder.field.pageDescription": "Page description",
  "profileCms.builder.field.socialImageAsset": "Social image asset id",
  "profileCms.builder.field.navigationLabel": "Primary nav label",
  "profileCms.builder.blocks.title": "Blocks",
  "profileCms.builder.block.heading": "Heading",
  "profileCms.builder.block.richText": "Rich text",
  "profileCms.builder.block.buttonLink": "Button link",
  "profileCms.builder.block.image": "Image",
  "profileCms.builder.block.callout": "Callout",
  "profileCms.builder.block.quote": "Quote",
  "profileCms.builder.block.roomViewer": "3D room",
  "profileCms.builder.block.remove": "Remove",
  "profileCms.builder.block.headingText": "Heading text",
  "profileCms.builder.block.body": "Body",
  "profileCms.builder.block.buttonLabel": "Button label",
  "profileCms.builder.block.buttonUrl": "Button URL",
  "profileCms.builder.block.imageUri": "Image URI",
  "profileCms.builder.block.imageAlt": "Image alt text",
  "profileCms.builder.block.caption": "Caption",
  "profileCms.builder.block.tone": "Tone",
  "profileCms.builder.block.calloutTitle": "Callout title",
  "profileCms.builder.block.quoteText": "Quote text",
  "profileCms.builder.block.citation": "Citation",
  "profileCms.builder.block.roomStyle": "Room style",
  "profileCms.builder.block.roomStyle.wall": "Simple wall",
  "profileCms.builder.block.roomStyle.salon": "Salon",
  "profileCms.builder.block.roomStyle.whiteCube": "White cube",
  "profileCms.builder.block.roomStyle.darkRoom": "Dark room",
  "profileCms.builder.block.roomTitle": "Room work title",
  "profileCms.builder.block.roomImageUri": "Room artwork URI",
  "profileCms.builder.json.title": "Package JSON",
  "profileCms.builder.json.label": "Package candidate",
  "profileCms.builder.json.import": "Import JSON",
  "profileCms.builder.json.importFailed": "Package JSON could not be imported.",
  "profileCms.builder.json.downloadPackage": "Download package JSON",
  "profileCms.builder.json.downloadSourcePacket": "Download source packet",
  "profileCms.builder.json.downloadSchemaBundle": "Download schemas",
  "profileCms.builder.agent.source.title": "Source packet",
  "profileCms.builder.agent.source.description":
    "Export draft context for local tools and review the packet boundaries.",
  "profileCms.builder.agent.packet.facts": "Facts",
  "profileCms.builder.agent.packet.authorCopy": "Author copy",
  "profileCms.builder.agent.packet.derivedMetadata": "Derived metadata",
  "profileCms.builder.agent.packet.validation": "Validation diagnostics",
  "profileCms.builder.agent.packet.safety": "Source rules",
  "profileCms.builder.agent.packet.label.profile": "Profile",
  "profileCms.builder.agent.packet.label.package": "Package",
  "profileCms.builder.agent.packet.label.draft": "Draft",
  "profileCms.builder.agent.packet.label.route": "Route",
  "profileCms.builder.agent.packet.label.site": "Site",
  "profileCms.builder.agent.packet.label.page": "Page",
  "profileCms.builder.agent.packet.label.navigation": "Navigation",
  "profileCms.builder.agent.packet.label.blocks": "Blocks",
  "profileCms.builder.agent.packet.label.canonical": "Canonical",
  "profileCms.builder.agent.packet.label.packageHash": "Package hash",
  "profileCms.builder.agent.packet.label.payloadHash": "Payload hash",
  "profileCms.builder.agent.packet.label.assets": "Assets",
  "profileCms.builder.agent.packet.label.status": "Status",
  "profileCms.builder.agent.packet.label.issues": "Issues",
  "profileCms.builder.agent.packet.label.baseVersion": "Base version",
  "profileCms.builder.agent.packet.label.writable": "Writable",
  "profileCms.builder.agent.packet.value.yes": "Yes",
  "profileCms.builder.agent.packet.value.no": "No",
  "profileCms.builder.agent.patch.title": "Patch review",
  "profileCms.builder.agent.patch.description":
    "Paste or upload an agent patch, review the diff, then apply it to this draft.",
  "profileCms.builder.agent.patch.upload": "Upload patch",
  "profileCms.builder.agent.patch.fileTooLarge":
    "Patch file is too large. Paste a smaller JSON patch.",
  "profileCms.builder.agent.patch.review": "Review patch",
  "profileCms.builder.agent.patch.apply": "Apply to draft",
  "profileCms.builder.agent.patch.label": "Agent patch JSON",
  "profileCms.builder.agent.patch.accepted":
    "Patch validates against the current draft.",
  "profileCms.builder.agent.patch.rejected":
    "Patch was rejected before it could change the draft.",
  "profileCms.builder.agent.patch.applied": "Patch applied to this draft.",
  "profileCms.builder.agent.patch.diff": "Proposed diff",
  "profileCms.builder.agent.error.codeLabel": "Code: {code}",
  "profileCms.builder.agent.error.jsonInvalid":
    "Patch JSON could not be parsed.",
  "profileCms.builder.agent.error.schemaInvalid":
    "Patch JSON does not match the agent patch schema.",
  "profileCms.builder.agent.error.targetDraftMismatch":
    "Patch target draft id does not match the current draft.",
  "profileCms.builder.agent.error.baseVersionMismatch":
    "Patch target base version is stale for the current draft.",
  "profileCms.builder.agent.error.baseHashMissing":
    "Patch target package hash is required.",
  "profileCms.builder.agent.error.baseHashMismatch":
    "Patch target package hash does not match the current draft.",
  "profileCms.builder.agent.error.operationUnsupported":
    "Builder review does not support {op}.",
  "profileCms.builder.agent.error.pageMissing":
    "Builder draft does not contain an editable homepage.",
  "profileCms.builder.agent.error.valueInvalid":
    "Patch value is not valid for this operation.",
  "profileCms.builder.agent.error.pathUnsupported":
    "Builder review cannot apply path {path}.",
  "profileCms.builder.agent.error.metadataFieldUnsupported":
    "Metadata field {field} is not editable by agent patches.",
  "profileCms.builder.agent.error.blockFieldUnsupported":
    "Block field {field} is not editable by agent patches.",
  "profileCms.builder.agent.error.blockDuplicateId":
    "Block id {id} already exists in this draft.",
  "profileCms.builder.agent.error.blockStructuralMix":
    "Structural block operations cannot be combined with other block mutations in one patch.",
  "profileCms.builder.agent.error.navigationMissing":
    "Builder draft does not contain an editable navigation item.",
  "profileCms.builder.agent.error.validationRejected":
    "Local package validation rejected this change ({code}).",
  "profileCms.builder.validation.title": "Validation",
  "profileCms.builder.validation.valid": "Package candidate is valid.",
  "profileCms.builder.validation.invalid": "Package candidate needs changes.",
  "profileCms.builder.validation.noIssues": "No validation issues.",
  "profileCms.builder.validation.focusField": "Focus field",
  "profileCms.builder.validation.severity.error": "Error",
  "profileCms.builder.validation.severity.warning": "Warning",
  "profileCms.builder.validation.issueDetail":
    "Review this field before saving or publishing.",
  "profileCms.builder.publishState.title": "Draft and publish state",
  "profileCms.builder.publishState.draftId": "Draft id",
  "profileCms.builder.publishState.noDraft": "No saved draft",
  "profileCms.builder.publishState.packageHash": "Package hash",
  "profileCms.builder.publishState.payloadHash": "Payload hash",
  "profileCms.builder.publishState.pending":
    "Save and publish require the backend builder endpoints. This UI will not fake a production publish.",
  "profileCms.builder.api.disabled":
    "Builder API writes are not enabled in this frontend environment.",
  "profileCms.builder.api.failed": "Builder API action failed.",
  "profileCms.builder.api.missingDraftId":
    "Save a draft before requesting publish.",
  "profileCms.builder.api.missingProfileId":
    "This route could not resolve a profile id for the builder API.",
  "profileCms.builder.api.profileNotAuthorized":
    "Connect as this profile before using backend builder actions.",
  "profileCms.builder.api.publishRequiresSignedStorage":
    "Publishing needs the signed decentralized storage flow and is not enabled in this MVP.",
  "profileCms.builder.api.serverValidationCompleted":
    "Server validation completed.",
  "profileCms.builder.api.draftSaved": "Draft saved.",
  ...USER_COLLECTED_STATS_MESSAGES,
  ...USER_COLLECTED_STATS_DETAILS_MESSAGES,
  ...USER_COLLECTED_STATS_BOOST_MESSAGES,
  ...USER_COLLECTED_STATS_ACTIVITY_MESSAGES,
  ...USER_COLLECTED_STATS_ACTIVITY_TABS_MESSAGES,
  ...USER_STATS_ROW_MESSAGES,
  ...USER_COLLECTED_STATS_WALLET_ACTIVITY_MESSAGES,
  ...USER_COLLECTED_STATS_DISTRIBUTIONS_MESSAGES,
  ...USER_COLLECTED_STATS_TDH_HISTORY_MESSAGES,
  "user.collected.networkCards.listLabel": "Collected network cards",
  "user.collected.networkCards.empty": "No network tokens found",
  "user.collected.networkCards.defaultCollection": "Network",
  "user.collected.networkCards.defaultTokenName": "Token #{tokenId}",
  "user.collected.networkCards.imageAlt": "Network token image for {name}",
  "user.collected.networkCards.tokenLabel": "#{tokenId}",
  "user.collected.networkCards.xtdh": "xTDH",
  "user.collected.networkCards.xtdhPerDay": "xTDH/day",
  "profile.mute.action.mute": "Mute notifications",
  "profile.mute.action.unmute": "Unmute notifications",
  "profile.mute.action.muteAriaLabel": "Mute notifications from this profile",
  "profile.mute.action.unmuteAriaLabel":
    "Unmute notifications from this profile",
  "profile.mute.error.mute": "Couldn't mute this profile.",
  "profile.mute.error.unmute": "Couldn't unmute this profile.",
  "profile.mute.error.description": PLEASE_TRY_AGAIN,
  "profile.mute.status.muted": "Notifications from this profile are muted.",
  "profile.mute.status.unmuted":
    "Notifications from this profile are not muted.",
  "drop.media.alt": "Drop media",
  "drop.media.processing": "Processing image",
  "drop.media.processingGeneric": "Processing media",
  "drop.media.loading": "Loading image",
  "drop.media.unavailable": "Image unavailable",
  "drop.media.unavailableGeneric": "Media unavailable",
  "drop.media.loadFailed": "Couldn’t load image.",
  "drop.media.retry": "Retry",
  "drop.media.openPreview": "Open image preview",
  "drop.media.openMedia": "Open drop media",
  "drop.media.saveDialogTitle": "Save image",
  "drop.media.processingFailed": "Image processing failed.",
  "drop.media.processingTimedOut": "Image processing timed out.",
  "walletAddress.copy.optionsAriaLabel": "Copy wallet options",
  "walletAddress.copy.ensAriaLabel": "Copy ENS name",
  "walletAddress.copy.walletAriaLabel": "Copy wallet address",
  "walletAddress.copy.tooltip": "Copy",
  "walletAddress.copy.copiedTooltip": "Copied",
  ...QR_SCANNER_MESSAGES,
  "drops.additionalActionBadge.label": "Additional Action",
  "drops.additionalActionBadge.tooltip":
    "The creator marked this submission as promising an extra action beyond the artwork, such as an event, donation, physical item, airdrop, or future deliverable.",
  ...USER_PROFILE_TABS_MESSAGES,
  ...USER_PROFILE_HEADER_MESSAGES,
  ...FOLLOWERS_MESSAGES,
  ...WAVES_SIDEBAR_MESSAGES,
  ...QUICK_DM_MESSAGES,
  ...NOTIFICATIONS_FOLLOW_BUTTON_MESSAGES,
  ...NOTIFICATIONS_WAVE_CREATED_MESSAGES,
  ...NOTIFICATIONS_WAVE_FOLLOW_BUTTON_MESSAGES,
  ...WAVE_CHAT_MESSAGES,
  ...WAVE_LOADING_MESSAGES,
  ...WAVE_DROPS_SEARCH_MODAL_MESSAGES,
  ...WAVE_GIF_PICKER_MESSAGES,
  ...WAVE_HEADER_MESSAGES,
  ...WAVE_NOTIFICATION_SETTINGS_MESSAGES,
  ...WAVE_CREATE_GROUPS_MESSAGES,
  ...GROUP_NFT_OWNERSHIP_MESSAGES,
  ...WAVE_EXPLORE_CARD_MESSAGES,
  ...WAVE_SCORE_SUMMARY_MESSAGES,
  ...WAVE_SCORE_DETAILS_MESSAGES,
  ...WAVE_REP_ACTION_MESSAGES,
  ...WAVE_REP_MODAL_MESSAGES,
  ...WAVE_REP_DETAILS_MESSAGES,
  ...PROFILE_ACTIVITY_RATE_MESSAGES,
  ...USER_RATE_MESSAGES,
  ...aboutMessages,
  ...toolsMessages,
  ...ABOUT_TECH_MESSAGES,
  ...REMEMES_DETAIL_MESSAGES,
  ...REP_CATEGORY_MESSAGES,
  ...MEDIA_VIDEO_MESSAGES,
  ...ATTACHMENT_MESSAGES,
  ...LINK_PREVIEW_MESSAGES,
  ...COMMON_MESSAGES,
  ...NEW_VERSION_TOAST_MESSAGES,
  ...NAVIGATION_MESSAGES,
  ...WAVE_SCORE_NAVIGATION_MESSAGES,
  ...MEMES_QUICK_VOTE_MESSAGES,
  ...MEMES_WAVE_FOOTER_MESSAGES,
  ...DROP_REACTION_MESSAGES,
  ...WAVES_MOBILE_MESSAGES,
  ...WAVE_DROP_ACTIONS_MESSAGES,
  ...WAVE_POLL_MESSAGES,
  ...WAVE_SUBMISSION_BUTTON_LABEL_MESSAGES,
} as const;

export type MessageKey = keyof typeof EN_US_MESSAGES;
