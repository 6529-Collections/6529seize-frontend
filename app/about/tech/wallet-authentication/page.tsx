import Link from "next/link";
import type { Metadata } from "next";
import { Col, Container, Row } from "react-bootstrap";

import { AboutMenu } from "@/components/about/About";
import { getAppMetadata } from "@/components/providers/metadata";
import styles from "@/styles/Home.module.scss";
import { AboutSection } from "@/types/enums";

const WALLET_AUTH_TITLE = "Wallet Authentication Update";
const WALLET_AUTH_DESCRIPTION =
  "A simple explanation of the new 6529 wallet authentication session.";

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
                  <div className="tw-flex tw-flex-col md:tw-flex-row">
                    <div className="tw-hidden tw-w-1/5 md:tw-block">
                      <AboutMenu currentSection={AboutSection.TECH} />
                    </div>
                    <article className="tw-w-full tw-text-iron-200 md:tw-w-4/5">
                      <Link
                        href="/about/tech"
                        className="hover:tw-text-primary-200 tw-mb-5 tw-inline-flex tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline"
                      >
                        Back to Tech
                      </Link>

                      <header className="tw-max-w-4xl tw-pb-4">
                        <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                          Wallet Authentication
                        </p>
                        <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
                          Wallet Authentication Update
                        </h1>
                        <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-300">
                          6529 is moving wallet sign-in to a newer secure
                          session. Most people only need to sign once when they
                          are prompted.
                        </p>
                      </header>

                      <div className="tw-flex tw-max-w-4xl tw-flex-col tw-gap-8 tw-text-base tw-leading-7 tw-text-iron-300">
                        <section aria-labelledby="what-is-changing-heading">
                          <h2
                            id="what-is-changing-heading"
                            className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
                          >
                            What is changing
                          </h2>
                          <p className="tw-mb-3">
                            Your wallet is still your identity. The update
                            changes the browser session that 6529 creates after
                            you sign in.
                          </p>
                          <p className="tw-mb-0">
                            The new session is easier to refresh, easier to
                            revoke, and better for sharing a connection with
                            your own devices.
                          </p>
                        </section>

                        <section aria-labelledby="what-to-do-heading">
                          <h2
                            id="what-to-do-heading"
                            className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
                          >
                            What you need to do
                          </h2>
                          <ul className="tw-mb-0 tw-grid tw-gap-3 tw-pl-5">
                            <li>
                              If you see the{" "}
                              <strong>Upgrade Authentication</strong> prompt,
                              connect the same wallet and sign the message.
                            </li>
                            <li>
                              The signature does not cost gas and does not send
                              a transaction.
                            </li>
                            <li>
                              If you choose <strong>Remind me later</strong>,
                              you can still upgrade from your profile menu.
                            </li>
                          </ul>
                        </section>

                        <section aria-labelledby="why-now-heading">
                          <h2
                            id="why-now-heading"
                            className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
                          >
                            Why you may see this prompt
                          </h2>
                          <p className="tw-mb-3">
                            Some older sessions can keep working until the
                            upgrade deadline. During that time, 6529 may remind
                            you to upgrade before the older session expires.
                          </p>
                          <p className="tw-mb-0">
                            Some newer features, including mobile connection
                            sharing, need the new session before they can work.
                          </p>
                        </section>

                        <section aria-labelledby="safe-heading">
                          <h2
                            id="safe-heading"
                            className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
                          >
                            What stays the same
                          </h2>
                          <ul className="tw-mb-0 tw-grid tw-gap-3 tw-pl-5">
                            <li>
                              Your wallet address and profile do not change.
                            </li>
                            <li>You do not need to move tokens or assets.</li>
                            <li>
                              The 6529 Desktop app continues using the existing
                              connection flow during this rollout.
                            </li>
                          </ul>
                        </section>
                      </div>
                    </article>
                  </div>

                  <div className="tw-mt-6 tw-block tw-text-center md:tw-hidden">
                    <AboutMenu currentSection={AboutSection.TECH} />
                  </div>
                </Col>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
