"use client";

import { useAppWallets } from "@/components/app-wallets/AppWalletsContext";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { useSetTitle } from "@/contexts/TitleContext";
import useCapacitor from "@/hooks/useCapacitor";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "@/components/about/AboutLayout";
import {
  getToolsNavItemHref,
  getToolsNavItemId,
  getVisibleToolsNavGroups,
} from "./tools.routes";
import {
  ArrowRightIcon,
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
import Link from "next/link";
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
  "open-data": CircleStackIcon,
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

  useSetTitle(t(locale, "tools.index.metadata.title"));

  return (
    <Container className="tw-pt-2">
      <Row>
        <Col>
          <section className="tw-w-full tw-pb-10 tw-text-iron-100">
            <header className="tw-mb-8 tw-max-w-3xl">
              <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                {t(locale, "tools.index.eyebrow")}
              </p>
              <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
                {t(locale, "tools.index.title")}
              </h1>
              <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-300">
                {t(locale, "tools.index.lead")}
              </p>
            </header>

            <div className="tw-grid tw-gap-7">
              {groups.map((group) => {
                const groupTitle = t(locale, group.labelKey);
                const headingId = `tools-index-${group.id}`;

                return (
                  <section key={group.id} aria-labelledby={headingId}>
                    <h2
                      id={headingId}
                      className="tw-mb-3 tw-text-sm tw-font-semibold tw-uppercase tw-leading-5 tw-text-iron-400"
                    >
                      {groupTitle}
                    </h2>
                    <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
                      {group.items.map((item) => {
                        const label = t(locale, item.labelKey);
                        const Icon =
                          TOOL_INDEX_ICONS[getToolsNavItemId(item)] ??
                          WrenchScrewdriverIcon;

                        return (
                          <Link
                            key={getToolsNavItemId(item)}
                            href={getToolsNavItemHref(item)}
                            aria-label={t(locale, "tools.index.cardAriaLabel", {
                              page: label,
                            })}
                            className="tw-group tw-flex tw-h-full tw-min-h-20 tw-items-center tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/80 tw-p-4 !tw-no-underline tw-transition tw-duration-200 tw-ease-out hover:tw-border-primary-400/50 hover:tw-bg-iron-900 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
                          >
                            <span
                              aria-hidden="true"
                              className="tw-flex tw-size-10 tw-flex-none tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-text-iron-200 tw-transition group-hover:tw-border-primary-400/30 group-hover:tw-text-white"
                            >
                              <Icon className="tw-size-5" />
                            </span>
                            <span className="tw-min-w-0 tw-flex-1 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 group-hover:tw-text-white">
                              {label}
                            </span>
                            <ArrowRightIcon
                              aria-hidden="true"
                              className="tw-size-4 tw-flex-none tw-text-iron-500 tw-transition group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300"
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </Col>
      </Row>
    </Container>
  );
}
