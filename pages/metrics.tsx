import Head from "next/head";
import styles from "../styles/Home.module.scss";
import dynamic from "next/dynamic";
import { Container, Row, Col, Table } from "react-bootstrap";
import Breadcrumb, { Crumb } from "../components/breadcrumb/Breadcrumb";
import { useState } from "react";
import Image from "next/image";
import HeaderPlaceholder from "../components/header/HeaderPlaceholder";

const Header = dynamic(() => import("../components/header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

export default function TDH() {
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[]>([
    { display: "Home", href: "/" },
    { display: "TDH" },
  ]);
  return (
    <>
      <Head>
        <title>Metrics | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Metrics | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/metrics`}
        />
        <meta property="og:title" content="Metrics" />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>

      <main className={`${styles.main} ${styles.tdhMain}`}>
        <Header />
        <Breadcrumb breadcrumbs={breadcrumbs} />
        <Container fluid className={styles.mainContainer}>
          <Row>
            <Col>
              <Container className="pt-4">
                <Row>
                  <Col>
                    <h1>TOTAL DAYS HODLed - TDH</h1>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <span>
                      <b>TDH</b> is a metric of commitment to the Gradient/Meme
                      Cards ecosystem. It is calculated every day, for every ETH
                      address that holds a Gradient or Meme Card, and made
                      programmatically available to the public.
                    </span>
                    <span>
                      It can be used by ecosystem participants to easily
                      identify high commitment members of the community for a
                      variety of purposes: airdrops, allowlists, communication,
                      group coordination, qualified voting, content moderation
                      and so on.
                    </span>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col>
                    <span>
                      <h3>Scope</h3>
                    </span>
                    <ul>
                      <li className="mt-1">
                        <a href="/the-memes?sort=age&sort_dir=ASC">
                          The Memes by 6529
                        </a>
                      </li>
                      <li className="mt-1">
                        <a href="/6529-gradient?sort=id&sort_dir=ASC">
                          6529 Gradient
                        </a>
                      </li>
                    </ul>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col
                    xs={{ span: 12 }}
                    sm={{ span: 12 }}
                    md={{ span: 12 }}
                    lg={{ span: 6 }}>
                    <h3>Basic Algorithm</h3>

                    <ul>
                      <li className="mt-1">
                        Daily, at 5PM Coordinated Universal Time (UTC), identify
                        all ETH addresses that hold a Gradient or Meme Card
                      </li>
                      <li className="mt-1">
                        Sum the number of full days (24 hours) each NFT has been
                        in that address
                      </li>
                      <li className="mt-1">
                        For 1155 NFTs, use the longest (most favorable) count.
                        For example, if wallet 0x has the following pattern:
                      </li>
                      <ul>
                        <li className="mt-1">
                          Oct 1: bought a Nakamoto Meme Card
                        </li>
                        <li className="mt-1">
                          Oct 2: bought a second Nakamoto Meme Card
                        </li>
                        <li className="mt-1">
                          Oct 3: Sold a Nakamoto Meme Card
                        </li>
                        <li className="mt-1">
                          Oct 4: The TDH is 3: Oct 4 less Oct 1 (the most
                          favorable transfer in date)
                        </li>
                      </ul>
                      <li className="mt-1">Apply the HODLing rate per NFT</li>
                      <li className="mt-1">
                        Apply the Address Boosters per wallet
                      </li>
                    </ul>
                  </Col>
                  <Col
                    className="text-center"
                    xs={{ span: 12 }}
                    sm={{ span: 12 }}
                    md={{ span: 12 }}
                    lg={{ span: 6 }}>
                    <Image
                      width="0"
                      height="0"
                      style={{
                        height: "auto",
                        width: "auto",
                        maxHeight: "300px",
                      }}
                      src="/intern.png"
                      alt="intern"
                    />
                  </Col>
                </Row>
                <Row className="pt-5">
                  <Col>
                    <h1>TDH FORMULA</h1>
                  </Col>
                </Row>
                <Row className="pt-3">
                  <Col
                    xs={{ span: 12 }}
                    sm={{ span: 12 }}
                    md={{ span: 12 }}
                    lg={{ span: 6 }}>
                    <span>
                      <h3>
                        <u>
                          Step 1: <b>HODLing Rate (HR)</b>
                        </u>
                      </h3>
                    </span>

                    <span>
                      The <b>HODLing Rate</b> is adjusted for edition size
                    </span>
                    <ul>
                      <li className="mt-1">
                        The NFT with largest edition size is set as{" "}
                        <b>HODLing Index</b>
                      </li>
                      <ul>
                        <li className="mt-1">
                          The current <b>HODLing INDEX</b> is the{" "}
                          <a href="/the-memes/8">FirstGM</a> card with edition
                          size of 3941
                        </li>
                        <li className="mt-1">
                          The edition size of 6529 Gradient Collection is 101
                        </li>
                      </ul>
                      <li className="mt-1">
                        <a href="/the-memes/8">FirstGM</a> cards accrue 1 TDH
                        per day, per card
                      </li>
                      <li className="mt-1">
                        All other NFTs accrue TDH at a higher rate based on the
                        following formula:
                        <br />
                        <span className={`mt-3 ${styles.tdhFormula}`}>
                          <b>HODLing INDEX</b> edition size / NFT edition size
                        </span>
                      </li>
                      <li className="mt-1">Examples:</li>
                      <ol>
                        <li className="mt-1">
                          <a href="/the-memes/1">6529Seizing</a>
                        </li>
                        <ul>
                          <li className="mt-1">Edition Size: 1000</li>
                          <li className="mt-1">
                            HODLing Rate: 3941/1000 = 3.941
                          </li>
                          <li className="mt-1">
                            i.e. <a href="/the-memes/1">6529Seizing</a> accrues
                            TDH at a rate of 3.941 per day, per card
                          </li>
                        </ul>
                        <li className="mt-1">
                          <a href="/the-memes/34">GM Indonesia</a>
                        </li>
                        <ul>
                          <li className="mt-1">Edition Size: 369</li>
                          <li className="mt-1">
                            HODLing Rate: 3941/369 = 10.68
                          </li>
                          <li className="mt-1">
                            i.e. <a href="/the-memes/34">GM Indonesia</a>{" "}
                            accrues TDH at a rate of 10.68 per day, per card
                          </li>
                        </ul>
                        <li className="mt-1">
                          <a href="/6529-gradient?sort=id&sort_dir=ASC">
                            6529 Gradient
                          </a>
                        </li>
                        <ul>
                          <li className="mt-1">Edition Size: 101</li>
                          <li className="mt-1">
                            HODLing Rate: 3941/101 = 39.02
                          </li>
                          <li className="mt-1">
                            i.e. Each 6529 Gradient accrues TDH at a rate of
                            39.02 per day, per gradient
                          </li>
                        </ul>
                      </ol>
                    </ul>
                  </Col>
                  <Col
                    xs={{ span: 12 }}
                    sm={{ span: 12 }}
                    md={{ span: 12 }}
                    lg={{ span: 6 }}>
                    <span>
                      <h3>
                        <u>
                          Step 2: <b>Address Boosters (AB)</b>
                        </u>
                      </h3>
                    </span>

                    <span>
                      Address Boosters are multipliers for the TDH, calculated
                      for each address
                    </span>
                    <Table className={styles.tdhFormulaTable} bordered={false}>
                      <tbody>
                        <tr>
                          <td>A complete set of Meme Cards</td>
                          <td>1.20x</td>
                        </tr>
                        <tr>
                          <td>+ 0.02x for each additional Meme Card set and</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>+ 0.02x for each Gradient</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>with a max of 1.30x</td>
                          <td></td>
                        </tr>
                        <tr className="pt-5">
                          <td>A complete set of Meme Cards - 1</td>
                          <td>1.05x</td>
                        </tr>
                        <tr className="pt-5">
                          <td>A complete set of Meme Cards - 2</td>
                          <td>1.04x</td>
                        </tr>
                        <tr className="pt-5">
                          <td>A complete set of Meme Cards - 3</td>
                          <td>1.03x</td>
                        </tr>
                        <tr className="pt-5">
                          <td>A complete set of Meme Cards - 4</td>
                          <td>1.02x</td>
                        </tr>
                        <tr className="pt-5">
                          <td>A complete set of Meme Cards - 5</td>
                          <td>1.01x</td>
                        </tr>
                        <tr className="pt-5">
                          <td>
                            A complete set of genesis cards (cards 1 to 3):
                          </td>
                          <td>1.02x</td>
                        </tr>
                      </tbody>
                    </Table>
                    <span>
                      Each address uses the highest value that it is eligible
                      for, given the above.
                    </span>
                    <span>In other words, the Boosters are not additive</span>
                    <span>
                      Example{" "}
                      <ul>
                        <li>
                          <span>
                            An address has a <b>TDH</b> of 100. If it contains a
                            set of genesis cards, its <b>TDH</b> becomes 102
                          </span>
                        </li>
                      </ul>
                    </span>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
