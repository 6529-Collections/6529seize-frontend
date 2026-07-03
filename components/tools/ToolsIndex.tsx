"use client";

import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import GroupedLinkIndex, {
  type GroupedLinkIndexGroup,
} from "@/components/common/GroupedLinkIndex";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { useSetTitle } from "@/contexts/TitleContext";
import useCapacitor from "@/hooks/useCapacitor";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getToolsNavItemId, getVisibleToolsNavGroups } from "./tools.routes";
import {
  BookOpenIcon,
  ChartBarIcon,
  CircleStackIcon,
  CodeBracketIcon,
  CpuChipIcon,
  CubeTransparentIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  FireIcon,
  KeyIcon,
  QuestionMarkCircleIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  WalletIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType } from "react";

type ToolIcon = ComponentType<{ className?: string | undefined }>;

const TOOL_INDEX_ICONS: Record<string, ToolIcon> = {
  "delegation-center": ShieldCheckIcon,
  "wallet-architecture": BookOpenIcon,
  "delegation-faq": QuestionMarkCircleIcon,
  "consolidation-use-cases": KeyIcon,
  "wallet-checker": WalletIcon,
  "subscriptions-report": DocumentChartBarIcon,
  "meme-accounting": ChartBarIcon,
  "meme-gas": FireIcon,
  "app-wallets": WalletIcon,
  api: CodeBracketIcon,
  emma: CubeTransparentIcon,
  "block-finder": WrenchScrewdriverIcon,
  "open-data-hub": CircleStackIcon,
  "network-metrics": ServerStackIcon,
  "meme-subscriptions": DocumentTextIcon,
  "6529bot-usage": CpuChipIcon,
  rememes: CubeTransparentIcon,
  team: ShieldCheckIcon,
  royalties: ChartBarIcon,
};

export default function ToolsIndex() {
  const locale = DEFAULT_LOCALE;
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const { appWalletsSupported } = useAppWallets();
  const hideSubscriptions = shouldHideSubscriptions({
    capacitorIsIos: capacitor.isIos,
    country,
  });
  const groups = getVisibleToolsNavGroups({
    appWalletsSupported,
    hideSubscriptions,
  });
  const indexGroups: GroupedLinkIndexGroup[] = groups.map((group) => ({
    id: group.id,
    title: t(locale, group.labelKey),
    items: group.items.map((item) => ({
      id: getToolsNavItemId(item),
      label: t(locale, item.labelKey),
      href: item.href,
      Icon: TOOL_INDEX_ICONS[getToolsNavItemId(item)] ?? WrenchScrewdriverIcon,
    })),
  }));

  useSetTitle(t(locale, "tools.index.metadata.title"));

  return (
    <GroupedLinkIndex
      eyebrow={t(locale, "tools.index.eyebrow")}
      title={t(locale, "tools.index.title")}
      lead={t(locale, "tools.index.lead")}
      groups={indexGroups}
      headingIdPrefix="tools-index"
      getCardAriaLabel={(page) =>
        t(locale, "tools.index.cardAriaLabel", { page })
      }
      showArrows
    />
  );
}
