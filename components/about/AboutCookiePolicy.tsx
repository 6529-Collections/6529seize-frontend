"use client";

import {
  CONSENT_ESSENTIAL_COOKIE,
  CONSENT_EULA_COOKIE,
  CONSENT_PERFORMANCE_COOKIE,
} from "@/constants/constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import Toggle from "react-toggle";
import { useCookieConsent } from "../cookies/CookieConsentContext";
import {
  AboutCol as Col,
  AboutContainer as Container,
  AboutRow as Row,
  AboutTable as Table,
} from "./AboutLayout";

const COOKIE_POLICY_TABLE_CLASS = [
  "tw-min-w-[42rem] tw-border-separate tw-border-spacing-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-text-left tw-text-sm tw-leading-6 tw-text-iron-300",
  "[&_th]:tw-bg-iron-950/60 [&_th]:tw-p-3 [&_th]:tw-font-semibold [&_th]:tw-text-iron-100",
  "[&_td]:tw-border-0 [&_td]:tw-border-t [&_td]:tw-border-solid [&_td]:tw-border-white/[0.07] [&_td]:tw-p-3 [&_td]:tw-align-top",
].join(" ");

const COOKIE_POLICY_LAST_UPDATED = "2026-11-06";

type CookiePolicyMessageKey = Extract<
  MessageKey,
  `about.cookiePolicy.${string}`
>;

interface AwsRumCookie {
  readonly name: string;
  readonly purposeKey: CookiePolicyMessageKey;
  readonly lifespanKey: CookiePolicyMessageKey;
}

// aws-rum-web (`allowCookies: true`) writes these with `Domain=<hostname>`,
// so on 6529.io they are `.6529.io` domain cookies.
const AWS_RUM_USER_ID_COOKIE = "cwr_u";
const AWS_RUM_SESSION_COOKIE = "cwr_s";

const AWS_RUM_COOKIES: readonly AwsRumCookie[] = [
  {
    name: AWS_RUM_USER_ID_COOKIE,
    purposeKey: "about.cookiePolicy.awsRum.userId.purpose",
    lifespanKey: "about.cookiePolicy.awsRum.userId.lifespan",
  },
  {
    name: AWS_RUM_SESSION_COOKIE,
    purposeKey: "about.cookiePolicy.awsRum.session.purpose",
    lifespanKey: "about.cookiePolicy.awsRum.session.lifespan",
  },
];

function CookieTableHead({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <thead>
      <tr>
        <th>{t(locale, "about.cookiePolicy.table.domain")}</th>
        <th>{t(locale, "about.cookiePolicy.table.cookies")}</th>
        <th>{t(locale, "about.cookiePolicy.table.cookiesUsed")}</th>
        <th>{t(locale, "about.cookiePolicy.table.lifespan")}</th>
      </tr>
    </thead>
  );
}

function AwsRumCookieRows({
  locale,
  firstPartyLabel,
}: {
  readonly locale: SupportedLocale;
  readonly firstPartyLabel: string;
}) {
  return (
    <>
      {AWS_RUM_COOKIES.map((cookie) => (
        <tr key={cookie.name}>
          <td>.6529.io</td>
          <td>
            {t(locale, "about.cookiePolicy.cookieWithProvider", {
              cookie: cookie.name,
              provider: t(locale, "about.cookiePolicy.awsRum.provider"),
            })}
            <span className="tw-block tw-text-iron-400">
              {t(locale, cookie.purposeKey)}
            </span>
          </td>
          <td>{firstPartyLabel}</td>
          <td>{t(locale, cookie.lifespanKey)}</td>
        </tr>
      ))}
    </>
  );
}

