import styles from "./About.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import Image from "next/image";

export enum AboutSection {
  MEMES = "the-memes",
  MEMES_CALENDAR = "memes-calendar",
  MEME_LAB = "meme-lab",
  GRADIENTS = "6529-gradient",
  FAQ = "faq",
  MISSION = "mission",
  RELEASE_NOTES = "release-notes",
  CONTACT_US = "contact-us",
  TERMS_OF_SERVICE = "terms-of-service",
  PRIVACY_POLICY = "privacy-policy",
  COOKIE_POLICY = "cookie-policy",
  LICENSE = "license",
}

interface Props {
  section: AboutSection;
}

export default function AboutSectionComponent(props: Props) {
  function printMemes() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">
              MEMES ARE THE MOST IMPORTANT THING IN THE WORLD
            </h1>
          </Col>
        </Row>
        <Row className="pt-2 pb-2">
          <Col className="pt-3 pb-3 text-center">
            <Image
              width="0"
              height="0"
              style={{
                height: "auto",
                width: "auto",
                maxHeight: "400px",
                maxWidth: "100%",
              }}
              src="/memes-preview.png"
              alt="The Memes"
            />
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">Memes</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              Memes are intersubjective myths (hat tip to Harari). Memes are how
              societies organize themselves across large groups.
            </p>
            <p>
              Elections, politics, culture, brands, consumer behavior,
              cash-flows all come from the most powerful memes in society at any
              given point in time.
            </p>
            <p>
              From &quot;Just Do It&quot; to &quot;Digital Gold&quot; to
              &quot;Yes We Can&quot; / &quot;Make America Great Again,&quot;
              those who control the best memes, control societal resources.
            </p>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">NFTs</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              NFTs are meme-transport, ownership and financialization
              technology.
            </p>
            <p>
              The medium is the message and changes in mediums change the
              message. This is a once-every-few-generations opportunity to make
              society better; to, if you will, SEIZE THE MEMES OF PRODUCTION!
            </p>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">The Memes Collection</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              The Memes Collection is focused on the fight for the open
              metaverse (decentralization, community, self-sovereignty) and
              spreading this message. We want many people, many wallets
              spreading this message.
            </p>
            <p>
              It is a collection that is meant to be open and accessible.
              Edition sizes will generally be large and inexpensive, to spread
              the word and to avoid gas wars. They might not sell out right away
              and that is fine, desirable, even. As usual, the 6529 Museum will
              be reserving 10% of each edition to archive, to display, to donate
              or to sell in the future.
            </p>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">Fun</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              Saving the world is a serious topic, but what is the point of life
              if you don&apos;t have fun along the way? We hope to make some
              cool art, make lots of new frens and generally have a good time
              along the way.
            </p>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">Technical Details</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              The Memes collection will be ERC-1155 editions; there is no reason
              to impose high minting costs on a collection of this nature. The
              collection is minted on a standalone Manifold contract and the
              JPGs are saved on Arweave.
            </p>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">Artists</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              The artist for the initial cards is 6529er but the bulk of the
              collection&apos;s pieces are collaborations with other great
              artists. If you are an artist and are interested in a
              collaboration on a meme card, please fill out this form.
            </p>
          </Col>
        </Row>
      </Container>
    );
  }

  function printMemesCalendar() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">THE MEMES SEASONAL CALENDAR</h1>
          </Col>
        </Row>
        <Row>
          <Col
            xs={{ span: 12 }}
            sm={{ span: 10 }}
            md={{ span: 8, offset: 2 }}
            lg={{ span: 8, offset: 2 }}>
            <Table className={styles.calendarTable}>
              <thead>
                <tr>
                  <th colSpan={2}>2022: Year 0 GENESIS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>June 9 to December 16</td>
                  <td>Meme Cards SZN1</td>
                </tr>
                <tr>
                  <td>December 17 to December 31</td>
                  <td>The Festivities</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>
        <Row>
          <Col
            xs={{ span: 12 }}
            sm={{ span: 10 }}
            md={{ span: 8, offset: 2 }}
            lg={{ span: 8, offset: 2 }}>
            <Table className={styles.calendarTable}>
              <thead>
                <tr>
                  <th colSpan={2}>2023: Year 1</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>January 1 to March 31</td>
                  <td>Winter SZN2</td>
                </tr>
                <tr>
                  <td>April 1 to April 8</td>
                  <td>Awakening</td>
                </tr>
                <tr>
                  <td>April 9 to June 30</td>
                  <td>Spring SZN3</td>
                </tr>
                <tr>
                  <td>July 1 to July 8</td>
                  <td>Freedom</td>
                </tr>
                <tr>
                  <td>July 9 to September 30</td>
                  <td>Summer SZN4</td>
                </tr>
                <tr>
                  <td>October 1 to October 8</td>
                  <td>Harvest</td>
                </tr>
                <tr>
                  <td>October 9 to December 15</td>
                  <td>Fall SNZ5</td>
                </tr>
                <tr>
                  <td>December 16 to December 31</td>
                  <td>The Festivities</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>
      </Container>
    );
  }

  function printMemeLab() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">MEME LAB</h1>
          </Col>
        </Row>
        <Row>
          <Col className="text-center">Coming Soon</Col>
        </Row>
      </Container>
    );
  }

  function printGradient() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">6529 GRADIENT</h1>
          </Col>
        </Row>
        <Row className="pt-2 pb-2">
          <Col className="pt-3 pb-3 text-center">
            <Image
              width="0"
              height="0"
              style={{
                height: "auto",
                width: "auto",
                maxHeight: "400px",
                maxWidth: "100%",
              }}
              src="/gradients-preview.png"
              alt="6529 Gradient"
            />
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">Background</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              The 6529 Gradient Collection represents the 6529 symbol in its
              original two stark black (#100) and white (#0) forms as well 98
              grayscale gradients in-between. Each grayscale gradient is a 1%
              increment in darkness between 100% black and 100% white, with the
              background switching from white to black from #49 to #51.
            </p>
            <p>
              It is the artist&apos;s (@6529er) preferred interpretation of his
              work and his vision for it in its purest form. It reminds us of
              the Chromie Squiggles Perfect Spectrums – much less flashy than
              the HyperRainbows, but it is an iykyk choice.
            </p>
            <p>
              Each of the 100 pieces is represented as a 100% on-chain SVG with
              a secondary IPFS link.
            </p>
            <p>
              The more mathematically inclined readers will note that #0 to #100
              represents 101 tokens, not 100. That is right, there is a special
              token, #50 that is built different. It is a gif (how could we not
              have a gif?) and, like the squiggles, it moves.
            </p>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">Collection Launch</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              64 Gradients were sold to the general public in 2021, 56 of which
              were sold to 48 different collectors through the end of December
              2021, with a total trading volume in 2021 of over 200ETH.
            </p>
            <p>In terms of the remaining Gradients: </p>
            <ul>
              <li>
                Gradients #0, #50 and #100 are in the 6529 Museum Permanent
                Collection
              </li>
              <li>
                Gradients #10, #20, #30, #40, #50, #60, #70, #80, #90 will be
                held by 6529 for now
              </li>
              <li>
                The remaining 24 Gradients will be released at 6529&apos;s
                discretion in the coming years in formats that will be
                determined over time
              </li>
            </ul>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">The Artist - 6529er</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              6529er is a professional designer and digital artist with over 20
              years experience in graphic and web design.
            </p>
            <p>
              He is best known for his work on logo design, brand identity and
              typography.
            </p>
            <p>
              6529er designed the iconic 6529 logo and visual identity and leads
              the creation of 6529 Brand Collections.
            </p>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">Collection Approach</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              In addition to celebrating the creation of the iconic 6529 logo by
              @6529er, this first drop by 6529 is a vehicle for interesting
              experiments in community engagement, other collections and
              collabs, as well as auction dynamics.
            </p>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">6529 Gradient Owners Gallery</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              In November 2021, after the big success of the 6529 Fam Gallery
              experiment, 6529 had another idea in which he reversed things.
              This time he{" "}
              <a
                href="https://twitter.com/punk6529/status/1460721601318690831"
                target="_blank"
                rel="noreferrer">
                invited every holder of a Gradient
              </a>{" "}
              to display an NFT of their choice in a new{" "}
              <a
                href="https://oncyber.io/6529gradients"
                target="_blank"
                rel="noreferrer">
                6529 Gradients Gallery
              </a>{" "}
              on Cyber.
            </p>
            <p>
              As there are still Gradients that have not been auctioned, this is
              an ongoing project, which is already yielding beautiful results,
              with some epic pieces already on display.
            </p>
          </Col>
        </Row>
        <Row className="pt-3">
          <Col>
            <h3 className="float-none">Roadmaps</h3>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              There is no roadmap, there is no discord, there is no utility
              token, there is no governance coin.
            </p>
            <p>
              You should buy these NFTs solely if you like 6529er&apos;s design.
            </p>
          </Col>
        </Row>
      </Container>
    );
  }

  function printFAQ() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">FAQ</h1>
          </Col>
        </Row>
        <Row>
          <Col className="text-center">Coming Soon</Col>
        </Row>
      </Container>
    );
  }

  function printMission() {
    return (
      <Container className="text-center">
        <Row>
          <Col>
            <h1 className="float-none">MISSION</h1>
          </Col>
        </Row>
        <Row className="pt-4 pb-4">
          <Col>
            <h1 className="float-none font-color">
              THE 6529 MISSION IS TO ACCELERATE THE DEVELOPMENT OF AN OPEN
              METAVERSE
            </h1>
          </Col>
        </Row>
      </Container>
    );
  }

  function printContactUs() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">CONTACT US</h1>
          </Col>
        </Row>
        <Row>
          <Col className="text-center">Coming Soon</Col>
        </Row>
      </Container>
    );
  }

  function printReleaseNotes() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">RELEASE NOTES</h1>
          </Col>
        </Row>
        <Row>
          <Col className="text-left">
            <p>
              <b>This is the Release log for the seize.io website.</b>
            </p>
            <p>The log is updated in reverse chronological order.</p>
            <p>
              Major site-wide releases are incremented as 1.x.x
              <br />
              New features are incremented as x.1.x
              <br />
              Small updates or bug fixes are incremented as x.x.1
            </p>
            <br />
            <p>
              <b>Release 1.0.0</b>
              <br />
              Feb TBC, 2023
              <br />
              This release is the initial site launch. Given this, it will be
              less detailed on each feature than subsequent logs.
            </p>
            <p>
              The initial release includes the following significant features
              <ul>
                <li>Details about all Meme Cards</li>
                <li>Details about all Gradient</li>
                <li>Community Metrics</li>
                <li>Activity logs of purchases and transfers of Meme Cards</li>
                <li>Various informational pages</li>
              </ul>
            </p>
          </Col>
        </Row>
      </Container>
    );
  }

  function printTermsOfService() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">TERMS OF SERVICE</h1>
          </Col>
        </Row>
        <Row>
          <Col className={`${styles.lastUpdateText} text-right pt-3 pb-3`}>
            Last Updated: February 11, 2023
          </Col>
        </Row>
        <Row>
          <Col>
            <ol>
              <li>
                <b>Abbreviations Make Documents More Readable</b>
                <br />
                <br />
                These are the abbreviations used in this document.
                <br />
                <br />
                &quot;Terms&quot;: Terms of Service
                <br />
                <br />
                &quot;We&quot;: 6529 Collections LLC
                <br />
                <br />
                &quot;6529 NFTs&quot;: The Memes, 6529 Gradient, Meme Lab,
                GenMemes, 6529 Intern and other NFTs we may mint from time to
                time.
                <br />
                <br />
                &quot;You&quot;: An adult, at least 18 years of age, who is not
                subject to sanctions by the US government.
                <br />
                <br />
                &quot;Third Parties&quot;: Everyone else who is not
                &quot;We&quot; or &quot;You&quot;
                <br />
                <br />
                &quot;Our Platform&quot;: the website located at{" "}
                <a href="https://seize.io" target="_blank" rel="noreferrer">
                  seize.io
                </a>{" "}
                , any websites hosted at sub-domains of{" "}
                <a href="https://seize.io" target="_blank" rel="noreferrer">
                  seize.io
                </a>{" "}
                , including hosted minting or primary sales pages, any primary
                mints or sales directly from our smart contracts, any mobile or
                metaverse applications we make and any content &#40;data,
                descriptions or otherwise&#41; on our website or decentralized
                file storage platforms like IPFS or Arweave.
                <br />
                <br />
                &quot;Not Our Platform&quot;: Everything else that is not
                included in &quot;Our Platform&quot; including your Ethereum
                wallet, NFTs marketplaces and publicly accessible secondary
                functions on our smart contracts such as token transfers.
              </li>
              <br />
              <br />
              <li>
                <b>The Underlying Principle Of These Terms</b>
                <br />
                <br />
                Our main ongoing activity is primary minting CC0 NFTs with a
                mission-based focus at fairly affordable prices. <br />
                <br />
                Once the NFTs have been primary minted:
                <br />
                <br />
                a&#41; you and Third Parties can do more or less whatever you
                want with the CC0 NFTs &#40;see details below&#41;
                <br />
                <br />
                and <br />
                <br />
                b&#41; we do not have any further obligations toward you <br />
                <br />
                Most of the Clauses in the Terms relate to making &#40;b&#41;
                absolutely clear.
              </li>
              <br />
              <li>
                <b>Our Platform, Our House Rules I</b>
                <br />
                <br />
                Agreeing to these terms is the only way you are allowed to use
                Our Platform. If you do not agree with our Terms, that is fine,
                but you cannot use Our Platform.
              </li>
              <br />
              <br />
              <li>
                <b>Our Platform, Our House Rules II</b>
                <br />
                <br />
                We can terminate or pause your access to Our Platform at any
                time, for any reason.
              </li>
              <br />
              <br />
              <li>
                <b>Our Platform, Our House Rules III</b>
                <br />
                <br />
                <a
                  href="https://twitter.com/punk6529"
                  target="_blank"
                  rel="noreferrer">
                  @punk6529
                </a>{" "}
                tweets a lot and has a lot of ideas, that may change from time
                to time. <br />
                <br />
                You should have no expectation whatsoever that what he is going
                to tweet is going to match your current or future understanding
                of the 6529 NFTs. <br />
                <br />
                His retweets, likes or twitter or discord communications are not
                endorsements nor do they reflect changes in Terms.
              </li>
              <br />
              <br />
              <li>
                <b>The Only Constant In This World Is Change I</b>
                <br />
                <br />
                The Terms and any pages or policies incorporated in the Terms by
                reference may change at any time. The changes are effective
                immediately. <br />
                <br />
                Any change will be communicated by changing the &quot;Last
                Updated&quot; date on this webpage or any other method we
                choose.
                <br />
                <br />
                If you disagree with the changes, that is fine, but you cannot
                use Our Platform from that point onward.
              </li>
              <br />
              <br />
              <li>
                <b>The Only Constant In This World Is Change II</b>
                <br />
                <br />
                We have the right to change or terminate any or all of our
                activities at any time for any reason.
              </li>
              <br />
              <br />
              <li>
                <b>We Are On A Mission</b>
                <br />
                <br />
                The mission of The Meme cards is to effectively make people
                aware of the importance of decentralization.
                <br />
                <br />
                If at any point in time, at our sole discretion, we think a
                change will improve the success of the mission, even if it may
                be disadvantageous to any other perceived goal of the 6529 NFTs,
                we will make that change and not think twice.
              </li>
              <br />
              <br />
              <li>
                <b>Read First, Participate Later</b>
                <br />
                <br />
                You acknowledge that you have read and accept the information on
                the webpages and that is incorporated by reference into these
                Terms.
                <br />
                <br />
                <a
                  href="https://seize.io/about?section=the-memes"
                  target="_blank"
                  rel="noreferrer">
                  seize.io/about?section=the-memes
                </a>
                <br />
                <a
                  href="https://seize.io/about?section=6529-gradient"
                  target="_blank"
                  rel="noreferrer">
                  seize.io/about?section=6529-gradient
                </a>
                <br />
                <a
                  href="https://seize.io/about?section=meme-lab"
                  target="_blank"
                  rel="noreferrer">
                  seize.io/about?section=meme-lab
                </a>
                <br />
                <a
                  href="https://seize.io/about?section=faq"
                  target="_blank"
                  rel="noreferrer">
                  seize.io/about?section=faq
                </a>
              </li>
              <br />
              <br />
              <li>
                <b>License / IP</b>
                <br />
                <br />
                Our NFTs do not transfer any IP rights to you.
                <br />
                <br />
                You acknowledge that you have read and accept the information on
                this webpage that explains this topic in more detail and that is
                incorporated by reference into these Terms.
                <br />
                <br />
                <a
                  href="https://seize.io/about?section=license"
                  target="_blank"
                  rel="noreferrer">
                  seize.io/about?section=license
                </a>
              </li>
              <br />
              <br />
              <li>
                <b>Minting NFTs</b>
                <br />
                <br />
                You have no right to receive &#40;airdrop&#41; or mint
                &#40;allowlist&#41; a future 6529 NFT based on owning one or
                more current 6529 NFTs.
                <br />
                <br />
                You acknowledge that you have read and accept the information on
                this webpage that explains this topic in more detail and that is
                incorporated by reference into these Terms.
                <br />
                <br />
                <a
                  href="https://seize.io/minting"
                  target="_blank"
                  rel="noreferrer">
                  seize.io/minting
                </a>
              </li>
              <br />
              <br />
              <li>
                <b>Privacy</b>
                <br />
                <br />
                Our privacy policy can be found here. We may transfer or process
                data in the United States or other countries.
                <br />
                <br />
                <a
                  href="https://seize.io/about?section=privacy-policy"
                  target="_blank"
                  rel="noreferrer">
                  seize.io/about?section=privacy-policy
                </a>
              </li>
              <br />
              <br />
              <li>
                <b>Not Our Platform</b>
                <br />
                <br />
                Due to the architecture of ERC-1155 contracts, 6529 NFTs can be
                transferred without our permission or consent. We cannot
                &quot;freeze&quot; someone&apos;s 6529 NFTs or transfer them to
                a party of our choosing. After the primary sale from us to you,
                you are in full control of your token.
                <br />
                <br />
                This means that you can transact 6529 NFTs in their Ethereum
                wallets, in marketplaces, in galleries, in metaverse platforms,
                in games and in a wide range of services that may emerge. All of
                these transactions are occurring on Not Our Platform. We have no
                ability to enforce or control transactions happening on Not Our
                Platform.
                <br />
                <br />
                We take absolutely no responsibility whatsoever for what you and
                Third Parties do on Not Our Platform, including but not limited
                to, suffering economic losses, security risks, theft, hacking,
                what commitments or representations are made as a part of those
                transactions, and if those transactions are legal in your
                jurisdiction.
                <br />
                <br />
                We are not a party to those transactions. We have a relationship
                with you when you use Our Platform only.
              </li>
              <br />
              <br />
              <li>
                <b>Many Things Can Go Wrong</b>
                <br />
                <br />
                NFTs are the most volatile and experimental sector of the crypto
                field which itself is still a new, volatile and experimental
                field
                <br />
                <br />
                Many things can potentially go wrong with NFTs in general or
                6529-related NFTs in particular, including but not limited to:
                &#40;a&#41; technical flaws/bugs/hacks/vulnerabilities at the
                protocol level, &#40;b&#41; changes at the protocol level,
                &#40;c&#41; changes in which protocols are popular, &#40;d&#41;
                technical flaws/bugs/hacks/vulnerabilities at the wallet level,
                &#40;e&#41; changes in the popularity of NFTs in general or any
                NFTs specifically, &#40;f&#41; technical
                flaws/bugs/hacks/vulnerabilities of project or marketplace
                websites, &#40;g&#41; technical flaws/bugs/hacks/vulnerabilities
                of general or project-related communication channels such as
                discord or twitter, &#40;h&#41; regulatory changes or actions
                that impact specific NFTs &#40;including ours&#41; or all NFTs.
              </li>
              <br />
              <br />
              <li>
                <b>Future Value of 6529 NFTs</b>
                <br />
                <br />
                The future value of art and collectibles is based on demand and
                social factors, is impossible to forecast, and, in any case, is
                out of our control. <br />
                <br />
                We have no idea what the future value &#40;if any&#41; will be
                of 6529 NFTs.
              </li>
              <br />
              <br />
              <li>
                <b>Royalties</b>
                <br />
                <br />
                Most 6529 NFTs have secondary sale royalties associated with
                them that go to us, the collaborating artist or both.
                <br />
                <br />
                While we have not done so, we reserve the right with no further
                notice to treat NFTs that have paid royalties differently than
                those that have not, in ways to be determined in the future.
              </li>
              <br />
              <br />
              <li>
                <b>CC0</b>
                <br />
                <br />
                Most 6529 NFTs are CC0 &#40;Creative Commons 0&#41; licensed
                which means they are in the public domain.
                <br />
                <br />
                This means anyone in the world can use the image associated with
                your NFT for any purpose they like. Some uses may be perceived
                by you as desirable and some uses may be perceived as
                undesirable or even shocking.
                <br />
                <br />
                This is the nature of CC0 art. There is nothing we or anyone
                else can do about it. If this bothers you, you should probably
                not buy a CC0 NFT.
              </li>
              <br />
              <br />
              <li>
                <b>Utility</b>
                <br />
                <br />
                6529 NFTs do not have any &quot;utility&quot; - in other words,
                6529 NFTs do not guarantee you access to any future product or
                service.
                <br />
                <br />
                We may, from time to time, test services that interoperate with
                6529 NFTs.
                <br />
                <br />
                These should be considered experimental, subject to change,
                subject to being terminated and in any cases not changing the
                general principle that we make no commitments to offering
                &quot;utility&quot;
              </li>
              <br />
              <br />
              <li>
                <b>Third Party Perspectives</b>
                <br />
                <br />
                Many Third Parties have perspectives about 6529 NFTs that they
                share on social media and otherwise.
                <br />
                <br />
                We take no responsibility for these communications, whether we
                agree with them or not, as we have no way to monitor or exercise
                control over them. <br />
                <br />
                Our perspectives on the 6529 NFTs can be found on the
                <a href="https://seize.io" target="_blank" rel="noreferrer">
                  seize.io
                </a>{" "}
                website.
              </li>
              <br />
              <br />
              <li>
                <b>Delegation and Consolidation</b>
                <br />
                <br />
                We may provide from time to time the ability to delegate minting
                from one wallet to another or to consolidate wallet contents for
                minting purposes.
                <br />
                <br />
                What formula or platform we use for delegation or consolidation
                &#40;or whether we offer this functionality at all&#41; is in
                our sole discretion.
              </li>
              <br />
              <br />
              <li>
                <b>Sanctions</b>
                <br />
                <br />
                The United States makes it illegal to engage in economic
                transactions with certain people or entities
                &#40;&quot;Sanctioned Parties&quot;&#40;
                <br />
                <br />
                As we prefer not to go to jail, if you are a Sanctioned Party,
                we cannot engage in any economic activities with you.
                <br />
                <br />
                If you are a Sanctioned Party, please a&#41; do not mint a 6529
                NFT, b&#41; apply to be a Meme Card artist, c&#41; or send us
                any ETH, for royalties or otherwise.
              </li>
              <br />
              <br />
              <li>
                <b>We Are Not Your Personal Ethereum Concierge</b>
                <br />
                <br />
                NFTs are held in self-managed Ethereum wallets where the users
                are responsible for authorizing transactions.
                <br />
                <br />
                Mistakes in how an Ethereum wallet is used can lead to loss of
                your 6529 NFTs &#40;or other tokens&#41;, failed transaction or
                high gas costs. Such events are your responsibility and out of
                our control and we cannot offer you compensation or any other
                recourse for such events.
                <br />
                <br />
                There is a vast array of educational resources available to
                learn about how to use Ethereum well. We encourage you to study
                and practice with small amounts before buying economically
                meaningful NFTs and to follow good safety practices such as
                using multi-signature or hardware wallets.
              </li>
              <br />
              <br />
              <li>
                <b>Phishing</b>
                <br />
                <br />
                It is common for Third Parties to create fake 6529 websites in
                order to convince people to sign malicious transactions or
                transfer their private keys.
                <br />
                <br />
                We take no responsibility for phishing sites and cannot provide
                any compensation or assistance for phishing, thefts or other
                related matters.
                <br />
                <br />
                It is your responsibility to understand which transactions you
                are signing in your Ethereum wallet.
              </li>
              <br />
              <br />
              <li>
                <b>Ethereum NFTs</b>
                <br />
                <br />
                The 6529 NFTs are currently only available on the Ethereum
                blockchain.
                <br />
                <br />
                Moving them to another blockchain including an &quot;L2&quot;
                Ethereum blockchain will lead to their loss.
              </li>
              <br />
              <br />
              <li>
                <b>We Might Get Hacked</b>
                <br />
                <br />
                It is possible that Our Platform may be hacked or otherwise
                maliciously attacked and we disclaim any liability in this case.
                <br />
                <br />
                You remain solely responsible for any actions you take relating
                to Our Platform, including signing transactions from your
                Ethereum wallet.
                <br />
                <br />
                Always keep your guard up for suspicious behavior even on
                trusted sites.
              </li>
              <br />
              <br />
              <li>
                <b>Your Feedback and Ideas</b>
                <br />
                <br />
                You can feel free to share ideas with us, but we may use them or
                may already be working on similar ideas.
                <br />
                <br />
                Given this, we will not pay you and you cannot claim
                compensation for &quot;sharing ideas&quot;. If this is not
                acceptable to you, do not share your ideas with us.
                <br />
                <br />
                We will not sign NDAs or non-competes to hear your ideas.
              </li>
              <br />
              <br />
              <li>
                <b>Third Party Content or Services</b>
                <br />
                <br />
                We may link to or incorporate Third Party Content or Services.
                Your relationship with those Third Parties is directly with
                them.
                <br />
                <br />
                We do not provide any warranties, endorsements or
                representations relating to Third Party Content or Services and
                you interact with them at your sole risk.
              </li>
              <br />
              <br />
              <li>
                <b>
                  You Can&apos;t Sue Us, Either Individually Or In Large Groups
                </b>
                <br />
                <br />
                You waive your right to sue us or to participate in a class
                action suit and agree to mandatory arbitration in the event of a
                dispute.
                <br />
                <br />
                Specifically you agree to the following as it relates to
                disputes between you and us
                <br />
                <br />
                a&#41; That any dispute we might have, it is individual between
                you and us and you will not bring a class action, class
                arbitration or any other collective proceeding.
                <br />
                <br />
                b&#41; If you or we have a dispute, we will aim to resolve it
                amicably first and, if that is not possible, either party will
                have the right to initiate a JAMS arbitration under standard
                JAMS terms of reference.
                <br />
                <br />
                You acknowledge that you have read and accept the information on
                this webpage that includes the applicable JAMS terms and that is
                incorporated by reference into these Terms.
                <br />
                <br />
                <a
                  href="https://seize.io/dispute-resolution"
                  target="_blank"
                  rel="noreferrer">
                  seize.io/dispute-resolution
                </a>{" "}
              </li>
              <br />
              <br />
              <li>
                <b>Indemnification</b>
                <br />
                <br />
                You agreed to indemnify us and our subsidiaries, affiliates,
                managers, members, officers, partners and employees
                &#40;together &quot;6529 Parties&quot;&#41; from losses,
                liabilities, claims, demands, damages, expenses or costs
                &#40;&quot;Claims&quot;&#41; arising out of or related to
                <br />
                a. Your access to or use of Our Platform
                <br />
                b. Your use of 6529 NFTs
                <br />
                c. Your Violation of Terms
                <br />
                d. Your Infringement of intellectual property, privacy, property
                rights of others
                <br />
                e. Your Conduct
                <br />
                f. Your Violation of Laws/Regulations
                <br />
                g. Your Feedback And Ideas
                <br />
                <br />
                You will cooperate with the 6529 Parties in defending such
                Claims and pay all fees, costs and expenses associated with
                defending such Claims &#40;including, but not limited to,
                attorneys&apos; fees&#41;. 6529 Parties will have control of the
                defense or settlement, at 6529 Party&apos;s sole option, of any
                third-party Claims.
              </li>
              <br />
              <br />
              <li>
                <b>Disclaimers</b>
                <br />
                <br />
                Our Platform, the 6529 NFTs and any services relating to them is
                provided &quot;As Is&quot; and &quot;As Available&quot; without
                warranties of any kind, either express or implied, including
                warranties of merchantability, fitness for a particular purpose,
                title and non-infringement. We do not warrant that Our Platform,
                NFTs or communication and content relating to them is accurate,
                complete or error-free.
                <br />
                <br />
                We further reiterate the disclaimers, without limitation, in
                Clauses #10, #11, #13 to #25 and #27
              </li>
              <br />
              <br />
              <li>
                <b>Disclaimer of Damages</b>
                <br />
                <br />
                To the fullest extent permitted by applicable law, we will not
                be liable to you under any theory of liability - whether based
                in contract, tort, negligence, strict liability, warranty or
                otherwise - for any indirect, consequential, exemplary,
                incidental, punitive or special damages or lost profits, even if
                we have been advised of the possibility of such damages.
              </li>
              <br />
              <br />
              <li>
                <b>Limitation of Liability</b>
                <br />
                <br />
                Our total liability for any claim arising from use of our
                Platform or 6529 NFTs or these Terms is limited to the greater
                of $100 or the amount paid by you to us.
                <br />
                <br />
                The limitations in #31 and #32 will not limit or exclude
                liability for our gross negligence, fraud, or intentional
                misconduct or for any other matters which cannot be excluded or
                limited under applicable law. Some jurisdictions do not allow
                the exclusion or limitation of incidental or consequential
                damages, so the above limitations or exclusions may not apply to
                you.
              </li>
              <br />
              <br />
              <li>
                <b>Release</b>
                <br />
                <br />
                To the fullest extent permitted by applicable law, you release
                the 6529 Parties from responsibility, liability, claims, demands
                and/or damages &#40;actual and consequential&#41; of every kind
                and nature, known and unknown &#40;including, but not limited
                to, claims of negligence&#41;, arising out of or related to
                disputes between users, acts or omissions of Third Parties or
                anything for which you have agreed that we will have no
                responsibility or liability pursuant to these terms.
                <br />
                <br />
                If you are a consumer who resides in California, you hereby
                waive your rights under California Civil Code § 1542, which
                provides: &quot;A general release does not extend to claims that
                the creditor or releasing party does not know or suspect to
                exist in his or her favor at the time of executing the release
                and that, if known by him or her, would have materially affected
                his or her settlement with the debtor or released party.&quot;
              </li>
              <br />
              <br />
              <li>
                <b>Governing Law and Venue</b>
                <br />
                <br />
                Any dispute arising from these Terms and your use of our
                Services will be governed by and construed and enforced in
                accordance with the laws of the Delaware without regard to
                conflict of law rules or principles. Any dispute that is not
                subject to Arbitration will be resolved in the federal or state
                courts located in Wilmington, Delaware.
              </li>
              <br />
              <br />
              <li>
                <b>Failure To Enforce</b>
                <br />
                <br />
                If we fail to enforce some of our rights under these Terms in
                the present or against certain parties, that does not mean they
                terminate or are waived. We reserve the right to enforce them in
                the future against any or all parties.
              </li>
              <br />
              <br />
              <li>
                <b>Section Titles</b>
                <br />
                <br />
                Our section titles are for readability and have no legal or
                contractual effect.
              </li>
              <br />
              <br />
              <li>
                <b>Electronic Communication</b>
                <br />
                <br />
                You consent to electronic communication and transactions.
              </li>
              <br />
              <br />
              <li>
                <b>Severability</b>
                <br />
                <br />
                This means that if a certain section of this website is
                determined in some or all jurisdictions to be void, illegal or
                unenforceable, it will be severed from the rest of this contract
                and the remainder of the contract will continue to be valid and
                binding.
              </li>
              <br />
              <br />
              <li>
                <b>Transferability</b>
                <br />
                <br />
                We can transfer, delegate or assign our rights under this Terms
                without your consent. You must obtain our written consent to
                transfer, assign or delegate your rights under these Terms.
              </li>
            </ol>
          </Col>
        </Row>
      </Container>
    );
  }

  function printPrivacyPolicy() {
    return (
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
        <Row>
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
                    href="https://seize.io/cookie-policy"
                    target="_blank"
                    rel="noreferrer">
                    seize.io/cookie-policy
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
    );
  }

  function printLicense() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">LICENSE</h1>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>
              <b>The Memes and Meme Lab</b>
            </p>
            <p>
              The Memes and Meme Lab NFTs are released by the artists and by
              6529 Collections under a Creative Commons 0 &#40;CC0&#41; license,
              which is a public domain license. The author or authors of The
              Memes cards are renouncing any copyright in The Meme cards to the
              maximum extent allowed by law.
            </p>
            <p>
              Link to the formal text of the CC0 license:{" "}
              <a
                href="https://creativecommons.org/share-your-work/public-domain/cc0/"
                target="_blank"
                rel="noreferrer">
                https://creativecommons.org/share-your-work/public-domain/cc0/
              </a>
            </p>
            <p>
              This means that whether or not you own a Meme card, you are free
              to use the art of The Memes for whatever purpose you like, for
              commercial or non-commercial use, without any requirement to seek
              permission from us. You can make derivative works, you can
              copy-paste-mint the cards themselves, you can compete with The
              Memes with a derivative or identical collection, you can make
              &quot;merch&quot;, and, generally, you can do whatever you like.
            </p>
            <p>
              The community term for derivative works is &quot;ReMemes&quot; but
              you do not have to call your work ReMemes. Our goal is for the
              messages embodied in the Meme Cards to spread around the world, to
              different people, in different cultures and countries, who speak
              different languages and have different cultural contexts. As such,
              we{" "}
              <b>
                <u>actively encourage</u>
              </b>{" "}
              you to use The Meme cards in whatever way you like.
            </p>
            <p>
              We love learning about what you are doing with The Memes so please
              feel free to share or to brainstorm ideas, but do not wait for
              permission from us before proceeding. Permission is not required
              and also we receive a lot of messages so we might not see your
              message, so don&apos;t sit around waiting for us to reply.
            </p>
            <p>
              It is possible that some Meme Cards contain copyrighted elements
              that are{" "}
              <b>
                <u>not</u>
              </b>{" "}
              in the public domain. You should assume that these elements{" "}
              <b>
                <u>cannot be used in isolation</u>
              </b>{" "}
              because they have not been placed in the public domain and we do
              not have the legal right to place them in the public domain.
            </p>
            <p>
              For example, Meme Card #1 is a derivative of Punk 6529, the
              copyright for which is owned by Yuga Labs. We are putting the
              transformative derivative work, the card itself, in the public
              domain. That means if you use Meme Card #1, we will not pursue any
              claims against you.
            </p>
            <p>
              We do not have the right to put Punk 6529 into the public domain
              nor can we authorize use of trademark &quot;Cryptopunks&quot; -
              that trade name is also owned by Yuga Labs. We waive any
              responsibility for damages you may suffer for using The Memes in a
              way that infringes on the rights of third parties.
            </p>
            <p>
              <b>Gradient</b>
            </p>
            <p>
              The Gradient NFTs are released under a permissive license, but
              with some provisions to protect end-users from possible risks. In
              general, we do not mind if people use the Gradient NFTs, so long
              as they do not use it in a way that could lead to confusion about
              if the product or service is offered by 6529. Given that we use
              the Gradient as our logo, we are concerned about situations where
              someone might for example run a phishing website with a Gradient
              logo. If we released the Gradient as a CC0 NFT, we would not have
              any recourse in this situation.
            </p>
            <p>
              Specific examples:
              <ul>
                <br />
                <li>
                  Whether or not you are a Gradient hodler, feel free to use the
                  Gradient in NFTs, other artwork, or physical products, for
                  commercial or non-commercial use, so long as it does not
                  purport to be offered from 6529.
                </li>
                <br />
                <li>
                  You are <b>not allowed</b> to use a Gradient to run an online
                  service that may be confused as a 6529-run service, due to the
                  risk of phishing. If you would like to run an online service
                  that includes a Gradient in its branding, you must have our
                  permission first.
                </li>
                <br />
                <li>
                  Gradient hodlers feel free to use their specific Gradient and
                  Gradient Number &#40;e.g. Gradient #88&#41; in an online
                  service&apos;s branding, so long as the service does not
                  purport to be offered by 6529.
                </li>
              </ul>
            </p>
            <p>
              While we hope the above model will be workable, we reserve the
              right to adjust this license, at our sole discretion. No &quot;IP
              rights&quot; have ever been promised to Gradient hodlers and
              Gradient hodlers should not buy a Gradient based on the
              expectation of any &quot;IP rights&quot;, including the above,
              being available.
            </p>
          </Col>
        </Row>
      </Container>
    );
  }
  
  function printCookiePolicy() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">COOKIE POLICY</h1>
          </Col>
        </Row>
        <Row>
          <Col className={`${styles.lastUpdateText} text-right pt-3 pb-3`}>
            Last Updated: February 13, 2023
          </Col>
        </Row>
        <Row>
          <Col>
            <>
				<h2>Cookie List</h2><br/><br/>
				<p>A cookie is a small piece of data (text file) that a website – when visited by a user – asks your browser to store on your device in order to remember information about you. Those cookies are set by us and called first-party cookies. More specifically, we use cookies and other tracking technologies for the following purposes:</p>
				<h3>Strictly Necessary Cookies</h3><br/><br/>
				<p>These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services. You can set your browser to block or alert you about these cookies, but some parts of the site will not then work. These cookies do not store any personally identifiable information.</p>
				<Table className={styles.cookiePolicyTable}>
				  <tr>
					<th>Domain</th>
					<th>Cookies</th>
					<th>Cookies used</th>
					<th>Lifespan</th>
				  </tr>
				  <tr>
					<td>seize.io</td>
					<td><a href="https://cookiepedia.co.uk/cookies/AWSALBTGCORS">AWSALBTGCORS</a></td>
					<td>First Party</td>
					<td>7 days</td>
				  </tr>
				  <tr>
					<td>seize.io</td>
					<td><a href="https://cookiepedia.co.uk/cookies/AWSALBTG">AWSALBTG</a></td>
					<td>First Party</td>
					<td>7 days</td>
				  </tr>
				</Table>
				<br/>
				<h3>Performance Cookies</h3><br/><br/>
				<p>These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous. If you do not allow these cookies we will not know when you have visited our site, and will not be able to monitor its performance.</p>
				<Table className={styles.cookiePolicyTable}>
				  <tr>
					<th>Domain</th>
					<th>Cookies</th>
					<th>Cookies used</th>
					<th>Lifespan</th>
				  </tr>
				  <tr>
					<td>.seize.io</td>
					<td><a href="https://cookiepedia.co.uk/cookies/_ga_">_ga_71NLVV3KY3</a></td>
					<td>First Party</td>
					<td>372 days</td>
				  </tr>
				  <tr>
					<td>.seize.io</td>
					<td><a href="https://cookiepedia.co.uk/cookies/_ga">_ga</a></td>
					<td>First Party</td>
					<td>372 days</td>
				  </tr>
				</Table>
            </>
          </Col>
        </Row>
      </Container>
    );
  }

  function printContent() {
    switch (props.section) {
      case AboutSection.MEMES:
        return printMemes();
      case AboutSection.MEMES_CALENDAR:
        return printMemesCalendar();
      case AboutSection.MEME_LAB:
        return printMemeLab();
      case AboutSection.GRADIENTS:
        return printGradient();
      case AboutSection.FAQ:
        return printFAQ();
      case AboutSection.MISSION:
        return printMission();
      case AboutSection.RELEASE_NOTES:
        return printReleaseNotes();
      case AboutSection.CONTACT_US:
        return printContactUs();
      case AboutSection.TERMS_OF_SERVICE:
        return printTermsOfService();
      case AboutSection.PRIVACY_POLICY:
        return printPrivacyPolicy();
      case AboutSection.LICENSE:
        return printLicense();
	  case AboutSection.COOKIE_POLICY:
        return printCookiePolicy();
    }
  }
  return <Col className={styles.aboutMenuRight}>{printContent()}</Col>;
}
