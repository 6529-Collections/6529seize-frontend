import CodeExample from "@/components/code-example/CodeExample";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import styles from "@/styles/Home.module.css";
import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "@/components/about/AboutLayout";

const API_AUTH_LOCALE = DEFAULT_LOCALE;
const API_REFERENCE_URL = "https://api.6529.io/docs/";

const inlineCodeClass =
  "tw-rounded tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-text-sm tw-text-iron-100";

const nodeJsLoginExample = `import { Wallet } from "ethers";
import fetch from "node-fetch";

const API_BASE = "https://api.6529.io/api";

async function assertOk(response, label) {
  if (!response.ok) {
    throw new Error(
      \`\${label} failed: \${response.status} \${response.statusText} - \${await response.text()}\`
    );
  }
}

export async function loginAndFetchFeed() {
  const clientAddress = "0x...";
  const clientPrivateKey = "0x..."; // Never hardcode private keys in production.
  const wallet = new Wallet(clientPrivateKey);

  const nonceResp = await fetch(
    \`\${API_BASE}/auth/session-nonce?signer_address=\${clientAddress}&client_type=native&chain_id=1\`,
    { headers: { accept: "application/json" } }
  );
  await assertOk(nonceResp, "session nonce");

  const { signable_message, server_signature } = await nonceResp.json();
  const clientSignature = await wallet.signMessage(signable_message);

  const loginResp = await fetch(\`\${API_BASE}/auth/session-login\`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_type: "native",
      client_address: clientAddress,
      client_signature: clientSignature,
      server_signature,
    }),
  });
  await assertOk(loginResp, "session login");

  const session = await loginResp.json();

  const feedResp = await fetch(\`\${API_BASE}/feed\`, {
    headers: {
      accept: "application/json",
      authorization: \`Bearer \${session.access_token}\`,
    },
  });
  await assertOk(feedResp, "feed");

  return {
    session,
    feed: await feedResp.json(),
  };
}`;

const nodeJsRefreshExample = `import fetch from "node-fetch";

const API_BASE = "https://api.6529.io/api";

async function assertOk(response, label) {
  if (!response.ok) {
    throw new Error(
      \`\${label} failed: \${response.status} \${response.statusText} - \${await response.text()}\`
    );
  }
}

export async function refreshNativeSession({ address, nativeRefreshToken }) {
  const response = await fetch(\`\${API_BASE}/auth/session-refresh\`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_type: "native",
      client_address: address,
      native_refresh_token: nativeRefreshToken,
    }),
  });
  await assertOk(response, "session refresh");

  const refreshedSession = await response.json();

  // Store refreshedSession.native_refresh_token over the previous refresh token.
  return refreshedSession;
}

export async function logoutNativeSession({ address, nativeRefreshToken }) {
  const response = await fetch(\`\${API_BASE}/auth/session-logout\`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_type: "native",
      client_address: address,
      native_refresh_token: nativeRefreshToken,
      all_sessions: false,
    }),
  });
  await assertOk(response, "session logout");
}`;

