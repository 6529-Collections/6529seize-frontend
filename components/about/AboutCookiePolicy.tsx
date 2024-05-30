import { CONSENT_COOKIE } from "../../constants";
import styles from "./About.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";

export default function AboutCookiePolicy() {
  return (
    <Container>
      <Row>
        <Col>
          <h1 className="float-none">
            <span className="font-lightest">Cookie</span> Policy
          </h1>
        </Col>
      </Row>
      <Row>
        <Col className={`${styles.lastUpdateText} text-right pt-3 pb-3`}>
          Last Updated: March 26, 2024
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col xs={12}>
          <h2>Cookie List</h2>
        </Col>
        <Col xs={12}>
          <p>
            A cookie is a small piece of data (text file) that a website – when
            visited by a user – asks your browser to store on your device in
            order to remember information about you. Those cookies are set by us
            and called first-party cookies. More specifically, we use cookies
            and other tracking technologies for the following purposes:
          </p>
          <h3>Strictly Necessary Cookies</h3>
          <br />
          <br />
          <p>
            These cookies are necessary for the website to function and cannot
            be switched off in our systems. They are usually only set in
            response to actions made by you which amount to a request for
            services. You can set your browser to block or alert you about these
            cookies, but some parts of the site will not then work. These
            cookies do not store any personally identifiable information.
          </p>
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
                <td>seize.io</td>
                <td>
                  <a
                    href="https://cookiepedia.co.uk/cookies/AWSALBTGCORS"
                    target="_blank"
                    rel="noreferrer">
                    AWSALBTGCORS
                  </a>{" "}
                  (Amazon Web Services)
                </td>
                <td>First Party</td>
                <td>7 days</td>
              </tr>
              <tr>
                <td>seize.io</td>
                <td>
                  <a
                    href="https://cookiepedia.co.uk/cookies/AWSALBTG"
                    target="_blank"
                    rel="noreferrer">
                    AWSALBTG
                  </a>{" "}
                  (Amazon Web Services)
                </td>
                <td>First Party</td>
                <td>7 days</td>
              </tr>
              <tr>
                <td>seize.io</td>
                <td>wallet-auth (JWT Authentication)</td>
                <td>First Party</td>
                <td>7 days</td>
              </tr>
              <tr>
                <td>seize.io</td>
                <td>{CONSENT_COOKIE}</td>
                <td>First Party</td>
                <td>30 days</td>
              </tr>
            </tbody>
          </Table>
          <br />
          <h3>Performance Cookies</h3>
          <br />
          <br />
          <p>
            These cookies allow us to count visits and traffic sources so we can
            measure and improve the performance of our site. They help us to
            know which pages are the most and least popular and see how visitors
            move around the site. All information these cookies collect is
            aggregated and therefore anonymous. If you do not allow these
            cookies we will not know when you have visited our site, and will
            not be able to monitor its performance.
          </p>
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
                <td>.seize.io</td>
                <td>
                  <a
                    href="https://cookiepedia.co.uk/cookies/_ga_"
                    target="_blank"
                    rel="noreferrer">
                    _ga_71NLVV3KY3
                  </a>{" "}
                  (Google Analytics)
                </td>
                <td>First Party</td>
                <td>372 days</td>
              </tr>
              <tr>
                <td>.seize.io</td>
                <td>
                  <a
                    href="https://cookiepedia.co.uk/cookies/_ga"
                    target="_blank"
                    rel="noreferrer">
                    _ga
                  </a>{" "}
                  (Google Analytics)
                </td>
                <td>First Party</td>
                <td>372 days</td>
              </tr>
              <tr>
                <td>.seize.io</td>
                <td>
                  <a
                    href="https://cookiepedia.co.uk/cookies/_gid"
                    target="_blank"
                    rel="noreferrer">
                    _gid
                  </a>{" "}
                  (Google Analytics)
                </td>
                <td>First Party</td>
                <td>372 days</td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}
