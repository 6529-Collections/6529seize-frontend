import { Col, Container, Row } from "react-bootstrap";
import { AboutSection } from "../../pages/about/[section]";
import styles from "./About.module.scss";

export default function AboutFAQ() {
  return (
    <>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">FAQ</h1>
          </Col>
        </Row>
        <Row>
          <Col className={`${styles.lastUpdateText} text-right pt-3 pb-3`}>
            Last Updated: February 23, 2023
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              <u>
                <b>Some Basics</b>
              </u>
            </p>
            <ol>
              <li>
                <b>What are The Memes?</b>
                <br />
                <br />
                The Memes are art-oriented editions, created by many wonderful
                artists, whose organizing principle is that they are focused on
                spreading the message of decentralization
              </li>
              <br />
              <li>
                <b>Where do I find out about new The Memes mints?</b>
                <br />
                <br />
                Follow{" "}
                <a
                  href="https://twitter.com/6529collections"
                  target="_blank"
                  rel="noreferrer">
                  https://twitter.com/6529collections
                </a>
              </li>
              <br />
              <li>
                <b>
                  Where can I follow a high volume feed on decentralization, art
                  and why NFTs are the key to a decentralized digital future?
                </b>
                <br />
                <br />
                Follow{" "}
                <a
                  href="https://twitter.com/punk6529"
                  target="_blank"
                  rel="noreferrer">
                  https://twitter.com/punk6529
                </a>
                <br />
                <br />
                For endless tweetstorms about why NFTs are important to
                decentralization, see{" "}
                <a
                  href="https://twitter.com/punk6529/status/1448399827054833668"
                  target="_blank"
                  rel="noreferrer">
                  his pinned tweet
                </a>
                .
              </li>
              <br />
              <li>
                <b>What type of NFTs are The Memes?</b>
                <br />
                <br />
                The Memes are ERC-1155 NFTs minted on the Ethereum blockchain.
              </li>
              <br />
              <li>
                <b>How large are the edition sizes of The Memes?</b>
                <br />
                <br />
                The only sure thing about The Memes edition size is that Meme
                Card #4 (Nakamoto Freedom) is the smallest edition size at 300,
                in homage to the first Rare Pepe (Nakamoto Pepe), that is also
                an edition of 300.
                <br />
                <br />
                Edition sizes for the rest vary based on the vibes of the team
                and the artist, more or less. Most editions to date have been
                between 300 and 1,000 in size.
              </li>
              <br />
              <li>
                <b>Where do The Memes collectors gather?</b>
                <br />
                <br />
                Mostly in the OM Discord. Warning, it can get chaotic!
                <br />
                <br />
                <a
                  href="https://discord.gg/join-om"
                  target="_blank"
                  rel="noreferrer">
                  https://discord.gg/join-om
                </a>
              </li>
              <br />
              <li>
                <b>What is the point of The Memes?</b>
                <br />
                <br />
                The overall mission of The Memes is to encapsulate
                pro-decentralization messages into striking or memeable or viral
                or haunting images.
                <br />
                <br />
                While tweetstorms and podcasts and university courses are
                helpful ways to spread these messages, the apex objects in
                society are not academic or technical in nature.
                <br />
                <br />
                The apex objects are artistic, social or cultural, and a
                well-designed meme is much more impactful than any tweetstorm.
                <br />
                <br />
                &quot;Yes We Can&quot; and &quot;Make America Great Again&quot;
                were simple but immensely powerful memes that gave their
                creators the US Presidency.
                <br />
                <br />
                Consider The Memes to be an ongoing in-field experiment to find
                the best memes to communicate the positive benefits of our
                digital architecture in the future being decentralized,
                pro-social and based on a public commons.
              </li>
              <br />
              <li>
                <b>
                  Do you really think The Memes can make a difference on this
                  important and difficult topic?
                </b>
                <br />
                <br />
                Yes. Not every meme will spread, but given the diversity in
                artistic approaches, eventually one, or more, will spread very
                far.
              </li>
              <br />
              <li>
                <b>Are there any other goals for The Memes?</b>
                <br />
                <br />
                Spreading decentralization-oriented messages is the primary
                goal. Nice secondary effects of The Memes include:
                <br />
                <br />
                a&#41; Introducing collectors to a wide range of artists
                <br />
                b&#41; Giving some less well-known artists the opportunity to
                share their work with a larger collector base
                <br />
                c&#41; Releasing art into the public domain
                <br />
                d&#41; Learning and sharing findings about how to run mints
                without high gas costs and other negative effects
                <br />
                e&#41; Releasing open-source data and tools for others to use
                <br />
              </li>
              <br />
              <li>
                <b>What is your success metric?</b>
                <br />
                <br />
                That the ideas expressed in The Memes take hold in NFT, then
                crypto, then broader culture, whether expressed via The Memes
                collectors, Meme Lab collectors, ReMemers or otherwise.
                <br />
                <br />
                For example, &quot;Freedom To Transact&quot; has started to take
                hold as a useful concept and shorthand among people in our
                community and beyond.
                <br />
                <br />
                Our tools/metrics to measure the spread of these concepts today
                are still rudimentary and we need to refine them.
              </li>
              <br />
              <li>
                <b>What are the SZNs?</b>
                <br />
                <br />
                The SZNs are the seasons of The Memes. The Genesis SZN1 was in
                2022. We expect to run 4 SZNs in 2023.
                <br />
                <br />
                We think that SZNs give a sense of structure and cadence to The
                Memes.
                <br />
                <br />
                The calendar for 2023 is here:{" "}
                <a
                  href={`/about/${AboutSection.MEMES_CALENDAR}`}
                  target="_blank"
                  rel="noreferrer">
                  seize.io/about/{AboutSection.MEMES_CALENDAR}
                </a>
              </li>
              <br />
              <li>
                <b>How many SZNs will The Memes run?</b>
                <br />
                <br />
                As long as The Memes are having a positive impact and the
                collection is fun. We hope this will be for a long time and that
                our alien or AI overlords don&apos;t end the fun.
                <br />
                <br />
                &quot;Have fun changing the world with art&quot; sounds like a
                good way to think about it.
              </li>
              <br />
              <li>
                <b>Who are the set collectors?</b>
                <br />
                <br />
                Collectors who are trying to collect either: 1 of each meme from
                a particular SZN (like SZN1 or SZN2), or one of each meme from
                the whole collection, or the 3 Genesis memes, or thematic
                sub-sets.
                <br />
                <br />
                We salute their commitment to The Memes, though obviously we
                recognize that set collectors will always be a very small
                fraction of the overall collector base.
              </li>
              <br />
              <li>
                <b>
                  What are the various &quot;Holidays&quot; in the Memes
                  Calendar?
                </b>
                <br />
                <br />
                We hope that people will use them as a natural attention
                gathering point to do interesting things with community ReMemes,
                with community projects, with new announcements, or just to take
                a break.
              </li>
            </ol>
            <br />
            <p>
              <u>
                <b>Buying The Memes</b>
              </u>
            </p>
            <ol start={15}>
              <li>
                <b>How much do The Memes cost?</b>
                <br />
                <br />
                The usual mint price (&quot;primary&quot; price) to date has
                been: 0.06529ETH.
                <br />
                <br />
                Sometimes we give away The Memes for free
                (&quot;airdrops&quot;).
              </li>
              <br />
              <li>
                <b>What is the minting site for The Memes?</b>
                <br />
                <br />
                <a
                  href="https://thememes.seize.io"
                  target="_blank"
                  rel="noreferrer">
                  https://thememes.seize.io
                </a>
              </li>
              <br />
              <li>
                <b>What is an allowlist?</b>
                <br />
                <br />
                We usually (but not always) manage demand for The Memes by
                limiting primary minting to existing collectors or the
                collectors of the collaborating artist.
                <br />
                <br />
                Please read about the process in detail here:{" "}
                <a
                  href={`/about/${AboutSection.MINTING}`}
                  target="_blank"
                  rel="noreferrer">
                  seize.io/about/{AboutSection.MINTING}
                </a>
              </li>
              <br />
              <li>
                <b>How do I buy The Memes if I have not minted?</b>
                <br />
                <br />
                You can buy them on various NFT marketplaces.
                <br />
                <br />
                This is the link to the collection on OpenSea
                <br />
                <a
                  href="https://opensea.io/collection/thememes6529"
                  target="_blank"
                  rel="noreferrer">
                  https://opensea.io/collection/thememes6529
                </a>
                <br />
                <br />
                These are called &quot;secondary market sales&quot;
              </li>
              <br />
              <li>
                <b>
                  What is a good price to buy The Memes on the secondary market?
                </b>
                <br />
                <br />
                We do not know.
                <br />
                <br />
                The price of NFTs in the secondary market tends to be very
                volatile. Long-term value is highly uncertain and dependent on
                many factors, in particular, consumer demand for The Memes.
                <br />
                <br />
                Like all art and all NFTs, our recommendation is to only buy The
                Memes that you like, at a price that you can easily afford, with
                no expectation of a financial return.
              </li>
              <br />
              <li>
                <b>
                  I would like to have a SZN2 Meme, but they are too expensive
                </b>
                <br />
                <br />
                We expect to offer a large/open edition at some point during
                SZN2 and, generally, every SZN.
              </li>
              <br />
              <li>
                <b>The Memes are too expensive for me to buy.</b>
                <br />
                <br />
                The Memes are CC0 (Creative Commons 0) or, in other words, in
                the public domain.
                <br />
                <br />
                If you like the art of The Memes, feel free to use it in any way
                you like for free. You can save it to your computer, print it
                for your home, mint it as an NFT yourself or make derivative
                works.
                <br />
                <br />
                The details of the license are here:{" "}
                <a
                  href={`/about/${AboutSection.LICENSE}`}
                  target="_blank"
                  rel="noreferrer">
                  seize.io/about/{AboutSection.LICENSE}
                </a>
              </li>
              <br />
              <li>
                <b>What am I buying when I buy an NFT with CC0 art?</b>
                <br />
                <br />
                This is a great question.
                <br />
                <br />
                In our view, a sense of identity and provenance with the artist
                and the art. The primary minters are paying the artists to
                release the work into the public domain.
                <br />
                <br />
                The tokens reflect that provenance. If this is appealing to you,
                if this matches some sense of identity of yours, if you take
                value in the ownership of such art, then you may consider buying
                an NFT from The Memes collection.
                <br />
                <br />
                If not, it is ok, you can just take the art.
              </li>
              <br />
              <li>
                <b>Do I receive IP rights by owning a NFT from The Memes?</b>
                <br />
                <br />
                No. You have the same rights (or lack thereof) as anyone else in
                the world. The Memes are in the public domain.
                <br />
                <br />
                Note that most art from the 19th century and earlier is also in
                the public domain.
              </li>
              <br />
              <li>
                <b>I cannot collect all The Memes.</b>
                <br />
                <br />
                It is fine and normal. None of us can collect all the NFTs out
                there. Just buy what you like, what you can afford, without any
                expectations of a financial return. We do not want anyone to
                stress themselves about The Memes.
              </li>
              <br />
              <li>
                <b>I need to sell my Memes for (whatever reason).</b>
                <br />
                <br />
                It is fine and normal. We do not want anyone to stress
                themselves about The Memes.
              </li>
              <br />
              <li>
                <b>
                  Why doesn&apos;t punk6529 tweet bullish tweets so the price
                  goes up?
                </b>
                <br />
                <br />
                hi, me here,{" "}
                <a
                  href="https://twitter.com/punk6529"
                  target="_blank"
                  rel="noreferrer">
                  punk6529
                </a>
                . I have never tweeted about the price of any NFT and am
                certainly not going to start now. I do not think the price of
                NFTs is what is particularly interesting about them vs the fact
                that they are decentralized databases of digital objects that
                could be foundational technology for the metaverse.
              </li>
              <br />
              <li>
                <b>What are your views on gm?</b>
                <br />
                <br />
                gm
              </li>
            </ol>
            <br />
            <p>
              <u>
                <b>Utility</b>
              </u>
            </p>
            <ol start={28}>
              <li>
                <b>What does &quot;utility&quot; mean?</b>
                <br />
                <br />
                In the NFT field, many projects promise &quot;utility&quot;.
                <br />
                <br />
                This utility could be a blockchain game, a party, a conference,
                clothing and merchandise and so on.
              </li>
              <br />
              <li>
                <b>What utility do the Memes offer or plan to offer?</b>
                <br />
                <br />
                None.
                <br />
                <br />
                When you mint a Meme Card, you have, at the point, the final
                product - an art edition NFT.
                <br />
                <br />
                Neither we, nor the artist, make any commitments to you that we
                will take any further actions to make the NFT more exciting or
                valuable. We think The Memes are exciting and fun just the way
                they are.
                <br />
                <br />
                &quot;The art is the utility&quot; is a phrase that people
                sometimes use to describe this concept.
                <br />
                <br />
                This is how art traditionally works. If you buy an Andy Warhol
                print from a gallery in SoHo, you are happy to own an Andy
                Warhol print. You have no expectation that the gallery will also
                send you a hoodie or build you an Andy Warhol video game.
              </li>
              <br />
              <li>
                <b>Why do you not offer utility?</b>
                <br />
                <br />
                The purpose of The Memes is to make provocative CC0 art that can
                stimulate social change in favor of decentralization.
                <br />
                <br />
                There are many other NFT collections that offer NFTs with
                (supposed) &quot;utility&quot;, mostly in the PFP field - if
                that is something that you are looking for, those collections
                may be a better fit for you.
              </li>
              <br />
              <li>
                <b>
                  Wouldn&apos;t it be nice of The Memes had coffee mugs, hoodies
                  and parties?
                </b>
                <br />
                <br />
                We would happily drink coffee in a The Memes coffee mug.
                <br />
                <br />
                Given that The Memes are CC0, we assume that, if there is market
                demand for The Memes coffee mugs, a specialist in coffee mug
                making will eventually produce The Memes coffee mugs and we can
                buy one if we like.
                <br />
                <br />
                We are not specialists in coffee mug making and do not want to
                become specialists in coffee mug making.
              </li>
              <br />
              <li>
                <b>Anything else on this topic?</b>
                <br />
                <br />
                Ask not what The Memes will do for you, but what you will do for
                decentralization.
              </li>
            </ol>
            <br />
            <p>
              <u>
                <b>ReMemes</b>
              </u>
            </p>
            <ol start={33}>
              <li>
                <b>What are ReMemes?</b>
                <br />
                <br />
                ReMemes are community-driven derivatives of The Memes. In the
                long run, we believe ReMemes will be more important than The
                Memes in spreading the message of decentralization.
              </li>
              <br />
              <li>
                <b>Who can make a ReMeme?</b>
                <br />
                <br />
                Anyone! You do not need approval from anyone.
              </li>
              <br />
              <li>
                <b>How can I find the ReMemes?</b>
                <br />
                <br />
                There is no great solution yet. The best place is the #rememes
                channel in the OM Discord.
                <br />
                <br />
                We are all brainstorming ideas on how to make the ReMemes more
                discoverable.
              </li>
            </ol>
            <br />
            <p>
              <u>
                <b>Meme Lab</b>
              </u>
            </p>
            <ol start={36}>
              <li>
                <b>What Is the Meme Lab?</b>
                <br />
                <br />
                The Meme Lab is an experimental CC0 contract for artists who
                have already minted a Meme Card. They can use the Meme Lab
                contract to mint NFTs that they like, in any way that they like.
              </li>
              <br />
              <li>
                <b>What else can you tell us about the Meme Lab?</b>
                <br />
                <br />
                Not much yet, it is very new, very experimental. We will learn
                more in the next 6 months about how artists plan to use it and
                what happens.
                <br />
                <br />
                We hope to see some successes, and certainly expect there will
                be some failures too.
              </li>
              <br />
              <br />
              <li>
                <b>How do The Memes, the Meme Labs and the ReMemes interact?</b>
                <br />
                <br />
                The Memes artists are invited to mint on The Memes contract.
                &#64;
                <a
                  href="https://twitter.com/punk6529"
                  target="_blank"
                  rel="noreferrer">
                  punk6529
                </a>{" "}
                , &#64;
                <a
                  href="https://twitter.com/6529er"
                  target="_blank"
                  rel="noreferrer">
                  6529er
                </a>{" "}
                other team members, and community members recommend interesting
                established and emerging NFT artists for The Memes. There is a
                somewhat predictable cadence to the pace of new Meme Cards, and
                to the edition size.
                <br />
                <br />
                The Meme Lab is an experimental &quot;playground&quot; for
                artists who have already dropped a Meme Card. It is one ERC-1155
                contract but there is no particular pattern to who mints what
                when, at least so far.
                <br />
                <br />
                The ReMemes are completely community driven. They are based on
                many independent ERC-721 and ERC-1155 contracts by individual
                artists or collectives.
              </li>
            </ol>
            <br />
            <p>
              <u>
                <b>Gradients</b>
              </u>
            </p>
            <ol start={39}>
              <li>
                <b>
                  What relationship does the 6529 Gradient collection have with
                  The Memes?
                </b>
                <br />
                <br />
                There is no direct relationship.
                <br />
                <br />
                The 6529 Gradient collection was a prior collection that was
                completely conceptual in nature. It is 101 grayscale variations
                of the 6529 logo.
              </li>
              <br />
              <li>
                <b>
                  Why are Gradient collectors included in The Memes allowlists?
                </b>
                <br />
                <br />
                We believe the Gradient collectors are also strong believers in
                the decentralization mission and so we are happy to have them
                along with us in this fight.
              </li>
            </ol>
            <br />
            <p>
              <u>
                <b>Other</b>
              </u>
            </p>
            <ol start={41}>
              <li>
                <b>
                  What is the purpose of the 10% of The Memes displayed in the
                  6529 Museum?
                </b>
                <br />
                <br />
                We do not know yet. It is totally open at this stage. We are
                collectors too.
                <br />
                <br />
                The closest analogy for how we view them is that it is a form of
                &quot;insurance policy&quot; for us in case interesting
                decentralized emergent uses of The Memes are developed in the
                community and we want to participate or enable others to
                participate.
                <br />
                <br />
                We may hold them, sell them, donate them, let other people use
                them or do nothing at all with them.
              </li>
              <br />
              <li>
                <b>What is the economic arrangement with The Memes artists?</b>
                <br />
                <br />
                Primary revenue and secondary royalties are split 50:50 between
                the artists and The Memes.
              </li>
              <br />
              <li>
                <b>What are the economic arrangements of the Meme Lab?</b>
                <br />
                <br />
                They are determined solely at the artist&apos;s discretion.
              </li>
              <br />
              <li>
                <b>Why aren&apos;t The Meme cards set up as a DAO?</b>
                <br />
                <br />A DAO used to mean a &quot;Decentralized Autonomous
                Organization&quot; or, what we call today, a &quot;smart
                contract&quot;.
                <br />
                <br />
                In the NFT field, DAOs are usually not decentralized nor
                autonomous.
                <br />
                <br />
                The term is often used to describe arrangements where token
                holders of an NFT somehow have collective assets/treasuries. We
                have a variety of concerns about some of these arrangements.
                <br />
                <br />
                The Memes model is much simpler. We help artists sell NFTs on
                primary like any normal sale of art, at which point the
                collectors have full independence from us and each other. The
                token is on the Ethereum blockchain, the art is hosted on
                Arweave and the art is CC0.
              </li>
            </ol>
          </Col>
        </Row>
      </Container>
    </>
  );
}
