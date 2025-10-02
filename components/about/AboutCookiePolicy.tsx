"use client";

import Toggle from "react-toggle";
import styles from "./About.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import { useState } from "react";
import {
  useCookieConsent,
  getCookieConsentByName,
} from "../cookies/CookieConsentContext";
import {
  CONSENT_ESSENTIAL_COOKIE,
  CONSENT_EULA_COOKIE,
  CONSENT_PERFORMANCE_COOKIE,
} from "@/constants";

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
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Cookie</span> Policy
          </h1>
        </Col>
      </Row>
      <Row>
        <Col className={`${styles.lastUpdateText} text-right pt-3 pb-3`}>
          Last Updated: June 04, 2024
        </Col>
      </Row>
      <Row>
        <Col>
          <Container className="no-padding">
            <Row className="pb-3">
              <Col>
                <h3 className="mb-0">Cookie List</h3>
              </Col>
            </Row>
            <Row className="pt-2 pb-2">
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
      <Row className="pt-3 pb-3">
        <Col>
          <Container className="no-padding">
            <Row className="pb-3">
              <Col>
                <h4 className="mb-0">Strictly Necessary Cookies</h4>
              </Col>
            </Row>
            <Row className="pt-2">
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
            <Row>
              <Col>
                <Table className={styles.cookiePolicyTable}>
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
                          rel="noopener noreferrer">
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
                          rel="noopener noreferrer">
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
      <Row className="pt-3 pb-3">
        <Col>
          <Container className="no-padding">
            <Row className="pb-3">
              <Col className="d-flex align-items-center justify-content-between">
                <h4 className="mb-0">Performance Cookies</h4>
                <span className="d-flex align-items-center gap-2">
                  <label
                    htmlFor={"performance-cookies-toggle"}
                    className={"font-color"}>
                    <b>
                      {isPerformanceCookiesEnabled ? "Enabled" : "Disabled"}
                    </b>
                  </label>
                  <Toggle
                    disabled={showCookieConsent}
                    id={"performance-cookies-toggle"}
                    checked={isPerformanceCookiesEnabled}
                    onChange={togglePerformanceCookies}
                  />
                </span>
              </Col>
            </Row>
            <Row className="pt-2">
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
            <Row>
              <Col>
                <Table className={styles.cookiePolicyTable}>
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
                          rel="noopener noreferrer">
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
                          rel="noopener noreferrer">
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
                          rel="noopener noreferrer">
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
            <Row className="pt-2">
              <Col>
                <Container className="no-padding">
                  <Row className="pb-3">
                    <Col>
                      <h5 className="mb-0">Retention Policy</h5>
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
