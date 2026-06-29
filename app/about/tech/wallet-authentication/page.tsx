import Link from "next/link";
import type { Metadata } from "next";
import { Col, Container, Row } from "react-bootstrap";

import { AboutContentsDropdown } from "@/components/about/About";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "@/styles/Home.module.scss";
import { AboutSection } from "@/types/enums";

const WALLET_AUTH_LOCALE = DEFAULT_LOCALE;
const WALLET_AUTH_TITLE = t(
  WALLET_AUTH_LOCALE,
  "about.tech.walletAuth.metadata.title"
);
const WALLET_AUTH_DESCRIPTION = t(
  WALLET_AUTH_LOCALE,
  "about.tech.walletAuth.metadata.description"
);

export const metadata: Metadata = getAppMetadata({
  title: WALLET_AUTH_TITLE,
  description: WALLET_AUTH_DESCRIPTION,
});

export default function WalletAuthenticationPage() {
  return (
    <main className={styles["main"]}>
      <Container fluid className="pt-4">
        <Row>
          <Col>
            <Container className="pt-2">
              <Row>
                <Col>
                  <AboutContentsDropdown currentSection={AboutSection.TECH} />
                  <article className="tw-w-full tw-text-iron-200">
                    <Link
                      href="/about/tech"
                      className="hover:tw-text-primary-200 tw-mb-5 tw-inline-flex tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline"
                    >
                      {t(
                        WALLET_AUTH_LOCALE,
                        "about.tech.walletAuth.backToTech"
                      )}
                    </Link>

                    <header className="tw-max-w-4xl tw-pb-4">
                      <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                        {t(WALLET_AUTH_LOCALE, "about.tech.walletAuth.eyebrow")}
                      </p>
                      <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
                        {t(WALLET_AUTH_LOCALE, "about.tech.walletAuth.title")}
                      </h1>
                      <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-300">
                        {t(WALLET_AUTH_LOCALE, "about.tech.walletAuth.lead")}
                      </p>
                    </header>

                    <div className="tw-flex tw-max-w-4xl tw-flex-col tw-gap-8 tw-text-base tw-leading-7 tw-text-iron-300">
                      <section aria-labelledby="what-is-changing-heading">
                        <h2
                          id="what-is-changing-heading"
                          className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
                        >
                          {t(
                            WALLET_AUTH_LOCALE,
                            "about.tech.walletAuth.whatIsChanging.title"
                          )}
                        </h2>
                        <p className="tw-mb-3">
                          {t(
                            WALLET_AUTH_LOCALE,
                            "about.tech.walletAuth.whatIsChanging.identity"
                          )}
                        </p>
                        <p className="tw-mb-0">
                          {t(
                            WALLET_AUTH_LOCALE,
                            "about.tech.walletAuth.whatIsChanging.session"
                          )}
                        </p>
                      </section>

                      <section aria-labelledby="what-to-do-heading">
                        <h2
                          id="what-to-do-heading"
                          className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
                        >
                          {t(
                            WALLET_AUTH_LOCALE,
                            "about.tech.walletAuth.whatToDo.title"
                          )}
                        </h2>
                        <ul className="tw-mb-0 tw-grid tw-gap-3 tw-pl-5">
                          <li>
                            {t(
                              WALLET_AUTH_LOCALE,
                              "about.tech.walletAuth.whatToDo.upgrade",
                              {
                                prompt: t(
                                  WALLET_AUTH_LOCALE,
                                  "about.tech.walletAuth.whatToDo.prompt"
                                ),
                              }
                            )}
                          </li>
                          <li>
                            {t(
                              WALLET_AUTH_LOCALE,
                              "about.tech.walletAuth.whatToDo.noGas"
                            )}
                          </li>
                          <li>
                            {t(
                              WALLET_AUTH_LOCALE,
                              "about.tech.walletAuth.whatToDo.reminder",
                              {
                                action: t(
                                  WALLET_AUTH_LOCALE,
                                  "about.tech.walletAuth.whatToDo.reminderAction"
                                ),
                              }
                            )}
                          </li>
                        </ul>
                      </section>

                      <section aria-labelledby="why-now-heading">
                        <h2
                          id="why-now-heading"
                          className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
                        >
                          {t(
                            WALLET_AUTH_LOCALE,
                            "about.tech.walletAuth.whyNow.title"
                          )}
                        </h2>
                        <p className="tw-mb-3">
                          {t(
                            WALLET_AUTH_LOCALE,
                            "about.tech.walletAuth.whyNow.deadline"
                          )}
                        </p>
                        <p className="tw-mb-0">
                          {t(
                            WALLET_AUTH_LOCALE,
                            "about.tech.walletAuth.whyNow.features"
                          )}
                        </p>
                      </section>

                      <section aria-labelledby="safe-heading">
                        <h2
                          id="safe-heading"
                          className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
                        >
                          {t(
                            WALLET_AUTH_LOCALE,
                            "about.tech.walletAuth.same.title"
                          )}
                        </h2>
                        <ul className="tw-mb-0 tw-grid tw-gap-3 tw-pl-5">
                          <li>
                            {t(
                              WALLET_AUTH_LOCALE,
                              "about.tech.walletAuth.same.profile"
                            )}
                          </li>
                          <li>
                            {t(
                              WALLET_AUTH_LOCALE,
                              "about.tech.walletAuth.same.assets"
                            )}
                          </li>
                          <li>
                            {t(
                              WALLET_AUTH_LOCALE,
                              "about.tech.walletAuth.same.desktop"
                            )}
                          </li>
                        </ul>
                      </section>
                    </div>
                  </article>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
