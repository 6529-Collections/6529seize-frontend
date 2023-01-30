import styles from "./About.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import Image from "next/image";

export enum AboutSection {
  MEMES = "the-memes",
  MEMES_CALENDAR = "memes-calendar",
  MEMES_FAQ = "memes-faq",
  GRADIENTS = "6529-gradient",
  GRADIENTS_FAQ = "gradients-faq",
  MISSION = "mission",
  RELEASE_NOTES = "release-notes",
  CONTACT_US = "contact-us",
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
            <img
              src="/memes-preview.png"
              className={styles.collectionImage}
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
              From “Just Do It” to “Digital Gold” to “Yes We Can” / “Make
              America Great Again,” those who control the best memes, control
              societal resources.
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

  function printMemesFAQ() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">MEMES FAQ</h1>
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
            <img
              src="/gradients-preview.png"
              alt="6529 Gradient"
              className={styles.collectionImage}
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
              <a href="https://twitter.com/punk6529/status/1460721601318690831">
                invited every holder of a Gradient
              </a>{" "}
              to display an NFT of their choice in a new{" "}
              <a href="https://oncyber.io/6529gradients">
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

  function printGradientsFAQ() {
    return (
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">GRADIENTS FAQ</h1>
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
              <u>
                <b>v1.0.0</b>
              </u>
            </p>
            <p>
              <b>Release Date: TBC</b>
            </p>
            <p>Details</p>
            <p>
              <ul>
                <li>
                  <b>Initial Launch 🚀</b>
                </li>
              </ul>
            </p>
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
      case AboutSection.MEMES_FAQ:
        return printMemesFAQ();
      case AboutSection.GRADIENTS:
        return printGradient();
      case AboutSection.GRADIENTS_FAQ:
        return printGradientsFAQ();
      case AboutSection.MISSION:
        return printMission();
      case AboutSection.RELEASE_NOTES:
        return printReleaseNotes();
      case AboutSection.CONTACT_US:
        return printContactUs();
    }
  }
  return <Col className={styles.aboutMenuRight}>{printContent()}</Col>;
}
