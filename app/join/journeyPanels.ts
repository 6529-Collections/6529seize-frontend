import type { SupportedLocale } from "@/i18n/locales";

import { WAVES_HREF } from "./page.content";
import type { CurrentPanelContent } from "./page.types";
import { m } from "./page.utils";

export const profilePanel = (
  locale: SupportedLocale,
  profileHref: string
): CurrentPanelContent => ({
  title: m(locale, "join6529.current.profile.title"),
  body: m(locale, "join6529.current.profile.body"),
  action: {
    kind: "link",
    label: m(locale, "join6529.action.createProfile"),
    href: profileHref,
  },
});

export const wavesPanel = (
  locale: SupportedLocale,
  onNavigate: () => void,
  needsWave: boolean
): CurrentPanelContent => ({
  title: m(
    locale,
    needsWave
      ? "join6529.current.waves.title"
      : "join6529.current.message.title"
  ),
  body: m(
    locale,
    needsWave ? "join6529.current.waves.body" : "join6529.current.message.body"
  ),
  action: {
    kind: "link",
    label: m(locale, "join6529.action.openWaves"),
    href: WAVES_HREF,
    onNavigate,
  },
});

export const profileImagePanel = (
  locale: SupportedLocale,
  profileHref: string
): CurrentPanelContent => ({
  title: m(locale, "join6529.current.pfp.title"),
  body: m(locale, "join6529.current.pfp.body"),
  action: {
    kind: "link",
    label: m(locale, "join6529.action.openProfile"),
    href: profileHref,
  },
});

export const completePanel = (
  locale: SupportedLocale
): CurrentPanelContent => ({
  title: m(locale, "join6529.current.complete.title"),
  body: m(locale, "join6529.current.complete.body"),
  action: {
    kind: "link",
    label: m(locale, "join6529.action.exploreWaves"),
    href: WAVES_HREF,
  },
});
