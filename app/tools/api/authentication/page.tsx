import CodeExample from "@/components/code-example/CodeExample";
import { getAppMetadata } from "@/components/providers/metadata";
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
  title: string;
  wide?: boolean;
}>;

function ApiAuthSection({
  children,
  headingId,
  title,
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
            {title}
          </h2>
          {children}
        </section>
      </Col>
    </Row>
  );
}

function AuthFlowStep({
  code,
  message,
}: Readonly<{
  code: string;
  message: string;
}>) {
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

const apiAuthGuideCopy = {
  metadataTitle: "API Authentication",
  metadataDescription:
    "External-client session-v2 wallet authentication for the 6529 API.",
  backToApi: "Back to API",
  eyebrow: "API Authentication",
  title: "External Client Authentication",
  lead:
    "Use session-v2 wallet authentication when building scripts, services, and other external clients against the 6529 API.",
  overviewTitle: "What to use",
  overviewPreferred:
    "New external clients should authenticate through session-v2 endpoints. The standard external-client mode is client_type=native, even when the client is a command-line script or backend service controlled by the wallet owner.",
  overviewLegacy:
    "The older nonce, login, and redeem-refresh-token endpoints remain compatibility endpoints for older clients. New integrations should not start on those legacy endpoints.",
  flowTitle: "Login flow",
  flowNonce: `Request a signable message with signer_address, client_type=native, and chain_id=1 from ${FLOW_CODE_PLACEHOLDER}.`,
  flowSign: `Sign the returned message exactly as returned in ${FLOW_CODE_PLACEHOLDER}.`,
  flowLogin: `Send client_type, client_address, client_signature, server_signature, and optional role to ${FLOW_CODE_PLACEHOLDER}.`,
  flowBearer: `Use the returned access token on protected API calls as ${FLOW_CODE_PLACEHOLDER}.`,
  refreshTitle: "Refresh and logout",
  refreshLogin:
    "Native/script login returns an access_token for bearer auth plus a native_refresh_token and refresh_token_expires_at for long-running clients.",
  refreshRotate:
    "Refresh through POST /api/auth/session-refresh with client_type=native, client_address, and the current native_refresh_token. A successful refresh rotates the native refresh token, so replace the stored token with the new one immediately.",
  refreshLogout:
    "Logout through POST /api/auth/session-logout with client_type=native, client_address, the current native_refresh_token, and all_sessions=false unless you intend to revoke every session for that wallet.",
  browserTitle: "Browser clients",
  browserNote:
    "This guide is for external clients. First-party browser sessions also use session-v2, but browser refresh state is handled with backend-owned HttpOnly cookies, credentials-included requests, and origin checks. Follow the app implementation rather than adapting the native/script examples directly for browser sessions.",
  securityTitle: "Security rules",
  securitySignable:
    "Sign only signable_message exactly as returned. Do not trim, normalize, rebuild, JSON-stringify, or sign a nonce field.",
  securitySecrets:
    "Do not log private keys, access tokens, refresh tokens, signatures, or raw authentication responses. Store refresh tokens in a secret store appropriate for the client environment.",
  securityStatus:
    "Check response status codes before trusting JSON payloads, and treat authentication errors as requiring a fresh wallet signature or a clean re-login.",
  examplesTitle: "Node.js examples",
  examplesLogin:
    "This example requests a native session-v2 challenge, signs it, calls a protected endpoint with bearer auth, refreshes the session, and logs out.",
  relatedAriaLabel: "Related API authentication links",
  relatedApi: "API overview",
  relatedReference: "Full API reference",
} as const;

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
              {apiAuthGuideCopy.backToApi}
            </Link>
            <header className="tw-max-w-4xl">
              <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-text-iron-50">
                {apiAuthGuideCopy.eyebrow}
              </p>
              <h1 className="tw-mb-4 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-iron-50 md:tw-text-4xl">
                {apiAuthGuideCopy.title}
              </h1>
              <p className="tw-mb-0 tw-text-base tw-leading-7 tw-text-iron-50">
                {apiAuthGuideCopy.lead}
              </p>
            </header>
          </Col>
        </Row>

        <ApiAuthSection
          headingId="api-auth-overview-heading"
          title={apiAuthGuideCopy.overviewTitle}
        >
          <p className="tw-mb-3">{apiAuthGuideCopy.overviewPreferred}</p>
          <p className="tw-mb-0">{apiAuthGuideCopy.overviewLegacy}</p>
        </ApiAuthSection>

        <ApiAuthSection
          headingId="api-auth-flow-heading"
          title={apiAuthGuideCopy.flowTitle}
        >
          <ol className="tw-grid tw-gap-3 tw-pl-5">
            <AuthFlowStep
              message={apiAuthGuideCopy.flowNonce}
              code="GET /api/auth/session-nonce"
            />
            <AuthFlowStep
              message={apiAuthGuideCopy.flowSign}
              code="signable_message"
            />
            <AuthFlowStep
              message={apiAuthGuideCopy.flowLogin}
              code="POST /api/auth/session-login"
            />
            <AuthFlowStep
              message={apiAuthGuideCopy.flowBearer}
              code="Authorization: Bearer <access_token>"
            />
          </ol>
        </ApiAuthSection>

        <ApiAuthSection
          headingId="api-auth-refresh-heading"
          title={apiAuthGuideCopy.refreshTitle}
        >
          <p className="tw-mb-3">{apiAuthGuideCopy.refreshLogin}</p>
          <p className="tw-mb-3">{apiAuthGuideCopy.refreshRotate}</p>
          <p className="tw-mb-0">{apiAuthGuideCopy.refreshLogout}</p>
        </ApiAuthSection>

        <ApiAuthSection
          headingId="api-auth-browser-heading"
          title={apiAuthGuideCopy.browserTitle}
        >
          <p className="tw-mb-0">{apiAuthGuideCopy.browserNote}</p>
        </ApiAuthSection>

        <ApiAuthSection
          headingId="api-auth-security-heading"
          title={apiAuthGuideCopy.securityTitle}
        >
          <ul className="tw-mb-0 tw-grid tw-gap-3 tw-pl-5">
            <li>{apiAuthGuideCopy.securitySignable}</li>
            <li>{apiAuthGuideCopy.securitySecrets}</li>
            <li>{apiAuthGuideCopy.securityStatus}</li>
          </ul>
        </ApiAuthSection>

        <ApiAuthSection
          headingId="api-auth-examples-heading"
          title={apiAuthGuideCopy.examplesTitle}
          wide
        >
          <p className="tw-mb-3">{apiAuthGuideCopy.examplesLogin}</p>
          <CodeExample code={nodeJsSessionExample} />
        </ApiAuthSection>

        <Row className="tw-pt-6">
          <Col>
            <nav
              aria-label={apiAuthGuideCopy.relatedAriaLabel}
              className="tw-flex tw-max-w-4xl tw-flex-wrap tw-gap-4 tw-text-sm"
            >
              <Link
                href="/tools/api"
                className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300 tw-no-underline"
              >
                {apiAuthGuideCopy.relatedApi}
              </Link>
              <a
                href={API_REFERENCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300 tw-no-underline"
              >
                {apiAuthGuideCopy.relatedReference}
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
    title: apiAuthGuideCopy.metadataTitle,
    description: apiAuthGuideCopy.metadataDescription,
  });
}
