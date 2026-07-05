import type { MessageKey } from "@/i18n/messages";

export type Join6529MessageKey = Extract<MessageKey, `join6529.${string}`>;
export type TimelineStepId =
  | "wallet"
  | "profile"
  | "waves"
  | "message"
  | "collect"
  | "subscribe";
export type FocusFeatureId = "subscriptions" | "waves" | "nfts";
export type JoinHref = string | ((links: JoinLinks) => string);

export interface JoinLinks {
  readonly profileHref: string;
  readonly subscriptionsHref: string;
}

export interface TimelineItemSpec {
  readonly id: TimelineStepId;
  readonly titleKey: Join6529MessageKey;
  readonly bodyKey: Join6529MessageKey;
  readonly actionLabelKey?: Join6529MessageKey;
  readonly href?: JoinHref;
}

export interface FocusFeatureSpec {
  readonly id: FocusFeatureId;
  readonly eyebrowKey: Join6529MessageKey;
  readonly titleKey: Join6529MessageKey;
  readonly bodyKey: Join6529MessageKey;
  readonly actionLabelKey: Join6529MessageKey;
  readonly href: JoinHref;
}

interface FaqItemSpec {
  readonly id: string;
  readonly questionKey: Join6529MessageKey;
  readonly answerKey: Join6529MessageKey;
}

export interface MemeCard {
  readonly image: string;
  readonly label: string;
  readonly number?: number;
  readonly rotateClass: string;
  readonly imageClass?: string;
}

export const WAVES_HREF = "/waves";
export const WAVES_ENTRY_STORAGE_PREFIX = "join-6529:entered-waves:";

const COLLECTIONS_HREF = "/the-memes";
const MEME_CARD_IMAGE_BASE =
  "https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1";

const memeCardImage = (number: number, extension: "GIF" | "PNG" | "WEBP") =>
  `${MEME_CARD_IMAGE_BASE}/${number}.${extension}`;

export const TIMELINE_ORDER: readonly TimelineStepId[] = [
  "wallet",
  "profile",
  "waves",
  "message",
  "collect",
  "subscribe",
];

export const TIMELINE_ITEM_SPECS: readonly TimelineItemSpec[] = [
  {
    id: "wallet",
    titleKey: "join6529.joining.wallet.title",
    bodyKey: "join6529.joining.wallet.body",
  },
  {
    id: "profile",
    titleKey: "join6529.joining.profile.title",
    bodyKey: "join6529.joining.profile.body",
    actionLabelKey: "join6529.action.createProfile",
    href: ({ profileHref }) => profileHref,
  },
  {
    id: "waves",
    titleKey: "join6529.joining.waves.title",
    bodyKey: "join6529.joining.waves.body",
    actionLabelKey: "join6529.joining.waves.action",
    href: WAVES_HREF,
  },
  {
    id: "message",
    titleKey: "join6529.joining.participate.title",
    bodyKey: "join6529.joining.participate.body",
  },
  {
    id: "collect",
    titleKey: "join6529.joining.collect.title",
    bodyKey: "join6529.joining.collect.body",
    actionLabelKey: "join6529.focus.nfts.action",
    href: COLLECTIONS_HREF,
  },
  {
    id: "subscribe",
    titleKey: "join6529.joining.subscribe.title",
    bodyKey: "join6529.joining.subscribe.body",
    actionLabelKey: "join6529.focus.subscriptions.action",
    href: ({ subscriptionsHref }) => subscriptionsHref,
  },
];

export const FOCUS_FEATURE_SPECS: readonly FocusFeatureSpec[] = [
  {
    id: "subscriptions",
    eyebrowKey: "join6529.focus.subscriptions.eyebrow",
    titleKey: "join6529.focus.subscriptions.title",
    bodyKey: "join6529.focus.subscriptions.body",
    actionLabelKey: "join6529.focus.subscriptions.action",
    href: ({ subscriptionsHref }) => subscriptionsHref,
  },
  {
    id: "waves",
    eyebrowKey: "join6529.focus.waves.eyebrow",
    titleKey: "join6529.focus.waves.title",
    bodyKey: "join6529.focus.waves.body",
    actionLabelKey: "join6529.focus.waves.action",
    href: WAVES_HREF,
  },
  {
    id: "nfts",
    eyebrowKey: "join6529.focus.nfts.eyebrow",
    titleKey: "join6529.focus.nfts.title",
    bodyKey: "join6529.focus.nfts.body",
    actionLabelKey: "join6529.focus.nfts.action",
    href: COLLECTIONS_HREF,
  },
];

export const FAQ_ITEM_SPECS: readonly FaqItemSpec[] = [
  {
    id: "wallet-eth",
    questionKey: "join6529.faq.walletEth.question",
    answerKey: "join6529.faq.walletEth.answer",
  },
  {
    id: "tdh",
    questionKey: "join6529.faq.tdh.question",
    answerKey: "join6529.faq.tdh.answer",
  },
  {
    id: "meme-cost",
    questionKey: "join6529.faq.memeCost.question",
    answerKey: "join6529.faq.memeCost.answer",
  },
  {
    id: "subscriptions",
    questionKey: "join6529.faq.subscriptions.question",
    answerKey: "join6529.faq.subscriptions.answer",
  },
  {
    id: "art-use",
    questionKey: "join6529.faq.artUse.question",
    answerKey: "join6529.faq.artUse.answer",
  },
];

export const MEME_CARDS: readonly MemeCard[] = [
  {
    image: memeCardImage(516, "GIF"),
    label: "PEBBLES",
    number: 516,
    rotateClass: "tw-rotate-[-8deg]",
    imageClass: "tw-brightness-[1.35] tw-contrast-[1.1]",
  },
  {
    image: memeCardImage(515, "GIF"),
    label: "Cerebrum",
    number: 515,
    rotateClass: "tw-rotate-[-3deg]",
  },
  {
    image: memeCardImage(514, "WEBP"),
    label: "Freedom Craig",
    number: 514,
    rotateClass: "tw-rotate-[1deg]",
  },
  {
    image: memeCardImage(513, "GIF"),
    label: "SEIZE 24/7",
    number: 513,
    rotateClass: "tw-rotate-[5deg]",
  },
  {
    image: memeCardImage(512, "WEBP"),
    label: "6529 SVNDIAL",
    number: 512,
    rotateClass: "tw-rotate-[9deg]",
    imageClass: "tw-brightness-[1.2]",
  },
];

export const HERO_MEME_CARDS = {
  topLeft: {
    image: memeCardImage(515, "GIF"),
    label: "Cerebrum",
    number: 515,
    rotateClass: "tw-rotate-[-8deg]",
  },
  left: {
    image: memeCardImage(514, "WEBP"),
    label: "Freedom Craig",
    number: 514,
    rotateClass: "tw-rotate-[-6deg]",
  },
  right: {
    image: memeCardImage(513, "GIF"),
    label: "SEIZE 24/7",
    number: 513,
    rotateClass: "tw-rotate-[5deg]",
  },
} satisfies Record<string, MemeCard>;
