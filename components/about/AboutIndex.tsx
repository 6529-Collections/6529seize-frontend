"use client";

import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

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

  useSetTitle(t(locale, "about.index.metadata.title"));

  return (
    <Container className="pt-2">
      <Row>
        <Col>
          <section className="tw-w-full tw-pb-10 tw-text-iron-100">
            <header className="tw-mb-8 tw-max-w-3xl">
              <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                {t(locale, "about.index.eyebrow")}
              </p>
              <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
                {t(locale, "about.index.title")}
              </h1>
              <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-300">
                {t(locale, "about.index.lead")}
              </p>
            </header>

            <div className="tw-grid tw-gap-7">
              {groups.map((group) => {
                const groupTitle = t(locale, group.labelKey);
                const headingId = `about-index-${group.id}`;

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

                        return (
                          <Link
                            key={getAboutNavItemId(item)}
                            href={getAboutNavItemHref(item)}
                            aria-label={t(locale, "about.index.cardAriaLabel", {
                              page: label,
                            })}
                            className="tw-group tw-flex tw-h-full tw-min-h-24 tw-flex-col tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/80 tw-p-4 !tw-no-underline tw-transition tw-duration-200 tw-ease-out hover:tw-border-primary-400/50 hover:tw-bg-iron-900 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
                          >
                            <span className="tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50 group-hover:tw-text-white">
                              {label}
                            </span>
                            <span className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400 group-hover:tw-text-iron-200">
                              {t(locale, item.descriptionKey)}
                            </span>
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
