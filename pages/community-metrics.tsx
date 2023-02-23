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
    { display: "Community Metrics" },
  ]);
  return (
    <>
      <Head>
        <title>Community Metrics | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Community Metrics | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/community-metrics`}
        />
        <meta property="og:title" content="Community Metrics" />
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
                    <h1>COMMUNITY METRICS</h1>
                  </Col>
                </Row>
                <Row className="pt-3 pb-3">
                  <Col>
                    <p>
                      <b>Background</b>
                    </p>
                    <p>
                      One of our mental models is that NFT collections are
                      publicly readable databases of people with similar
                      interests. For example, we believe that, statistically,
                      people who own The Memes NFTs might be more likely to be
                      interested in the principles of decentralization than
                      average.
                    </p>
                    <p>
                      We further believe that by seeing collector behavior
                      on-chain, we can further delineate different profiles . In
                      other words, someone who bought a few Meme Cards early and
                      then just held them is likely a different psychological
                      profile than an active buyer and seller.
                    </p>
                    <p>
                      We calculate and make available community wide (all of
                      them directly from public blockchain data) and we expect
                      to add more metrics over time. These metrics may be used
                      from time to time by us for allowlists, by others for
                      their own allowlists or by anyone for any purpose
                      whatsoever.
                    </p>
                    <p>
                      No metric is the &apos;correct&apos; metric. They are just
                      different ways to look at the community. We expect to
                      continue to add (but not subtract) metrics over time, in
                      the hope that some might be useful to others.
                    </p>
                    <p>
                      Our current view is that we can consolidate metrics for up
                      to 2 addresses (a hot and a cold wallet) via an on-chain
                      delegation tool. This is something we will review in a
                      future release of these metrics.
                    </p>
                    <p>
                      Note that there is no provision (or planned provision) for
                      staking or locking NFTs. We suggest that people use their
                      NFTs in the normal way they like and the metrics will just
                      reflect their actual actions.
                    </p>
                    <br />
                    <p>
                      <b>Metrics Definitions</b>
                    </p>
                    <p>
                      <b>Cards Collected:</b> This is the total number of The
                      Memes NFTs owned by an address
                    </p>
                    <p>
                      <b>Unique Memes:</b> The total number of unique The Meme
                      NFTs owned by an address
                    </p>
                    <p>
                      <b>Meme Sets:</b> The total number of complete
                      &quot;sets&quot; of The Memes NFTs owned by an address,
                      either for all SZNs or a specific SZN
                    </p>
                    <p>
                      <b>Meme Sets -1:</b> The total number of complete
                      &quot;sets&quot; of The Memes NFTs owned by an address,
                      excluding 1 card
                    </p>
                    <p>
                      <b>Meme Sets -2:</b> The total number of complete
                      &quot;sets&quot; of The Memes NFTs owned by an address,
                      excluding 2 cards
                    </p>
                    <p>
                      <b>Genesis Sets:</b> The total number of complete
                      &quot;sets&quot; of the first three Meme NFTs owned by an
                      address
                    </p>
                    <p>
                      <b>Purchases:</b> Number of NFTs (Memes or Gradient)
                      bought by an address
                    </p>
                    <p>
                      <b>Purchases (ETH):</b> Amount of ETH spent on those NFTs
                      by an address
                    </p>
                    <p>
                      <b>Sales:</b> Number of NFTs (Memes or Gradient) sold by
                      an address
                    </p>
                    <p>
                      <b>Sales (ETH):</b> Amount of ETH received by an address
                      from the NFT sales
                    </p>
                    <p>
                      <b>Transfers In:</b> The number of NFTs (Memes or
                      Gradient) transferred into an address
                    </p>
                    <p>
                      <b>Transfers Out:</b> The number of NFTs (Memes or
                      Gradient) transferred out of an address
                    </p>
                    <p>
                      <b>TDH (unweighted):</b> &quot;Total Days Held&quot; - The
                      total number of days that the NFTs (Memes or Gradients)
                      held in an address have been held by that address. Each
                      NFT-day counts as one. This figured is calculated daily at
                      5PM Coordinated Universal Time (UTC).
                    </p>
                    <p>
                      <b>TDH (unboosted):</b> The TDH calculation above weighted
                      by the size of the card edition, with FirstGM edition size
                      (3,941) being weighted as 1.
                    </p>
                    <p>
                      So for the purposes of this calculation, SeizingJPG with
                      an edition size of 1,000 is weighted as 3.941
                      (3,941/1,000), Nakamoto Freedom is weighted as 13.136
                      (3,941/300) and Gradients are weighted as 39.020
                      (3,941/101)
                    </p>
                    <p>
                      <b>TDH:</b> &quot;TDH (unboosted)&quot; multiplied by a
                      fun qualitative factor based on which NFTS were collected.
                      The boosters are as follows:
                    </p>
                    &#40;1&#41;
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
                      </tbody>
                    </Table>
                    <p>
                      <b>or</b>
                    </p>
                    &#40;2&#41;
                    <Table className={styles.tdhFormulaTable} bordered={false}>
                      <tbody>
                        <tr>
                          <td>A complete set of Meme Cards - 1</td>
                          <td>1.05x</td>
                        </tr>
                        <tr>
                          <td>A complete set of Meme Cards - 2</td>
                          <td>1.04x</td>
                        </tr>
                        <tr>
                          <td>A complete set of Meme Cards - 3</td>
                          <td>1.03x</td>
                        </tr>
                        <tr>
                          <td>A complete set of Meme Cards - 4</td>
                          <td>1.02x</td>
                        </tr>
                        <tr>
                          <td>A complete set of Meme Cards - 5</td>
                          <td>1.01x</td>
                        </tr>
                        <tr>
                          <td>
                            A complete set of genesis cards (cards 1 to 3):
                          </td>
                          <td>1.02x</td>
                        </tr>
                      </tbody>
                    </Table>
                    <p>
                      <b>or</b>
                    </p>
                    &#40;3&#41;
                    <Table className={styles.tdhFormulaTable} bordered={false}>
                      <tbody>
                        <tr>
                          <td>
                            A complete set of genesis cards (cards 1 to 3):
                          </td>
                          <td>1.02x</td>
                        </tr>
                      </tbody>
                    </Table>
                    <p>
                      Each address uses the highest value that it is eligible
                      for from #1, #2 or #3
                    </p>
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
