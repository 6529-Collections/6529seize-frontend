import { Col, Container, Row } from "react-bootstrap";
import Head from "next/head";
import { AboutSection } from "../../pages/about/[section]";

export default function AboutLicense() {
  return (
    <>
      <Head>
        <title>About - License | 6529 SEIZE</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="About - License | 6529 SEIZE" />
        <meta
          property="og:url"
          content={`${process.env.BASE_ENDPOINT}/about/${AboutSection.LICENSE}`}
        />
        <meta property="og:title" content={`About - License`} />
        <meta property="og:description" content="6529 SEIZE" />
        <meta
          property="og:image"
          content={`${process.env.BASE_ENDPOINT}/Seize_Logo_Glasses_2.png`}
        />
      </Head>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">LICENSE</h1>
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
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
    </>
  );
}
