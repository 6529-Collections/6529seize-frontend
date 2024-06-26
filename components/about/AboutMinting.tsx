import { Col, Container, Row } from "react-bootstrap";
import { MEMES_MINTING_HREF } from "../../constants";

export default function AboutMinting() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Minting</span> Meme Cards
          </h1>
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p>
            <b>Summary</b>
          </p>
          <ul>
            <li>
              Meme Cards are minted (primary sale) when the art for the next
              Meme Card is ready
            </li>
            <br />
            <li>
              Currently, this is about 3 times per week, but the frequency has
              varied in the past and will vary in the future
            </li>
            <br />
            <li>
              The minting website for The Memes is:{" "}
              <a href={MEMES_MINTING_HREF} target="_blank" rel="noreferrer">
                {MEMES_MINTING_HREF}
              </a>
            </li>
            <br />
            <li>There is no other minting website for The Memes</li>
            <br />
            <li>The current minting price is 0.06529ETH + gas costs</li>
            <br />
            <li>
              Minting time and dates are announced on{" "}
              <a
                href="https://twitter.com/6529collections"
                target="_blank"
                rel="noreferrer">
                https://twitter.com/6529collections
              </a>
            </li>
            <br />
            <li>
              Currently, the mints are happening Mon/Wed/Fri at 11am ET (4pm
              UTC), but times may vary. Please follow &#64;
              <a
                href="https://twitter.com/6529collections"
                target="_blank"
                rel="noreferrer">
                6529collections
              </a>{" "}
              for details
            </li>
            <br />
            <li>
              The Memes generally mint using an allowlist model. The purpose of
              the allowlist is to avoid gas wars / bot wars and to give as broad
              a range of people as possible a chance to mint.
            </li>
            <br />
            <li>
              A collector of one or more The Memes NFT should not assume they
              receive an allowlist spot for multiple reasons:
              <ul>
                <br />
                <li>
                  There are many more collectors of The Memes NFTs than there
                  are allowlist spots.
                </li>
                <br />
                <li>
                  The allowlist approach is constantly changing and may, in the
                  future, move to a completely different model, if a better
                  approach emerges.
                </li>
                <br />
                <li>
                  Buy The Memes that you like, because you like holding the art
                  or feel a sense of identity with the mission. Do not buy them
                  for an allowlist spot.
                </li>
              </ul>
            </li>
            <br />
            <li>
              There is quite a bit of thought that goes into the allowlist
              process. Read below to learn more.
            </li>
          </ul>
          <br />
          <p>
            <b>Philosophy of The Memes Minting</b>
          </p>
          <ul>
            <li>
              Mints for well-known collections where demand may exceed supply
              are very difficult to manage effectively. The main approaches and
              our views on them are highlighted below.
            </li>
            <br />
            <li>
              Public Mints: Public unrestricted mints will be won by a small
              number of parties using bots and paying high gas fees. We have
              rejected this approach because it is obviously a terrible idea.
            </li>
            <br />
            <li>
              Raise Prices (either directly or through auctions): The benefit of
              higher prices is that they help avoid gas wars and return much
              more money to the artists and creators. The downside is that it
              makes the project accessible only to wealthy collectors. We do not
              want The Memes to be accessible only to wealthy collectors, so we
              have rejected this approach too.
            </li>
            <br />
            <li>
              Allowlists: Allowlists work on a technical basis by restricting
              which addresses can mint on primary. Gas wars can be avoided
              (mostly) by correctly predicting how many addresses to allowlist
              relative to the edition size. One can also maintain low primary
              prices with this model. This is the model we feel is most suitable
              for the project mission of The Memes.
            </li>
            <br />
            <li>
              Open Editions: Open editions absorb all demand by having unlimited
              size editions. This is an intriguing and relevant model for The
              Memes. Our current approach is to use this model approximately
              once per SZN. The cultural factors in the NFT space generally
              appear to preclude against ongoing use of Open Editions, and most
              artists are not comfortable with open editions (they prefer to use
              their &quot;one&quot; or &quot;occasional&quot; Open Edition for
              themselves).
            </li>
          </ul>
          <br />
          <p>
            <b>Allowlists At The Memes: Background</b>
          </p>
          <ul>
            <li>
              It might be useful to understand how we imagine the allowlist
              process. The analogy below is imperfect, but still helpful.
              <ul>
                <br />
                <li>
                  Imagine The Memes are a gallery in a big warehouse somewhere
                  in New York, that is the gathering point for a group of
                  collectors and artists who share a common ideological interest
                  in art and decentralization
                </li>
                <br />
                <li>
                  A few times a week, an artist in the collective produces an
                  edition of hopefully attractive, definitely ideological, art
                  that is put up for sale at a hopefully attractive price
                </li>
                <br />
                <li>
                  The purpose of the allowlist is &quot;
                  <i>
                    who should we invite that night to have an opportunity to
                    buy the editions first?
                  </i>
                  &quot;
                </li>
                <br />
                <li>
                  The classic answer in the physical world is friends of the
                  gallery, friends of the artists, repeat collectors of the
                  gallery and maybe some random people to keep it interesting
                  and introduce new people to the mix
                </li>
                <br />
                <li>
                  The answer here is broadly similar, but with two differences:
                  the scale is sometimes larger and people can pretend to be
                  more than 1 person by having different Ethereum addresses
                </li>
                <br />
                <li>
                  In technical terms, identity on Ethereum is vulnerable to
                  Sybil attacks. As Wikipedia states: &quot;
                  <i>
                    A Sybil attack is a type of attack on a computer network
                    service in which an attacker subverts the service&apos;s
                    reputation by creating a large number of pseudonymous
                    identities and uses them to gain a disproportionally large
                    influence
                  </i>
                  &quot;
                </li>
                <br />
                <li>
                  The purpose of Bitcoin mining&apos;s proof of work algorithm
                  is, in some ways, to prevent Sybil attacks vs other consensus
                  mechanisms that do not protect against them
                </li>
              </ul>
            </li>
            <br />
            <li>
              With that as background, what did we do first?
              <ul>
                <br />
                <li>
                  For the initial The Memes mints, we allowlisted hundreds of
                  people by hand
                </li>
                <br />
                <li>
                  We fought the &quot;Sybil attack&quot; by individually going
                  to people we knew were real people and allowlisting them for
                  the initial mints
                </li>
                <br />
                <li>
                  It was a tedious process, and I am not sure any other
                  meaningful collection has started that way
                </li>
                <br />
                <li>
                  What we &quot;earned&quot; in return, however, is a base of
                  &quot;real people&quot; and editions that are extraordinarily
                  well distributed. On most Memes cards, unique ownership
                  percentages are in the 70-80% range or 80% to 90% if you
                  exclude our internal holdings
                </li>
              </ul>
            </li>
            <br />
            <li>
              Once we had manually established a base of real people, we
              allowlisted them for future mints. In the beginning, this was
              straightforward.
              <ul>
                <br />
                <li>
                  Demand was relatively low and the mints took time to mint out
                </li>
                <br />
                <li>
                  We were even able to sprinkle in a public mint here or there
                </li>
                <br />
                <li>
                  Over time, however, there was more demand for The Memes and
                  the allowlists become more challenging to create
                </li>
              </ul>
            </li>
          </ul>
          <br />
          <p>
            <b>Allowlists At The Memes: Current Practices</b>
          </p>
          <ul>
            <li>
              This is the current process for allowlists at The Memes as of
              February 2023. It is certain that the process will change in the
              future, as it has in the past, in response to new challenges.
            </li>
            <br />
            <li>
              The process begins with automatic airdrops to:
              <ul>
                <br />
                <li>The 6529 Museum</li>
                <br />
                <li>
                  Various individuals working on the project and the 6529 Fund
                </li>
                <br />
                <li>The artist or artists who worked on that Meme</li>
                <br />
                <li>
                  These are the parties that are &quot;
                  <i>always on the guest list</i>&quot;
                </li>
              </ul>
            </li>
            <br />
            <li>
              The second part of the process is a few &quot;partial&quot;
              airdrops to:
              <ul>
                <br />
                <li>Collectors of Meme Card or Gradients</li>
                <br />
                <li>Collectors of the artist</li>
                <br />
                <li>
                  The purpose of the partial airdrops is to give a chance to
                  acquire a Meme Card to community members who are not always
                  online and available to mint.
                </li>
              </ul>
            </li>
            <br />
            <li>
              The third part of the process is the Phase I mint.
              <ul>
                <br />
                <li>
                  In Phase I, we try to guess how many people to allowlist
                  relative to the number of available cards for minting
                </li>
                <br />
                <li>
                  The perfect guess would mean that Phase I mints out, within
                  its 30 minute window, without having a gas war
                </li>
                <br />
                <li>
                  If we overestimate the number of people to allowlist, there is
                  a gas war
                </li>
                <br />
                <li>
                  If we underestimate, we go to Phase II which is a continuation
                  of the Phase I logic, but to a broader set of participants.
                  Phase III is the public mint
                </li>
                <br />
                <li>
                  It is impossible to get this precisely right because
                  likelihood to mint varies by different groups, particularly
                  the artist&apos;s collectors. We are happy if we are 80%
                  correct, 80% of the time
                </li>
                <br />
                <li>
                  Our general approach is to allowlist:
                  <ul>
                    <br />
                    <li>
                      Some of the &quot;larger&quot; Meme Card collectors with a
                      focus on &quot;large&quot; being &quot;number of different
                      cards held&quot;, as opposed to &quot;total cards
                      held&quot;
                    </li>
                    <ul>
                      <br />
                      <li>
                        The limit case of &quot;number of different cards
                        held&quot; is &quot;full set collectors&quot;
                      </li>
                      <br />
                      <li>
                        We prefer &quot;number of different cards held&quot; to
                        &quot;total cards held&quot; because getting different
                        cards in individual&apos;s wallets where they can be
                        seen by others is more important than getting duplicates
                        of the same card in wallets
                      </li>
                      <br />
                      <li>
                        Total cards held or total days held can be used as a
                        tie-breaker though
                      </li>
                    </ul>
                    <br />
                    <li>Some or all of the Gradient collectors</li>
                    <br />
                    <li>Some or all of the artist&apos;s collectors</li>
                    <br />
                    <li>A few people not in the above categories</li>
                  </ul>
                </li>
                <br />
                <li>
                  Why do we allowlist these categories?
                  <ul>
                    <br />
                    <li>
                      We often allowlist the larger collectors not only because
                      they tend to be bigger supporters of the gallery, but also
                      because, if we did not, they would split their cards into
                      separate wallets and appear to be more numerous smaller
                      collectors
                    </li>
                    <br />
                    <li>
                      We often allowlist the Gradient collectors because they
                      were early supporters of the vision
                    </li>
                    <br />
                    <li>
                      We always allowlist the artist&apos;s collectors because,
                      of course, the artist should allowlist their own
                      collectors, and also because this is an important
                      mechanism to introduce new collectors to The Memes
                    </li>
                    <br />
                    <li>
                      We have allowlisted collectors of over hundreds, possibly
                      thousands, of collections so far. It is hugely important
                      to the project mission and we intend to continue to do
                      this
                    </li>
                    <br />
                    <li>
                      We allowlist some other random categories so that there is
                      some diversity in the minters
                    </li>
                  </ul>
                </li>
                <br />
                <li>
                  Having said all that, we also sometimes deviate from this
                  approach to improve the diversity of collectors. How often we
                  can deviate from that before the large collectors split their
                  wallets is a challenging question.
                </li>
              </ul>
            </li>
            <br />
            <li>
              It is important to emphasize that you see the allowlist in the
              same light in which we see it, namely, that it is something like a
              guest list for a gallery.
              <ul>
                <br />
                <li>
                  If you were a large collector of Andy Warhols from an
                  important New York gallery, sure, it is normal to expect that
                  you might be invited to their cocktail parties or to get an
                  early look at new work in the gallery
                </li>
                <br />
                <li>
                  You would not, however, collect Andy Warhols primarily to
                  receive cocktail party invites and you would understand that
                  you did not always get an early look at all new pieces in the
                  gallery
                </li>
              </ul>
            </li>
          </ul>
          <br />
          <p>
            <b>Provability</b>
          </p>
          <ul>
            <li>
              We take a series of measures to prove that the allowlists are
              created the way we say they are created.
            </li>
            <br />
            <li>
              This is a level of diligence and transparency that has no real
              physical world equivalent. A gallery would not open up their
              records to the guests at the event to explain how and who was
              invited. One of the powers of public blockchains is that we can
              offer this transparency, so we do so.
            </li>
            <br />
            <li>
              In particular, we do the following:
              <ul>
                <br />
                <li>
                  We announce in advance on which Ethereum block we will
                  snapshot the collectors of The Memes, the Gradients and the
                  artist&apos;s NFTs
                </li>
                <br />
                <li>
                  We announce a block from which we will draw pseudorandomness
                </li>
                <br />
                <li>
                  It is important for this to work that the blocks are announced
                  publicly before they happen
                </li>
                <br />
                <li>
                  We post our allowlist formula and calculations on github
                </li>
                <br />
                <li>
                  Anyone with a bit of technical savvy can replicate how we
                  created the allowlist
                </li>
                <br />
                <li>
                  This process does not mean the allowlist is predictable. It
                  just confirms that the allowlist is what we say it is.
                </li>
              </ul>
            </li>
          </ul>
          <br />
          <p>
            <b>Improvements</b>
          </p>
          <ul>
            <li>
              We think there are areas that can be improved in the allowlist
              approach to make it richer at capturing different variables.
            </li>
            <br />
            <li>
              In February, we hope to roll out a metric called &quot;TDH&quot; -
              Total Days Held, a metric that derives from the old Bitcoin metric
              of Total Days Destroyed.
            </li>
            <br />
            <li>
              It is a metric of how long The Memes have been held by an address
              and it adds another useful data point. There may be times when
              someone may want to differentiate between a collector who has held
              10 cards for 1 year vs a collector who has held 10 cards for 1
              day. As with all metrics, TDH is not going to be used in a fixed
              way. It is another tool in the toolkit and metrics we are making
              available.
            </li>
            <br />
            <li>
              We would like to find a way to capture social factors in the
              metrics. Who is contributing in Discord, who is creating ReMemes,
              who is generally helpful to the mission? In the physical world
              these factors would definitely be taken into account. The
              challenge here is how to do this in a decentralized and
              transparent way.
            </li>
            <br />
            <li>
              We would like to find a way to categorize the collectors based on
              their actions. These might be useful factors in future allowlists.
            </li>
            <br />
            <li>
              For our full analysis of our Community Metrics, go here:{" "}
              <a href="/community-metrics" target="_blank" rel="noreferrer">
                seize.io/community-metrics
              </a>
            </li>
          </ul>
          <br />
          <p>
            <b>Tools</b>
          </p>
          <ul>
            <li>
              One of our mental models is that NFTs are publicly readable
              databases of people with common interests.
            </li>
            <br />
            <li>
              Given this, we hope that the publicly readable database of The
              Memes collectors will be used by many other people to make their
              own guest lists - for Meme Labs, for ReMemes, for all types of
              things we can and can&apos;t imagine.
            </li>
            <br />
            <li>
              In order to support this, we are going to progressively make our
              tools for allowlists available to everyone (whether Meme Card
              collectors or not).
            </li>
            <br />
            <li>
              On a daily basis, we publish to Arweave the statistics we use to
              create our own allowlists. You can find them here:{" "}
              <a href="/open-data" target="_blank" rel="noreferrer">
                seize.io/open-data
              </a>
            </li>
            <br />
            <li>
              Over the next few months, we will also make available our tools
              for taking snapshots and randomization
            </li>
          </ul>
          <br />
          <p>
            <b>Technical Issues</b>
          </p>
          <ul>
            <li>
              Sometimes under heavy load the minting page will fail to load or
              fail to load a transaction. You may have to refresh multiple times
              to be successful in minting.
            </li>
            <br />
            <li>
              Some users have reported that hard-refreshing or clearing their
              local browser cache between mints may be helpful.
            </li>
            <br />
            <li>
              In highly competitive mints, you may have to put a higher gas
              price to mint in time. We cannot advise on the correct gas to use
              as it differs every time.
            </li>
            <br />
            <li>
              In highly competitive mints, you may pay for a transaction that
              does not mint in time and lose your gas fee. We do not refund gas
              fees for failed transactions.
            </li>
          </ul>
        </Col>
      </Row>
    </Container>
  );
}
