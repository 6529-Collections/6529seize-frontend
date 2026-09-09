"use client";

import {
  CONSENT_ESSENTIAL_COOKIE,
  CONSENT_EULA_COOKIE,
  CONSENT_PERFORMANCE_COOKIE,
} from "@/constants/constants";
import { useState } from "react";
import Toggle from "react-toggle";
import {
  getCookieConsentByName,
  useCookieConsent,
} from "../cookies/CookieConsentContext";
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

export default function AboutCookiePolicy() {
  const { showCookieConsent, consent, reject } = useCookieConsent();

  const [isPerformanceCookiesEnabled, setIsPerformanceCookiesEnabled] =
    useState(getCookieConsentByName(CONSENT_PERFORMANCE_COOKIE));

  const togglePerformanceCookies = () => {
    if (isPerformanceCookiesEnabled) {
      reject();
    } else {
      consent();
    }
    setIsPerformanceCookiesEnabled(!isPerformanceCookiesEnabled);
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
          Last Updated: June 04, 2024
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
                  <thead>
                    <tr>
                      <th>Domain</th>
                      <th>Cookies</th>
                      <th>Cookies used</th>
                      <th>Lifespan</th>
                    </tr>
                  </thead>
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
                      <td>First Party</td>
                      <td>7 days</td>
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
                      <td>First Party</td>
                      <td>7 days</td>
                    </tr>
                    <tr>
                      <td>6529.io</td>
                      <td>wallet-auth (JWT Authentication)</td>
                      <td>First Party</td>
                      <td>7 days</td>
                    </tr>
                    <tr>
                      <td>6529.io</td>
                      <td>{CONSENT_ESSENTIAL_COOKIE}</td>
                      <td>First Party</td>
                      <td>1 year</td>
                    </tr>
                    <tr>
                      <td>6529.io</td>
                      <td>{CONSENT_EULA_COOKIE}</td>
                      <td>First Party</td>
                      <td>1 year</td>
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
                  <thead>
                    <tr>
                      <th>Domain</th>
                      <th>Cookies</th>
                      <th>Cookies used</th>
                      <th>Lifespan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>6529.io</td>
                      <td>{CONSENT_PERFORMANCE_COOKIE}</td>
                      <td>First Party</td>
                      <td>1 year</td>
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
                      <td>First Party</td>
                      <td>1 year</td>
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
                      <td>First Party</td>
                      <td>1 year</td>
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
                      <td>First Party</td>
                      <td>1 year</td>
                    </tr>
                  </tbody>
                </Table>
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
