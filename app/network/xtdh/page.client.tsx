"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
export default function XTDHMainPage() {
  useSetTitle("xTDH | Network");

  return (
    <Container className="tw-min-h-screen tw-pt-12 tw-pb-12">
      <Row>
        <Col>
          <h1>xTDH</h1>
          <p className="tw-mt-2">
              xTDH is an extension of <Link href="/network/tdh">TDH</Link> which helps to include other NFT holders to 6529 ecosystem and offer them all the benefits of TDH.
          </p>
          <p className="tw-mt-2">
              I tracks:
              <ol>
                  <li>How much your memes produce</li>
                  <li>How much xTDH you <b>receive</b> from grants on tokens you own</li>
                  <li>How much xTDH you’ve <b>given</b> away via grants</li>
              </ol>
          </p>
          <p className="tw-mt-2">
              Your total xTDH balance increases every day at midnight based on these rules.
          </p>


          <div className="tw-mt-8 tw-space-y-2">
            <h2>Produced xTDH (from your Memes)</h2>
            <p className="tw-mt-2">
              Every meme you hold that produces TDH also produces xTDH. So every midnight you produce TDH you also produce xTDH following this formula:
            </p>
            <p className="tw-pt-3"><pre>produced_xTDH_today = (TDH gained today) × xTDH_coefficient</pre></p>
            <p className="tw-mt-2">xTDH_coefficient is currently set to 0.1, but is subject to change in the future.</p>
          </div>

          <div className="tw-mt-8 tw-space-y-2">
            <h2>Received xTDH (from grants on tokens you own)</h2>
            <p className="tw-mt-2">
                A grant lets someone “give away” a portion of their xTDH produced in the future to *all or some* tokens in an ERC721 collection.
                If you own a token that has active grants, you receive a portion of those grants every day.
            </p>
            <h2>How much do you receive?</h2>
            <p className="tw-mt-2">
                Each grant has:
                <ol>
                    <li>rate</li>
                    <li>denominator</li>
                </ol>
            </p>
            <p className="tw-mt-2">
              Denominator can be configured as:
              <ol>
                  <li>Full - grant every token in the collection (in which case denominator is total supply)</li>
                  <li>Partial - grant a specific set of tokens in a collection (in which case denominator is number of those tokens)</li>
              </ol>
            </p>
            <p className="tw-mt-2">
                  Each token receives:
            </p>
            <p className="tw-pt-3"><pre>grant_amount_per_token = rate / denominator</pre></p>
            <p className="tw-mt-2">You receive this amount **only for the time you actually owned the token**, and only while the grant was active.</p>
            <p className="tw-mt-2">First increment will be given out when on midnight when at least 24 hours have passed since start of the grant and at least 24 hours has passed since you acquired the token.</p>
            <h2>Ownership boundaries matter</h2>
            <p className="tw-mt-2">Just like with TDH, "transfers" inside the same consolidation group <b>do not reset</b> the ownership window. Sales or transfers across groups <b>do</b>.</p>
            <p className="tw-mt-2">If you sell your token then the xTDH does not transfer with it. It goes back to the grantor.</p>
          </div>
          <div className="tw-mt-8 tw-space-y-2">
            <h2>Granted out xTDH (what you give away)</h2>
            <p className="tw-mt-2">You can't give away xTDH which is already pinned to your identity, but you can give away future xTDH earnings via grants. You can give away it all or some part of it. The total amount you are giving away is calculated like this:</p>
            <p className="tw-mt-2">
            <ol>
                <li>
                    sum up all grant rates which have been active for at least 24h
                </li>
                <li>
                    sum up all portions of grantees who have been holding the token less than 24h
                </li>
                <li>subtract the latter from former</li>
            </ol>
            </p>
          </div>
          <div className="tw-mt-8 tw-space-y-2">
            <h2>Your daily xTDH rate</h2>
            <p className="tw-mt-2"><pre>xtdh_rate = produced_today - granted_out_today + received_today</pre></p>
            <p className="tw-mt-2">... and ...</p>
            <p className="tw-mt-2"><pre>xtdh_total = xtdh_total_previous + xtdh_rate</pre></p>
            <h2>Example:</h2>
            <p className="tw-mt-2">If today you:</p>
            <ol>
                <li>produce 20 xTDH</li>
                <li>have grants giving away 5 xTDH</li>
                <li>receive 3 xTDH from grants on tokens you own</li>
            </ol>
            <p className="tw-mt-2">Then:</p>
            <p className="tw-mt-2"><pre>xtdh_rate = 20 - 5 + 3 = 18 xTDH</pre></p>
          </div>
          <div className="tw-mt-8 tw-space-y-2">
            <h2>Can xTDH ever get lost?</h2>
            <p className="tw-mt-2">No. All the produced xTDH always goes to someone. It never vanishes. If a grantee sells their token then the xTDH they had gained goes back to the grantor.</p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