export default function ApiAuthenticationPage() {
  return (
    <main className={clsx(styles["main"], "tailwind-scope")}>
      <Container className="tw-pb-4 tw-pt-4">
        <Row>
          <Col>
            <Link
              href="/tools/api"
              className="hover:tw-text-primary-200 tw-mb-5 tw-inline-flex tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline"
            >
              {t(API_AUTH_LOCALE, "tools.api.authGuide.backToApi")}
            </Link>
            <header className="tw-max-w-4xl">
              <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-400">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.eyebrow")}
              </p>
              <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.title")}
              </h1>
              <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-300">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.lead")}
              </p>
            </header>
          </Col>
        </Row>

        <Row className="tw-pt-6">
          <Col>
            <section
              className="tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-300"
              aria-labelledby="api-auth-overview-heading"
            >
              <h2
                id="api-auth-overview-heading"
                className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
              >
                {t(API_AUTH_LOCALE, "tools.api.authGuide.overview.title")}
              </h2>
              <p className="tw-mb-3">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.overview.preferred")}
              </p>
              <p className="tw-mb-0">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.overview.legacy")}
              </p>
            </section>
          </Col>
        </Row>

        <Row className="tw-pt-6">
          <Col>
            <section
              className="tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-300"
              aria-labelledby="api-auth-flow-heading"
            >
              <h2
                id="api-auth-flow-heading"
                className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
              >
                {t(API_AUTH_LOCALE, "tools.api.authGuide.flow.title")}
              </h2>
              <ol className="tw-grid tw-gap-3 tw-pl-5">
                <li>
                  {t(API_AUTH_LOCALE, "tools.api.authGuide.flow.nonce")}{" "}
                  <code className={inlineCodeClass}>
                    GET /api/auth/session-nonce
                  </code>
                  .
                </li>
                <li>
                  {t(API_AUTH_LOCALE, "tools.api.authGuide.flow.sign")}{" "}
                  <code className={inlineCodeClass}>signable_message</code>.
                </li>
                <li>
                  {t(API_AUTH_LOCALE, "tools.api.authGuide.flow.login")}{" "}
                  <code className={inlineCodeClass}>
                    POST /api/auth/session-login
                  </code>
                  .
                </li>
                <li>
                  {t(API_AUTH_LOCALE, "tools.api.authGuide.flow.bearer")}{" "}
                  <code className={inlineCodeClass}>
                    Authorization: Bearer &lt;access_token&gt;
                  </code>
                  .
                </li>
              </ol>
            </section>
          </Col>
        </Row>

        <Row className="tw-pt-6">
          <Col>
            <section
              className="tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-300"
              aria-labelledby="api-auth-refresh-heading"
            >
              <h2
                id="api-auth-refresh-heading"
                className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
              >
                {t(API_AUTH_LOCALE, "tools.api.authGuide.refresh.title")}
              </h2>
              <p className="tw-mb-3">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.refresh.login")}
              </p>
              <p className="tw-mb-3">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.refresh.rotate")}
              </p>
              <p className="tw-mb-0">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.refresh.logout")}
              </p>
            </section>
          </Col>
        </Row>

        <Row className="tw-pt-6">
          <Col>
            <section
              className="tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-300"
              aria-labelledby="api-auth-browser-heading"
            >
              <h2
                id="api-auth-browser-heading"
                className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
              >
                {t(API_AUTH_LOCALE, "tools.api.authGuide.browser.title")}
              </h2>
              <p className="tw-mb-0">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.browser.note")}
              </p>
            </section>
          </Col>
        </Row>

        <Row className="tw-pt-6">
          <Col>
            <section
              className="tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-300"
              aria-labelledby="api-auth-security-heading"
            >
              <h2
                id="api-auth-security-heading"
                className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
              >
                {t(API_AUTH_LOCALE, "tools.api.authGuide.security.title")}
              </h2>
              <ul className="tw-mb-0 tw-grid tw-gap-3 tw-pl-5">
                <li>
                  {t(API_AUTH_LOCALE, "tools.api.authGuide.security.signable")}
                </li>
                <li>
                  {t(API_AUTH_LOCALE, "tools.api.authGuide.security.secrets")}
                </li>
                <li>
                  {t(API_AUTH_LOCALE, "tools.api.authGuide.security.status")}
                </li>
              </ul>
            </section>
          </Col>
        </Row>

        <Row className="tw-pt-6">
          <Col>
            <section
              className="tw-max-w-5xl tw-text-base tw-leading-7 tw-text-iron-300"
              aria-labelledby="api-auth-examples-heading"
            >
              <h2
                id="api-auth-examples-heading"
                className="tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50"
              >
                {t(API_AUTH_LOCALE, "tools.api.authGuide.examples.title")}
              </h2>
              <p className="tw-mb-3">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.examples.login")}
              </p>
              <CodeExample code={nodeJsLoginExample} />
              <p className="tw-mb-3 tw-mt-6">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.examples.refresh")}
              </p>
              <CodeExample code={nodeJsRefreshExample} />
            </section>
          </Col>
        </Row>

        <Row className="tw-pt-6">
          <Col>
            <nav
              aria-label={t(
                API_AUTH_LOCALE,
                "tools.api.authGuide.related.ariaLabel"
              )}
              className="tw-flex tw-max-w-4xl tw-flex-wrap tw-gap-4 tw-text-sm"
            >
              <Link
                href="/tools/api"
                className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300 tw-no-underline"
              >
                {t(API_AUTH_LOCALE, "tools.api.authGuide.related.api")}
              </Link>
              <a
                href={API_REFERENCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300 tw-no-underline"
              >
                {t(API_AUTH_LOCALE, "tools.api.authGuide.related.reference")}
              </a>
            </nav>
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    title: t(API_AUTH_LOCALE, "tools.api.authGuide.metadata.title"),
    description: t(
      API_AUTH_LOCALE,
      "tools.api.authGuide.metadata.description"
    ),
  });
}
