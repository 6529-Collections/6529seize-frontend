import styles from "./About.module.scss";
import { Col, Container, Row } from "react-bootstrap";
import Head from "next/head";
import { AboutSection } from "../../pages/about/[section]";

export default function AboutPrivacyPolicy() {
  return (
    <>
      <Head>
        <title>About - Privacy Policy | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="About - Privacy Policy | 6529 SEIZE"
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${AboutSection.PRIVACY_POLICY}`}
        />
        <meta property="og:title" content={`About - Privacy Policy`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">PRIVACY POLICY</h1>
          </Col>
        </Row>
        <Row>
          <Col className={`${styles.lastUpdateText} text-right pt-3 pb-3`}>
            Last Updated: February 11, 2023
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
          <Col>
            <>
              <p>
                At this time, we collect non-personally identifiable information
                to improve the performance of our website and to display
                statistics. We do not collect personally identifiable
                information.
              </p>
              <ol>
                <li>
                  <b>Ethereum Based Information:</b> We use information that is
                  publicly available on the Ethereum blockchain to calculate and
                  display statistics about our NFTs and our holders of them.
                </li>
                <br />
                <li>
                  <b>Server Logs:</b> We keep server logs of data such as IP
                  addresses to improve the administration, performance and
                  security of our website.
                </li>
                <br />
                <li>
                  <b>Google Analytics:</b> We use Google Analytics to understand
                  how people use the website and to learn more about our
                  website&apos;s performance.
                  <br />
                  <br />
                  Information about Google Analytics privacy policy can be found
                  here:{" "}
                  <a
                    href="https://www.google.com/intl/en/policies/privacy/"
                    target="_blank"
                    rel="noreferrer">
                    https://www.google.com/intl/en/policies/privacy/
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://policies.google.com/technologies/partner-sites"
                    target="_blank"
                    rel="noreferrer">
                    https://policies.google.com/technologies/partner-sites
                  </a>
                  <br />
                  <br />
                  You can also opt-out of Google Analytics by installing this
                  browser extension:{" "}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noreferrer">
                    https://tools.google.com/dlpage/gaoptout
                  </a>
                  .
                </li>
                <br />
                <li>
                  <b>Cookies:</b> We use 1st party cookies. The cookies we use
                  can be found here:{" "}
                  <a
                    href={`/about/${AboutSection.COOKIE_POLICY}`}
                    target="_blank"
                    rel="noreferrer">
                    seize.io/about/cookie-policy
                  </a>
                  .
                </li>
                <br />
                <li>
                  <b>User Accounts:</b> We do not have user accounts that can be
                  closed, edited or modified. Our information about who is a
                  hodler of various NFTs &#40;6529 related and others&#41; is
                  read directly from the Ethereum blockchain.
                </li>
                <br />
                <li>
                  <b>Personally Identifiable Information:</b> We do not collect
                  names, phone numbers, email addresses, mailing addresses or
                  other personally identifiable information.
                </li>
                <br />
                <li>
                  <b>Minting Pages:</b> Our minting pages are currently hosted
                  by{" "}
                  <a
                    href="https://manifold.xyz/"
                    target="_blank"
                    rel="noreferrer">
                    manifold.xyz
                  </a>
                  . Their privacy policies may differ from ours.
                </li>
                <br />
                <li>
                  <b>European Residents:</b> Our data is stored in the United
                  States. We do not, at this point, maintain user accounts, nor
                  do we store any personal data associated with an individual.
                </li>
                <br />
                <li>
                  <b>Advertising:</b> We do not currently serve advertising on
                  the website.
                </li>
                <br />
                <li>
                  <b>Minors:</b> This site is not intended for use by
                  individuals under the age of 18.
                </li>
                <br />
                <li>
                  <b>Updates:</b> We may change this policy, at any time, at our
                  sole discretion.
                </li>
              </ol>
            </>
          </Col>
        </Row>
      </Container>
    </>
  );
}