export default function AboutCookiePolicy() {
  const locale = useBrowserLocale();
  const { showCookieConsent, consent, reject, performanceConsent } =
    useCookieConsent();
  const firstPartyLabel = t(locale, "about.cookiePolicy.firstParty");
  const sevenDaysLabel = t(locale, "about.cookiePolicy.lifespan.sevenDays");
  const oneYearLabel = t(locale, "about.cookiePolicy.lifespan.oneYear");

  // The toggle shows the consent provider's choice, so a change made in the
  // banner (or a failed save) is reflected here. The provider reads the
  // consent cookie after mounting, so server HTML and the hydration render
  // show "Disabled" until then.
  const isPerformanceCookiesEnabled = performanceConsent === true;

  const togglePerformanceCookies = () => {
    if (isPerformanceCookiesEnabled) {
      reject();
    } else {
      consent();
    }
  };

  return (
    <Container fluid horizontalPadding={false}>
      <Row>
        <Col>
          <h1>Cookie Policy</h1>
        </Col>
      </Row>
      <Row>
        <Col className="tw-pb-3 tw-pt-2 tw-text-left tw-text-sm tw-leading-6 tw-text-iron-500">
          {t(locale, "about.cookiePolicy.lastUpdated", {
            date: formatDate(locale, COOKIE_POLICY_LAST_UPDATED, {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          })}
        </Col>
      </Row>
      <Row>
        <Col>
          <Container fluid horizontalPadding={false}>
            <Row className="tw-pb-3">
              <Col>
                <h2 className="tw-mb-0">Cookie List</h2>
              </Col>
            </Row>
            <Row className="tw-pb-2 tw-pt-2">
              <Col>
                <p>
                  A cookie is a small piece of data (text file) that a website -
                  when visited by a user - asks your browser to store on your
                  device in order to remember information about you. Those
                  cookies are set by us and called first-party cookies. More
                  specifically, we use cookies and other tracking technologies
                  for the following purposes:
                </p>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="tw-pb-3 tw-pt-3">
        <Col>
          <Container fluid horizontalPadding={false}>
            <Row className="tw-pb-3">
              <Col>
                <h3 id="strictly-necessary-cookies-heading" className="tw-mb-0">
                  Strictly Necessary Cookies
                </h3>
              </Col>
            </Row>
            <Row className="tw-pt-2">
              <Col>
                These cookies are necessary for the website to function and
                cannot be switched off in our systems. They are usually only set
                in response to actions made by you which amount to a request for
                services. You can set your browser to block or alert you about
                these cookies, but some parts of the site will not then work.
                These cookies do not store any personally identifiable
                information.
              </Col>
            </Row>
            <Row className="tw-pt-5">
              <Col
                role="region"
                aria-labelledby="strictly-necessary-cookies-heading"
                tabIndex={0}
                className="tw-overflow-x-auto tw-rounded-lg focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
              >
                <Table className={COOKIE_POLICY_TABLE_CLASS}>
                  <CookieTableHead locale={locale} />
                  <tbody>
                    <tr>
                      <td>6529.io</td>
                      <td>
                        <a
                          href="https://cookiepedia.co.uk/cookies/AWSALBTGCORS"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          AWSALBTGCORS
                        </a>{" "}
                        (Amazon Web Services)
                      </td>
                      <td>{firstPartyLabel}</td>
                      <td>{sevenDaysLabel}</td>
                    </tr>
                    <tr>
                      <td>6529.io</td>
                      <td>
                        <a
                          href="https://cookiepedia.co.uk/cookies/AWSALBTG"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          AWSALBTG
                        </a>{" "}
                        (Amazon Web Services)
                      </td>
                      <td>{firstPartyLabel}</td>
                      <td>{sevenDaysLabel}</td>
                    </tr>
                    <tr>
                      <td>6529.io</td>
                      <td>__Host-wallet-auth (JWT Authentication)</td>
                      <td>{firstPartyLabel}</td>
                      <td>{sevenDaysLabel}</td>
                    </tr>
                    <tr>
                      <td>6529.io</td>
                      <td>{CONSENT_ESSENTIAL_COOKIE}</td>
                      <td>{firstPartyLabel}</td>
                      <td>{oneYearLabel}</td>
                    </tr>
                    <tr>
                      <td>6529.io</td>
                      <td>{CONSENT_EULA_COOKIE}</td>
                      <td>{firstPartyLabel}</td>
                      <td>{oneYearLabel}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="tw-pb-3 tw-pt-3">
        <Col>
          <Container fluid horizontalPadding={false}>
            <Row className="tw-pb-3">
              <Col className="tw-flex tw-items-center tw-justify-between">
                <h3 id="performance-cookies-heading" className="tw-mb-0">
                  Performance Cookies
                </h3>
                <span className="tw-flex tw-items-center tw-gap-2">
                  <label
                    htmlFor={"performance-cookies-toggle"}
                    id="performance-cookies-state"
                    className="tw-text-iron-100"
                  >
                    <b>
                      {isPerformanceCookiesEnabled ? "Enabled" : "Disabled"}
                    </b>
                  </label>
                  <Toggle
                    disabled={showCookieConsent}
                    id={"performance-cookies-toggle"}
                    aria-labelledby="performance-cookies-heading performance-cookies-state"
                    checked={isPerformanceCookiesEnabled}
                    onChange={togglePerformanceCookies}
                  />
                </span>
              </Col>
            </Row>
            <Row className="tw-pt-2">
              <Col>
                This website utilizes performance cookies that are stored on
                your computer. These cookies allow us to count visits and
                traffic sources so we can measure and improve the performance of
                our site. They help in identifying which pages are the most and
                least popular and see how visitors move around the site. All
                information these cookies collect is aggregated and therefore
                anonymous. If you do not allow these cookies we will not know
                when you have visited our site, and will not be able to monitor
                its performance.
              </Col>
            </Row>
            <Row className="tw-pt-5">
              <Col
                role="region"
                aria-labelledby="performance-cookies-heading"
                tabIndex={0}
                className="tw-overflow-x-auto tw-rounded-lg focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black"
              >
                <Table className={COOKIE_POLICY_TABLE_CLASS}>
                  <CookieTableHead locale={locale} />
                  <tbody>
                    <tr>
                      <td>6529.io</td>
                      <td>{CONSENT_PERFORMANCE_COOKIE}</td>
                      <td>{firstPartyLabel}</td>
                      <td>{oneYearLabel}</td>
                    </tr>
                    <tr>
                      <td>.6529.io</td>
                      <td>
                        <a
                          href="https://cookiepedia.co.uk/cookies/_ga_"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          _ga_71NLVV3KY3
                        </a>{" "}
                        (Google Analytics)
                      </td>
                      <td>{firstPartyLabel}</td>
                      <td>{oneYearLabel}</td>
                    </tr>
                    <tr>
                      <td>.6529.io</td>
                      <td>
                        <a
                          href="https://cookiepedia.co.uk/cookies/_ga"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          _ga
                        </a>{" "}
                        (Google Analytics)
                      </td>
                      <td>{firstPartyLabel}</td>
                      <td>{oneYearLabel}</td>
                    </tr>
                    <tr>
                      <td>.6529.io</td>
                      <td>
                        <a
                          href="https://cookiepedia.co.uk/cookies/_gid"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          _gid
                        </a>{" "}
                        (Google Analytics)
                      </td>
                      <td>{firstPartyLabel}</td>
                      <td>{oneYearLabel}</td>
                    </tr>
                    <AwsRumCookieRows
                      locale={locale}
                      firstPartyLabel={firstPartyLabel}
                    />
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row className="tw-pt-3">
              <Col>
                {t(locale, "about.cookiePolicy.awsRum.sampling", {
                  userIdCookie: AWS_RUM_USER_ID_COOKIE,
                  sessionCookie: AWS_RUM_SESSION_COOKIE,
                })}
              </Col>
            </Row>
            <Row className="tw-pt-2">
              <Col>
                <Container fluid horizontalPadding={false}>
                  <Row className="tw-pb-3">
                    <Col>
                      <h4 className="tw-mb-0">Retention Policy</h4>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      We will retain a record of your acceptance of any
                      performance cookie for the lifespan of the applicable
                      cookie plus up to 30 days thereafter.
                    </Col>
                  </Row>
                </Container>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
