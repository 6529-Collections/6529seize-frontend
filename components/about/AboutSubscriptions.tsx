import { Col, Container, Row } from "react-bootstrap";

export default function AboutSubscriptions() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            Subscription Minting
          </h1>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <p className="font-larger font-bolder">Overview</p>
          <ul>
            <li className="mt-2">
              Subscription Minting is another way to mint Meme Cards
              <ul>
                <li className="mt-1">
                  With up to 98% significant gas savings and/or
                </li>
                <li className="mt-1">
                  While being away from your computer at the time of mint and/or
                </li>
                <li className="mt-1">
                  On a &quot;set it and forget it&quot; basis for whole SZNs
                </li>
              </ul>
            </li>
            <li className="mt-2">
              Subscriptions are not a mintpass:
              <ul>
                <li className="mt-1">
                  You can decide to mint or not mint any specific Meme Card
                </li>
                <li className="mt-1">
                  Subscriptions respect the allowlist and phase process: A
                  subscription only allows you to mint within the Phase you
                  would otherwise be eligible for
                </li>
                <li className="mt-1">
                  It is better to think about subscriptions as &quot;remote
                  minting&quot;
                </li>
              </ul>
            </li>
            <li className="mt-2">
              Subscriptions are not a replacement for the regular minting
              process:
              <ul>
                <li className="mt-1">
                  You can still mint in the normal manner if you don&apos;t
                  subscribe
                </li>
                <li className="mt-1">
                  Subscriptions are an alternative method of minting for those
                  who choose to use them
                </li>
              </ul>
            </li>
          </ul>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <p className="font-larger font-bolder">How it Works</p>
          <ul>
            <li className="mt-2">
              Fill Balance
              <ul>
                <li className="mt-1">
                  You can top up your minting balance at any time by sending ETH
                  to: seize.6529.eth from any wallet of your consolidation
                </li>
                <li className="mt-1">
                  Any amount sent to seize.6529.eth is{" "}
                  <b>completely non-refundable</b>: you can choose which cards
                  to mint but we do not have the capacity to send ETH back
                </li>
                <li className="mt-1">
                  The calculator on your profile will calculate the correct
                  amount to send for any number of cards, with options for the
                  remainder of the SZN and remainder of the year
                </li>
                <li className="mt-1">
                  The balance will appear on the site profile associated with
                  the sending ETH address
                </li>
                <li className="mt-1">
                  Top ups must be received by 00:00 UTC (eg, 19:00 EST) the day
                  before the Meme Card mint to be eligible for the mint;
                  otherwise they will roll over to the next mint
                </li>
              </ul>
            </li>
            <li className="mt-2">
              Minting
              <ul>
                <li className="mt-1">
                  Automatic Mode: By default, you will auto-mint (get airdrop
                  for) as many Meme Cards as you are eligible for, until your
                  balance is used
                </li>
                <li className="mt-1">
                  You can choose to opt-out of any Meme Card mint:
                  <ul>
                    <li className="mt-1">
                      You must turn off minting for that specific drop before
                      00:00 UTC (eg, 19:00 EST) the day before the mint
                    </li>
                    <li className="mt-1">
                      The card reveal will move forward one day so that you can
                      see the card before making a decision to mint it or not
                    </li>
                    <li className="mt-1">
                      This means that you can opt out on Sunday (for
                      Monday&apos;s card), Tuesday (for Wednesday&apos;s card)
                      and Thursday (for Friday&apos;s card)
                    </li>
                  </ul>
                </li>
                <li className="mt-1">
                  You can choose to move your whole profile to
                  &quot;manual&quot; as opposed to &quot;automatic&quot;: in
                  this case, you will not mint any cards unless you manully
                  opt-in to the specific cards you want to selectively mint
                </li>
              </ul>
            </li>
            <li className="mt-2">
              Delegation
              <ul>
                <li className="mt-1">
                  Your card will be airdropped according on the following
                  criteria:
                </li>
                <li className="mt-1">
                  If no delegation, to the primary address of a consolidation
                </li>
                <li className="mt-1">
                  If no consolidation, to the address you send the ETH from
                </li>
                <li className="mt-1">
                  If there is a delegation, in this order:
                  <ul>
                    <li className="mt-1">
                      The delegated address for The Memes for use case
                      &quot;Airdrop&quot;
                    </li>
                    <li className="mt-1">
                      The delegated address for The Memes for use case
                      &quot;All&quot;
                    </li>
                    <li className="mt-1">
                      The delegated address for Any Collection for use case
                      &quot;Airdrop&quot;
                    </li>
                    <li className="mt-1">
                      The delegated address for Any Collection for use case
                      &quot;All&quot;
                    </li>
                  </ul>
                </li>
                <li className="mt-1">
                  If you have the suggested TAP configuration with a
                  vault/warm/hot consolidation with your vault delegating ALL to
                  warm or hot, and you would like your airdrops directly to your
                  vault, we recommend:
                  <ul>
                    <li className="mt-1">
                      sending ETH to seize.6529.eth from warm or hot address
                    </li>
                    <li className="mt-1">
                      adding delegation use-case &quot;Airdrop&quot; for the
                      &quot;The Memes&quot; from that address to your vault
                    </li>
                  </ul>
                </li>
                <li className="mt-1">
                  If you have a single address (not consolidated) that has
                  delegated &quot;All&quot; to a minting address and you want to
                  send ETH from the original address and have the airdrop
                  received by that same address, then you should change your
                  delegation to &quot;Minting&quot; otherwise the airdrop will
                  go to your minting address
                </li>
              </ul>
            </li>
            <li className="mt-2">
              Allowlists and Phases
              <ul>
                <li className="mt-1">
                  Subscription Minting respects the same Allowlist and Phases as
                  regular minting
                </li>
                <li className="mt-1">
                  If you are in Phase 0, subscription minting will automatically
                  airdrop you the card at the beginning of Phase 0: since Phase
                  0 is underallocated, you are guaranteed a mint
                </li>
                <li className="mt-1">
                  If you are eligible for Phase 1 or Phase 2, you will be
                  airdropped the card at the beginning of Phase 1 or Phase 2
                  <ul>
                    <li className="mt-1">
                      In the event that no cards are available to mint in that
                      phase, you will not be airdropped the card and your
                      balance will remain available
                    </li>
                    <li className="mt-1">
                      In the event that at the beginning of a Phase, there are
                      more subscription mints than available cards, the cards
                      will be airdropped in order of when the subscription
                      payment was received
                    </li>
                  </ul>
                </li>
                <li className="mt-1">
                  As with regular minting methods, you are only guaranteed a
                  mint in Phase 0
                </li>
                <li className="mt-1">
                  For popular mints, your opportunity will be determined by your
                  phase, how many other subscription mints are in place for that
                  mint, and when you subscribed relative to other subscribers
                </li>
              </ul>
            </li>
          </ul>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <p className="font-larger font-bolder">Gas Savings</p>
          <ul>
            <li className="mt-2">
              Meme Cards are relatively inexpensive (0.06529 ETH) so in periods
              of high Ethereum gas, minting costs can become a substantial % of
              the card&apos;s cost
              <ul>
                <li className="mt-1">
                  At gwei of 20, they make up 3.4% of the card&apos;s cost
                </li>
                <li className="mt-1">
                  At gwei of 200, they make up 33.7% of the card&apos;s cost
                </li>
              </ul>
            </li>
            <li className="mt-2">
              ETH transfers are the lowest cost transaction on the Ethereum
              network
              <ul>
                <li className="mt-1">
                  Someone who subscription-mints 1 card at a time will save
                  approximately 80% in gas costs
                </li>
                <li className="mt-1">
                  Someone who subscription-mints 10 cards at a time (with one
                  ETH transfer) will save approximately 98% in gas costs
                </li>
              </ul>
            </li>
            <li className="mt-2">
              The Memes will absorb the gas cost of the airdrop internally, so
              it will not be charged to the collector
            </li>
          </ul>
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <p className="font-larger font-bolder">Remote Minting</p>
          <ul>
            <li className="mt-2">
              Many collectors have busy schedules and may not be able to be
              available three times per week at the time of the mint, due to
              personal or professional commitments
            </li>
            <li className="mt-2">
              Subscription minting allows them to separate the decision of if
              they should mint a series of Meme Cards or a specific Meme Card
              from the specific time of the mint
            </li>
            <li className="mt-2">
              This is a benefit to all collectors, but especially to those who
              live in time zones that do not overlap well with the minting time
            </li>
          </ul>
        </Col>
      </Row>
    </Container>
  );
}
