import type { MessageKey } from "@/i18n/messages";

export type Join6529MessageKey = Extract<MessageKey, `join6529.${string}`>;
export type TimelineStepId =
  | "wallet"
  | "profile"
  | "waves"
  | "message"
  | "collect";
export type FocusFeatureId = "subscriptions" | "waves" | "nfts";
export type ThingsToDoId = "delegation" | "help";
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

export interface FaqItemSpec {
  readonly id: string;
  readonly questionKey: Join6529MessageKey;
  readonly answerKey: Join6529MessageKey;
  readonly learnMoreHref?: JoinHref;
}

export interface ThingsToDoSpec {
  readonly id: ThingsToDoId;
  readonly titleKey: Join6529MessageKey;
  readonly bodyKey: Join6529MessageKey;
  readonly href: JoinHref;
  readonly actionLabelKey: Join6529MessageKey;
}

export interface MemeCard {
  readonly alt: string;
  readonly image: string;
  readonly label: string;
  readonly number?: number;
  readonly rotateClass: string;
  readonly imageClass?: string;
}

interface MemeCardSource {
  readonly id: number;
  readonly name: string;
  readonly ext: "GIF" | "PNG" | "WEBP";
  readonly rotateClass: string;
  readonly imageClass?: string;
}

export const WAVES_HREF = "/waves";

const ABOUT_SUBSCRIPTIONS_HREF = "/about/subscriptions";
export const COLLECTIONS_HREF = "/the-memes";
const DELEGATION_HREF = "/delegation/delegation-center";
const JOIN_STEP_ID_PREFIX = "join-step";
const LICENSE_HREF = "/about/license";
const MEME_MINT_HREF = "/the-memes/mint";
const OPEN_DATA_MEME_SUBSCRIPTIONS_HREF = "/open-data/meme-subscriptions";
const TDH_HREF = "/network/tdh";
const MEMES_CONTRACT = "0x33FD426905F149f8376e227d0C9D3340AaD17aF1";

const cardImage = (card: Pick<MemeCardSource, "id" | "ext">) =>
  `https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/${MEMES_CONTRACT}/${card.id}.${card.ext}`;

const toMemeCard = (card: MemeCardSource): MemeCard => ({
  alt: `${card.name} Meme Card #${card.id}`,
  image: cardImage(card),
  label: card.name,
  number: card.id,
  rotateClass: card.rotateClass,
  ...(card.imageClass ? { imageClass: card.imageClass } : {}),
});

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
    actionLabelKey: "join6529.action.viewCollections",
    href: COLLECTIONS_HREF,
  },
];

export const THINGS_TO_DO_SPECS: readonly ThingsToDoSpec[] = [
  {
    id: "delegation",
    titleKey: "join6529.todo.delegation.title",
    bodyKey: "join6529.todo.delegation.body",
    href: DELEGATION_HREF,
    actionLabelKey: "join6529.action.learnMore",
  },
  {
    id: "help",
    titleKey: "join6529.todo.help.title",
    bodyKey: "join6529.todo.help.body",
    href: WAVES_HREF,
    actionLabelKey: "join6529.action.openWave",
  },
];

export const OPTIONAL_TIMELINE_START_ID: TimelineStepId = "message";
export const TIMELINE_ORDER: readonly TimelineStepId[] =
  TIMELINE_ITEM_SPECS.map((item) => item.id);

export const getTimelineStepDomId = (stepId: TimelineStepId): string =>
  `${JOIN_STEP_ID_PREFIX}-${stepId}`;

export const FOCUS_FEATURE_SPECS: readonly FocusFeatureSpec[] = [
  {
    id: "subscriptions",
    eyebrowKey: "join6529.focus.subscriptions.eyebrow",
    titleKey: "join6529.focus.subscriptions.title",
    bodyKey: "join6529.focus.subscriptions.body",
    actionLabelKey: "join6529.focus.subscriptions.action",
    href: OPEN_DATA_MEME_SUBSCRIPTIONS_HREF,
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
    href: WAVES_HREF,
  },
];

export const FAQ_ITEM_SPECS: readonly FaqItemSpec[] = [
  {
    id: "wallet-eth",
    questionKey: "join6529.faq.walletEth.question",
    answerKey: "join6529.faq.walletEth.answer",
    learnMoreHref: "/about/faq",
  },
  {
    id: "tdh",
    questionKey: "join6529.faq.tdh.question",
    answerKey: "join6529.faq.tdh.answer",
    learnMoreHref: TDH_HREF,
  },
  {
    id: "meme-cost",
    questionKey: "join6529.faq.memeCost.question",
    answerKey: "join6529.faq.memeCost.answer",
    learnMoreHref: MEME_MINT_HREF,
  },
  {
    id: "subscriptions",
    questionKey: "join6529.faq.subscriptions.question",
    answerKey: "join6529.faq.subscriptions.answer",
    learnMoreHref: ABOUT_SUBSCRIPTIONS_HREF,
  },
  {
    id: "art-use",
    questionKey: "join6529.faq.artUse.question",
    answerKey: "join6529.faq.artUse.answer",
    learnMoreHref: LICENSE_HREF,
  },
];

export const SUBMIT_MEME_CARDS: readonly MemeCard[] = (
  [
    {
      id: 516,
      name: "PEBBLES at Domínio PúbliCC0",
      ext: "GIF",
      rotateClass: "tw-rotate-[-8deg]",
      imageClass: "tw-brightness-[1.35] tw-contrast-[1.1]",
    },
    {
      id: 515,
      name: "Cerebrum",
      ext: "GIF",
      rotateClass: "tw-rotate-[-3deg]",
    },
    {
      id: 514,
      name: "Freedom Craig",
      ext: "WEBP",
      rotateClass: "tw-rotate-[1deg]",
    },
    {
      id: 513,
      name: "SEIZE 24/7",
      ext: "GIF",
      rotateClass: "tw-rotate-[5deg]",
    },
    {
      id: 512,
      name: "6529 SVNDIAL",
      ext: "WEBP",
      rotateClass: "tw-rotate-[9deg]",
      imageClass: "tw-brightness-[1.2]",
    },
  ] satisfies readonly MemeCardSource[]
).map(toMemeCard);

export const HERO_MEME_CARDS = {
  topLeft: toMemeCard({
    id: 17,
    name: "Awakening OM",
    ext: "WEBP",
    rotateClass: "tw-rotate-[-8deg]",
  }),
  left: toMemeCard({
    id: 9,
    name: "The Institutions Are Coming",
    ext: "WEBP",
    rotateClass: "tw-rotate-[-6deg]",
  }),
  right: toMemeCard({
    id: 11,
    name: "CyberMetaverse",
    ext: "GIF",
    rotateClass: "tw-rotate-[5deg]",
  }),
} satisfies Record<string, MemeCard>;
