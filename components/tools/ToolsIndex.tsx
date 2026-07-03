"use client";

import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "@/components/about/AboutLayout";
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

import { getVisibleToolsNavGroups } from "./tools.routes";

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
      id: item.id,
      label: t(locale, item.labelKey),
      href: item.href,
    })),
  }));

  useSetTitle(t(locale, "tools.index.metadata.title"));

  return (
    <Container className="tw-pt-2">
      <Row>
        <Col>
          <GroupedLinkIndex
            eyebrow={t(locale, "tools.index.eyebrow")}
            title={t(locale, "tools.index.title")}
            groups={indexGroups}
            headingIdPrefix="tools-index"
            getCardAriaLabel={(page) =>
              t(locale, "tools.index.cardAriaLabel", { page })
            }
            showArrows
          />
        </Col>
      </Row>
    </Container>
  );
}
