import type { Join6529MessageKey } from "./page.content";
import type { JoinPageState } from "./page.types";

interface HeroContentSpec {
  readonly eyebrowKey: Join6529MessageKey;
  readonly titleKey: Join6529MessageKey;
  readonly subtitleKey?: Join6529MessageKey;
}

interface HeroPointSpec {
  readonly titleKey: Join6529MessageKey;
  readonly bodyKey: Join6529MessageKey;
}

export const HERO_CONTENT: Readonly<Record<JoinPageState, HeroContentSpec>> = {
  loggedOut: {
    eyebrowKey: "join6529.hero.loggedOut.eyebrow",
    titleKey: "join6529.hero.loggedOut.title",
    subtitleKey: "join6529.hero.loggedOut.subtitle",
  },
  inProgress: {
    eyebrowKey: "join6529.hero.inProgress.eyebrow",
    titleKey: "join6529.hero.inProgress.title",
    subtitleKey: "join6529.hero.inProgress.subtitle",
  },
  loggedIn: {
    eyebrowKey: "join6529.hero.loggedIn.eyebrow",
    titleKey: "join6529.hero.loggedIn.title",
    subtitleKey: "join6529.hero.loggedIn.subtitle",
  },
};

export const HERO_POINTS: readonly HeroPointSpec[] = [
  {
    titleKey: "join6529.hero.point.voice.title",
    bodyKey: "join6529.hero.point.voice.body",
  },
  {
    titleKey: "join6529.hero.point.reputation.title",
    bodyKey: "join6529.hero.point.reputation.body",
  },
  {
    titleKey: "join6529.hero.point.collect.title",
    bodyKey: "join6529.hero.point.collect.body",
  },
];
