"use client";

import styles from "@/styles/Home.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import { useSetTitle } from "@/contexts/TitleContext";

export default function CommunityMetricsClient() {
  useSetTitle("Metrics | Network");
  return (
    <Container fluid>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row>
              <Col>
                <h1>
                  <span className="font-lightest">Network</span> Metrics
                </h1>
              </Col>
            </Row>
            <Row className="pt-3 pb-3" id="background">
              <Col>
                <p>
                  <a href="#background">
                    <b>Background</b>
                  </a>
                </p>
                <p>
                  One of our mental models is that NFT collections are publicly
                  readable databases of people with similar interests. For
                  example, we believe that, statistically, people who own The
                  Memes NFTs might be more likely to be interested in the
                  principles of decentralization than average.
                </p>
                <p>
                  We further believe that by seeing collector behavior on-chain,
                  we can further delineate different profiles. In other words,
                  someone who bought a few Meme Cards early and then just held
                  them is likely a different psychological profile than an
                  active buyer and seller.
                </p>
                <p>
                  We calculate and make available community wide (all of them
                  directly from public blockchain data) and we expect to add
                  more metrics over time. These metrics may be used from time to
                  time by us for allowlists, by others for their own allowlists
                  or by anyone for any purpose whatsoever.
                </p>
                <p>
                  No metric is the &apos;correct&apos; metric. They are just
                  different ways to look at the community. We expect to continue
                  to add (but not subtract) metrics over time, in the hope that
                  some might be useful to others.
                </p>
                <p>
                  Our current view is that we can consolidate metrics for up to
                  3 addresses via an on-chain delegation tool. This is something
                  we will review in a future release of these metrics.
                </p>
                <p>
                  Note that there is no provision (or planned provision) for
                  staking or locking NFTs. We suggest that people use their NFTs
                  in the normal way they like and the metrics will just reflect
                  their actual actions.
                </p>
                <p id="definitions" className="pt-3">
                  <a href="#definitions">
                    <b>Metrics Definitions</b>
                  </a>
                </p>
                <p>
                  <b>Cards Collected:</b> This is the total number of The Memes
                  NFTs owned by an address
                </p>
                <p>
                  <b>Unique Memes:</b> The total number of unique The Meme NFTs
                  owned by an address
                </p>
                <p>
                  <b>Meme Sets:</b> The total number of complete
                  &quot;sets&quot; of The Memes NFTs owned by an address, either
                  for all SZNs or a specific SZN
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
                  <b>Purchases:</b> Number of NFTs (Memes or Gradient) bought by
                  an address
                </p>
                <p>
                  <b>Purchases (ETH):</b> Amount of ETH spent on those NFTs by
                  an address
                </p>
                <p>
                  <b>Sales:</b> Number of NFTs (Memes or Gradient) sold by an
                  address
                </p>
                <p>
                  <b>Sales (ETH):</b> Amount of ETH received by an address from
                  the NFT sales
                </p>
                <p>
                  <b>Transfers In:</b> The number of NFTs (Memes or Gradient)
                  transferred into an address
                </p>
                <p>
                  <b>Transfers Out:</b> The number of NFTs (Memes or Gradient)
                  transferred out of an address
                </p>
                <p>
                  <b>TDH (unweighted):</b> &quot;Total Days Held&quot; - The
                  total number of days that the NFTs (Memes or Gradients) held
                  in an address have been held by that address. Each NFT-day
                  counts as one. This figured is calculated daily at 00:00
                  Coordinated Universal Time (UTC).
                </p>
                <p>
                  <b>TDH (unboosted):</b> The TDH calculation above weighted by
                  the size of the card edition, with FirstGM edition size
                  (3,941) being weighted as 1.
                </p>
                <p>
                  So for the purposes of this calculation, SeizingJPG with an
                  edition size of 1,000 is weighted as 3.941 (3,941/1,000),
                  Nakamoto Freedom is weighted as 13.136 (3,941/300) and
                  Gradients are weighted as 39.020 (3,941/101)
                </p>
                <p>
                  <b>TDH:</b> &quot;TDH (unboosted)&quot; multiplied by a fun
                  qualitative factor based on which NFTS were collected. The
                  boosters are as follows:
                </p>
                <h5 className="text-white pt-3" id="tdh-1.3">
                  <a href="#tdh-1.3">
                    <u>TDH 1.3 (March 29, 2024 - present)</u>
                  </a>
                </h5>
                <br />
                <p>
                  Higher of Category A and Category B Boosters, plus Category C
                  Boosters
                </p>
                <p>
                  <u>Category A</u>
                </p>
                <ol>
                  <li>A complete set of all Meme Cards: 1.55x</li>
                  <li>
                    Additional complete set of Meme Cards: 1.02x (up to a
                    maximum of 2 additional sets)
                  </li>
                </ol>
                <p>
                  <u>Category B</u>
                </p>
                These boosts are applied to the total TDH, not just to that
                SZN&apos;s TDH
                <ol>
                  <li>
                    SZN1:
                    <ol type="a">
                      <li>Complete Set: 1.05x or</li>
                      <li>Genesis Set: 1.01x and</li>
                      <li>Nakamoto Freedom: 1.01x</li>
                    </ol>
                  </li>
                  <li>SZN2: Complete Set: 1.05x</li>
                  <li>SZN3: Complete Set: 1.05x</li>
                  <li>SZN4: Complete Set: 1.05x</li>
                  <li>SZN5: Complete Set: 1.05x</li>
                  <li>SZN6: Complete Set: 1.05x</li>
                  <li>SZN7: Complete Set: 1.05x</li>
                  <li>SZN8: Complete Set: 1.05x</li>
                  <li>SZN9: Complete Set: 1.05x</li>
                  <li>SZN10: Complete Set: 1.05x</li>
                  <li>SZN11: Complete Set: 1.05x</li>
                </ol>
                <p>
                  <u>Category C</u>
                </p>
                <ol>
                  <li>
                    Gradient: 1.02x per Gradient (up to a maximum of 3
                    Gradients)
                  </li>
                </ol>
                <h5 className="text-white pt-3" id="tdh-1.2">
                  <a href="#tdh-1.2">
                    <u>TDH 1.2 (December 30, 2023 - March 28, 2024)</u>
                  </a>
                </h5>
                <br />
                <p>
                  Higher of Category A and Category B Boosters, plus Category C
                  Boosters
                </p>
                <p>
                  <u>Category A</u>
                </p>
                <ol>
                  <li>A complete set of all Meme Cards: 1.25x</li>
                  <li>
                    Additional complete set of Meme Cards: 1.02x (up to a
                    maximum of 2 additional sets)
                  </li>
                </ol>
                <p>
                  <u>Category B</u>
                </p>
                These boosts are applied to the total TDH, not just to that
                SZN&apos;s TDH
                <ol>
                  <li>
                    SZN1:
                    <ol type="a">
                      <li>Complete Set: 1.05x or</li>
                      <li>Genesis Set: 1.01x and</li>
                      <li>Nakamoto Freedom: 1.01x</li>
                    </ol>
                  </li>
                  <li>SZN2: Complete Set: 1.05x</li>
                  <li>SZN3: Complete Set: 1.05x</li>
                  <li>SZN4: Complete Set: 1.05x</li>
                  <li>SZN5: Complete Set: 1.05x</li>
                </ol>
                <p>
                  <u>Category C</u>
                </p>
                <ol>
                  <li>
                    Gradient: 1.02x per Gradient (up to a maximum of 3
                    Gradients)
                  </li>
                  <li>
                    Identity: Boosts can be earned for both a&#41; and b&#41;
                    below:
                    <ol type="A">
                      <li>
                        1.03x on any address that is part of an active Seize
                        profile
                      </li>
                      <li>
                        1.01x for having an ENS domain/subdomain active on all
                        addresses in a consolidation
                      </li>
                    </ol>
                  </li>
                </ol>
                <h5 className="text-white pt-3" id="tdh-1.1">
                  <a href="#tdh-1.1">
                    <u>TDH 1.1 (July 14, 2023 - December 29, 2023)</u>
                  </a>
                </h5>
                <br />
                <p>
                  Higher of Category A and Category B Boosters, plus Category C
                  Boosters
                </p>
                <p>
                  <u>Category A</u>
                </p>
                <ol>
                  <li>A complete set of all Meme Cards: 1.20x</li>
                  <li>
                    Additional complete set of Meme Cards: 1.02x (up to a
                    maximum of 2 additional sets)
                  </li>
                </ol>
                <p>
                  <u>Category B</u>
                </p>
                <ol>
                  <li>
                    SZN1:
                    <ol type="a">
                      <li>Complete Set: 1.05x or</li>
                      <li>Genesis Set: 1.01x and</li>
                      <li>Nakamoto Freedom: 1.01x</li>
                    </ol>
                  </li>
                  <li>SZN2: Complete Set: 1.05x</li>
                  <li>SZN3: Complete Set: 1.05x</li>
                  <li>SZN4: Complete Set: 1.05x</li>
                </ol>
                <p>
                  <u>Category C</u>
                </p>
                <ol>
                  <li>
                    Gradient: 1.02x per Gradient (up to a maximum of 3
                    Gradients)
                  </li>
                  <li>
                    1.02x for having an ENS domain/subdomain active on all
                    addresses in a consolidation. The purpose of this boost is
                    to improve legibility of the collector profiles. The ENS
                    domain can be anonymous or pseudo.
                  </li>
                </ol>
                <br />
                <br />
                <h5 className="text-white pt-3" id="tdh-1.0">
                  <a href="#tdh-1.0">
                    <u>TDH 1.0 (January 30, 2023 - July 13, 2023)</u>
                  </a>
                </h5>
                <br />
                <table className={styles.communityMetricsTable}>
                  <tbody>
                    <tr>
                      <th colSpan={2}>&#40;1&#41;</th>
                    </tr>
                    <tr>
                      <td>A complete set of Meme Cards</td>
                      <td>1.20x</td>
                    </tr>
                    <tr>
                      <td>+ 0.02x for each additional Meme Card set</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>and</td>
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
                    <tr>
                      <th colSpan={2}>
                        <b>or</b>
                      </th>
                    </tr>
                    <tr>
                      <th colSpan={2}>&#40;2&#41;</th>
                    </tr>
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
                      <td>A complete set of genesis cards (cards 1 to 3)</td>
                      <td>1.02x</td>
                    </tr>
                    <tr>
                      <th colSpan={2}>
                        <b>or</b>
                      </th>
                    </tr>
                    <tr>
                      <th colSpan={2}>&#40;3&#41;</th>
                    </tr>
                    <tr>
                      <td>A complete set of genesis cards (cards 1 to 3):</td>
                      <td>1.02x</td>
                    </tr>
                  </tbody>
                </table>
                <p className="pt-3">
                  Each address uses the highest value that it is eligible for
                  from #1, #2 or #3
                </p>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
