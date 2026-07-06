import CodeExample from "@/components/code-example/CodeExample";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import styles from "@/styles/Home.module.css";
import clsx from "clsx";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ABOUT_TEXT_PAGE_CONTAINER_CLASS,
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
} from "@/components/about/AboutLayout";

const API_AUTH_LOCALE = DEFAULT_LOCALE;
const API_REFERENCE_URL = "https://api.6529.io/docs/";
const FLOW_CODE_PLACEHOLDER = "__API_AUTH_FLOW_CODE__";

const inlineCodeClass =
  "tw-rounded tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-text-sm tw-text-iron-100";
const sectionClass = "tw-max-w-4xl tw-text-base tw-leading-7 tw-text-iron-50";
const exampleSectionClass =
  "tw-max-w-5xl tw-text-base tw-leading-7 tw-text-iron-50";
const sectionHeadingClass =
  "tw-mb-3 tw-text-2xl tw-font-semibold tw-text-iron-50";

type ApiAuthSectionProps = Readonly<{
  children: ReactNode;
  headingId: string;
  titleKey: MessageKey;
  wide?: boolean;
}>;

function ApiAuthSection({
  children,
  headingId,
  titleKey,
  wide = false,
}: ApiAuthSectionProps) {
  return (
    <Row className="tw-pt-6">
      <Col>
        <section
          className={wide ? exampleSectionClass : sectionClass}
          aria-labelledby={headingId}
        >
          <h2 id={headingId} className={sectionHeadingClass}>
            {t(API_AUTH_LOCALE, titleKey)}
          </h2>
          {children}
        </section>
      </Col>
    </Row>
  );
}

function AuthFlowStep({
  code,
  messageKey,
}: Readonly<{
  code: string;
  messageKey: MessageKey;
}>) {
  const message = t(API_AUTH_LOCALE, messageKey, {
    code: FLOW_CODE_PLACEHOLDER,
  });
  const [beforeCode = "", afterCode = ""] =
    message.split(FLOW_CODE_PLACEHOLDER);

  return (
    <li>
      {beforeCode}
      <code className={inlineCodeClass}>{code}</code>
      {afterCode}
    </li>
  );
}

const nodeJsSessionExample = `import { Wallet } from "ethers";
import fetch from "node-fetch";

const API_BASE = "https://api.6529.io/api";

async function assertOk(response, label) {
  if (!response.ok) {
    throw new Error(\`\${label} failed with HTTP \${response.status}\`);
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
      <Container className={ABOUT_TEXT_PAGE_CONTAINER_CLASS}>
        <Row>
          <Col>
            <Link
              href="/tools/api"
              className="hover:tw-text-primary-200 tw-mb-5 tw-inline-flex tw-text-sm tw-font-semibold tw-text-primary-300 tw-no-underline"
            >
              {t(API_AUTH_LOCALE, "tools.api.authGuide.backToApi")}
            </Link>
            <header className="tw-max-w-4xl">
              <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-50">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.eyebrow")}
              </p>
              <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.title")}
              </h1>
              <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-50">
                {t(API_AUTH_LOCALE, "tools.api.authGuide.lead")}
              </p>
            </header>
          </Col>
        </Row>

        <ApiAuthSection
          headingId="api-auth-overview-heading"
          titleKey="tools.api.authGuide.overview.title"
        >
          <p className="tw-mb-3">
            {t(API_AUTH_LOCALE, "tools.api.authGuide.overview.preferred")}
          </p>
          <p className="tw-mb-0">
            {t(API_AUTH_LOCALE, "tools.api.authGuide.overview.legacy")}
          </p>
        </ApiAuthSection>

        <ApiAuthSection
          headingId="api-auth-flow-heading"
          titleKey="tools.api.authGuide.flow.title"
        >
          <ol className="tw-grid tw-gap-3 tw-pl-5">
            <AuthFlowStep
              messageKey="tools.api.authGuide.flow.nonce"
              code="GET /api/auth/session-nonce"
            />
            <AuthFlowStep
              messageKey="tools.api.authGuide.flow.sign"
              code="signable_message"
            />
            <AuthFlowStep
              messageKey="tools.api.authGuide.flow.login"
              code="POST /api/auth/session-login"
            />
            <AuthFlowStep
              messageKey="tools.api.authGuide.flow.bearer"
              code="Authorization: Bearer <access_token>"
            />
          </ol>
        </ApiAuthSection>

        <ApiAuthSection
          headingId="api-auth-refresh-heading"
          titleKey="tools.api.authGuide.refresh.title"
        >
          <p className="tw-mb-3">
            {t(API_AUTH_LOCALE, "tools.api.authGuide.refresh.login")}
          </p>
          <p className="tw-mb-3">
            {t(API_AUTH_LOCALE, "tools.api.authGuide.refresh.rotate")}
          </p>
          <p className="tw-mb-0">
            {t(API_AUTH_LOCALE, "tools.api.authGuide.refresh.logout")}
          </p>
        </ApiAuthSection>

        <ApiAuthSection
          headingId="api-auth-browser-heading"
          titleKey="tools.api.authGuide.browser.title"
        >
          <p className="tw-mb-0">
            {t(API_AUTH_LOCALE, "tools.api.authGuide.browser.note")}
          </p>
        </ApiAuthSection>

        <ApiAuthSection
          headingId="api-auth-security-heading"
          titleKey="tools.api.authGuide.security.title"
        >
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
        </ApiAuthSection>

        <ApiAuthSection
          headingId="api-auth-examples-heading"
          titleKey="tools.api.authGuide.examples.title"
          wide
        >
          <p className="tw-mb-3">
            {t(API_AUTH_LOCALE, "tools.api.authGuide.examples.login")}
          </p>
          <CodeExample code={nodeJsSessionExample} />
        </ApiAuthSection>

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
