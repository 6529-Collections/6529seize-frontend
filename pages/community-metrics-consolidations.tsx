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
    { display: "Community Metrics - Consolidations" },
  ]);
  return (
    <>
      <Head>
        <title>Community Metrics - Consolidations | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Community Metrics - Consolidations | 6529 SEIZE"
        />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/community-metrics-consolidations`}
        />
        <meta
          property="og:title"
          content="Community Metrics - Consolidations"
        />
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
                    <h1>COMMUNITY METRICS - CONSOLIDATIONS</h1>
                  </Col>
                </Row>
                <Row className="pt-3 pb-3">
                  <Container>
                    <Row>
                      <Col>
                        <h2>Use Case 1</h2>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <p>Scenario</p>
                        <ul>
                          <li>I have 3 wallets</li>
                          <li>I move my cards between the 3 wallets</li>
                          <li>
                            At any point in time any card can be in any of the 3
                            wallets
                          </li>
                        </ul>
                        <p>Solution</p>
                        <ul>
                          <li>
                            Consolidate
                            <ul>
                              <li>WalletA&harr;WalletB</li>
                              <li>WalletB&harr; WalletC</li>
                              <li>WalletC&harr;WalletA</li>
                            </ul>
                          </li>
                          <li>No TDH will be lost at any point</li>
                        </ul>
                      </Col>
                    </Row>
                  </Container>
                  <Container className="pt-5">
                    <Row>
                      <Col>
                        <h2>Use Case 2</h2>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <p>Scenario</p>
                        <ul>
                          <li>
                            I used to have my cards in my hot wallet (WalletA)
                          </li>
                          <li>
                            I moved all my cards to my cold wallet (WalletB)
                          </li>
                          <li>
                            I am now minting cards from my new hot wallet
                            (WalletC) and tranferring them to WalletB some days
                            later
                          </li>
                        </ul>
                        <p>Solution</p>
                        <ul>
                          <li>
                            Consolidate
                            <ul>
                              <li>WalletA&harr;WalletB</li>
                              <li>WalletB&harr; WalletC</li>
                              <li>WalletC&harr;WalletA</li>
                            </ul>
                          </li>
                          <li>
                            No TDH will be lost for days that cards remain in
                            WalletC before being tranferred to WalletB
                          </li>
                        </ul>
                      </Col>
                    </Row>
                  </Container>
                  <Container className="pt-5">
                    <Row>
                      <Col>
                        <h2>Use Case 3</h2>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <p>Scenario</p>
                        <ul>
                          <li>
                            I used to have my cards in my hot wallet (WalletA)
                            and accrued significant TDH
                          </li>
                          <li>
                            WalletA was compromised so I moved my cards to a new
                            temporary wallet (WalletB)
                          </li>
                          <li>
                            I moved all my cards from WalletB to my cold wallet
                            (WalletC)
                          </li>
                          <li>
                            I am now minting cards from my new hot wallet
                            (WalletD) and tranferring them to WalletC some days
                            later
                          </li>
                          <li>
                            Note: I still have access to WalletA (otherwise you
                            can't call delegation contract as WalletA so you
                            can't prove ownership)
                          </li>
                        </ul>
                        <p>Best Solution</p>
                        <ul>
                          <li>
                            Consolidate
                            <ul>
                              <li>WalletA&harr;WalletB</li>
                              <li>WalletB&harr; WalletC</li>
                              <li>WalletC&harr;WalletA</li>
                            </ul>
                          </li>
                          <li>
                            TDH from when cards used to be in WalletA will be
                            counted
                          </li>
                          <li>
                            TDH will be lost for the days that cards remain in
                            WalletD before being tranferred to WalletC
                          </li>
                        </ul>
                        <p>Alternative Solution 1</p>
                        <ul>
                          <li>
                            Consolidate
                            <ul>
                              <li>WalletB&harr;WalletC</li>
                              <li>WalletC&harr; WalletD</li>
                              <li>WalletD&harr;WalletB</li>
                            </ul>
                          </li>
                          <li>
                            TDH will be lost for the days that cards were in
                            wallet A
                          </li>
                          <li>
                            No TDH will be lost for the days the cards remain in
                            WalletD before tranferring them to WalletC
                          </li>
                        </ul>
                        <p>Alternative Solution 2</p>
                        <ul>
                          <li>
                            Consolidate
                            <ul>
                              <li>WalletA&harr;WalletB</li>
                              <li>WalletA&harr;WalletC</li>
                              <li>WalletA&harr;WalletD</li>
                              <li>WalletB&harr;WalletC</li>
                              <li>WalletB&harr;WalletD</li>
                              <li>WalletC&harr;WalletD</li>
                            </ul>
                          </li>
                          <li>
                            TDH will not be lost for any of the days
                            <ul>
                              <li>
                                If in reality only Wallets C,D can actually hold
                                cards right now (i.e. WalletA is emptied,
                                WalletB was temporary and not being used
                                anymore) then there shouldn't be any issue apart
                                from having to cross-consolidate all wallets
                                between them (?)
                              </li>
                              <br />
                              <li>
                                Imagine the scenario was a bit different like I
                                still have cards in all wallets eg 2 cards in
                                WalletA and 10 cards in each of the other 3
                                wallets
                              </li>
                              <li>
                                At this point the consolidation limit of 3
                                wallets still applies so I can only get TDH in a
                                consolidation from 3 wallet owners so the
                                consolidation is actually between WalletB,
                                WalletC, WalletD (since these would have the top
                                3 TDH out of the 4 wallets)
                              </li>
                              <li>
                                Cards that used to be in WalletA and now are in
                                any of the other wallets will have any TDH
                                accrued within WalletA tranferred and counted
                                towards the WalletB, WalletC, WalletD
                                consolidation
                              </li>
                              <li>
                                Note: At this point although WalletA 'donated'
                                some TDH to other wallets, it would appear as
                                it's own entry within the consolidated TDH table
                                i.e. from the setup above the following 2
                                entries are added to consolidated table:
                                <ul>
                                  <li>Consolidation of Wallets B,C,D</li>
                                  <li>WalletA</li>
                                </ul>
                              </li>
                              <br />
                              <li>
                                Extra Scenario:
                                <ul>
                                  <li>
                                    5 dodgy people try to cheat the system by
                                    coming together and forming a consolidation
                                    between their 5 wallets and do the necessary
                                    cross-consolidations on the delegation
                                    contract between them
                                  </li>
                                  <li>All 5 wallets hold some cards</li>
                                </ul>
                              </li>
                              <li>
                                Solution:
                                <ul>
                                  <li>
                                    TDH is calculated for each wallet on its own
                                  </li>
                                  <li>
                                    The 3 highest TDH values are selected to be
                                    actually consolidated (eg. Wallets 1,2,3)
                                  </li>
                                  <li>
                                    Any cards previously held in either Wallets
                                    4 or 5 and now are in Wallets 1,2,3 will
                                    have the TDH carried over and counted
                                    towards consolidated 1,2,3 TDH{" "}
                                  </li>
                                  <li>
                                    Entries in consolidated table:
                                    <ul>
                                      <li>Consolidation 1,2,3</li>
                                      <li>Wallet4</li>
                                      <li>Wallet5</li>
                                    </ul>
                                  </li>
                                </ul>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </Col>
                    </Row>
                  </Container>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
}
