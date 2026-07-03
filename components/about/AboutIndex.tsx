"use client";

import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "./AboutLayout";

import GroupedLinkIndex, {
  type GroupedLinkIndexGroup,
} from "@/components/common/GroupedLinkIndex";
import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import { shouldHideSubscriptions } from "@/components/user/layout/userPageVisibility";
import { useSetTitle } from "@/contexts/TitleContext";
import useCapacitor from "@/hooks/useCapacitor";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

import {
  getAboutNavItemHref,
  getAboutNavItemId,
  getVisibleAboutNavGroups,
} from "./about.routes";

export default function AboutIndex() {
  const locale = DEFAULT_LOCALE;
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const hideSubscriptions = shouldHideSubscriptions({
    capacitorIsIos: capacitor.isIos,
    country,
  });
  const groups = getVisibleAboutNavGroups(hideSubscriptions);
  const indexGroups: GroupedLinkIndexGroup[] = groups.map((group) => ({
    id: group.id,
    title: t(locale, group.labelKey),
    items: group.items.map((item) => {
      const label = t(locale, item.labelKey);

      return {
        id: getAboutNavItemId(item),
        label,
        href: getAboutNavItemHref(item),
      };
    }),
  }));

  useSetTitle(t(locale, "about.index.metadata.title"));

  return (
    <Container className="tw-pt-2">
      <Row>
        <Col>
          <GroupedLinkIndex
            eyebrow={t(locale, "about.index.eyebrow")}
            title={t(locale, "about.index.title")}
            lead={t(locale, "about.index.lead")}
            groups={indexGroups}
            headingIdPrefix="about-index"
            getCardAriaLabel={(page) =>
              t(locale, "about.index.cardAriaLabel", { page })
            }
          />
        </Col>
      </Row>
    </Container>
  );
}
