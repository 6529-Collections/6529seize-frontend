import styles from "./About.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import Head from "next/head";
import { AboutSection } from "../../pages/about/[section]";

export default function AboutCookiePolicy() {
  return (
    <>
      <Head>
        <title>About - Cookie Policy | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="About - Cookie Policy | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${AboutSection.COOKIE_POLICY}`}
        />
        <meta property="og:title" content={`About - Cookie Policy`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">COOKIE POLICY</h1>
          </Col>
        </Row>
        <Row>
          <Col className={`${styles.lastUpdateText} text-right pt-3 pb-3`}>
            Last Updated: February 23, 2023
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
          <Col>
            <>
              <h2>Cookie List</h2>
              <br />
              <br />
              <p>
                A cookie is a small piece of data (text file) that a website –
                when visited by a user – asks your browser to store on your
                device in order to remember information about you. Those cookies
                are set by us and called first-party cookies. More specifically,
                we use cookies and other tracking technologies for the following
                purposes:
              </p>
              <h3>Strictly Necessary Cookies</h3>
              <br />
              <br />
              <p>
                These cookies are necessary for the website to function and
                cannot be switched off in our systems. They are usually only set
                in response to actions made by you which amount to a request for
                services. You can set your browser to block or alert you about
                these cookies, but some parts of the site will not then work.
                These cookies do not store any personally identifiable
                information.
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
                      </a>
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
                      </a>
                    </td>
                    <td>First Party</td>
                    <td>7 days</td>
                  </tr>
                </tbody>
              </Table>
              <br />
              <h3>Performance Cookies</h3>
              <br />
              <br />
              <p>
                These cookies allow us to count visits and traffic sources so we
                can measure and improve the performance of our site. They help
                us to know which pages are the most and least popular and see
                how visitors move around the site. All information these cookies
                collect is aggregated and therefore anonymous. If you do not
                allow these cookies we will not know when you have visited our
                site, and will not be able to monitor its performance.
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
                      </a>
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
                      </a>
                    </td>
                    <td>First Party</td>
                    <td>372 days</td>
                  </tr>
                </tbody>
              </Table>
            </>
          </Col>
        </Row>
      </Container>
    </>
  );
}
