import styles from "./About.module.scss";
import { Col, Container, Row } from "react-bootstrap";

export default function AboutLicense() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>License</h1>
        </Col>
      </Row>
      <Row>
        <Col className={`${styles.lastUpdateText} text-right pt-3 pb-3`}>
          Last Updated: February 23, 2023
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p>
            <b>The Memes and Meme Lab</b>
          </p>
          <p>
            The Memes and Meme Lab NFTs are released by the artists under a
            Creative Commons 0 (CC0) license, which is a public domain license.
            The author or authors of The Memes and Meme Lab NFTs are renouncing
            any copyright in The Memes and Meme Lab NFTs to the maximum extent
            allowed by law.
          </p>
          <p>
            Link to the formal text of the CC0 license:{" "}
            <a
              href="https://creativecommons.org/share-your-work/public-domain/cc0/"
              target="_blank"
              rel="noopener noreferrer">
              https://creativecommons.org/share-your-work/public-domain/cc0/
            </a>
          </p>
          <p>
            This means that, whether or not you own a The Memes or Meme Lab NFT,
            the artists don&apos;t mind if you use the art of The Memes or Meme
            Lab NFT for whatever purpose you like, for commercial or
            non-commercial use, without any requirement to seek permission from
            them.
          </p>
          <p>
            The community term for derivative works based on The Memes is
            &quot;ReMemes&quot;, but you do not have to call your work ReMemes.
            The goal is for the messages embodied in the Meme Cards to spread
            around the world, to different people, in different cultures and
            countries, who speak different languages and have different cultural
            contexts.
          </p>
          <p>
            It is possible that some Meme Cards contain copyrighted elements
            that are not in the public domain. For example, Meme Card #1 is a
            derivative of Punk 6529, the copyright for which is owned by Yuga
            Labs. &#64;
            <a href="https://x.com/6529er" target="_blank" rel="noopener noreferrer">
              6529er
            </a>{" "}
            , the artist, is putting whatever rights he may have in Meme Card #1
            in the public domain. That means if you use Meme Card #1, he will
            not pursue any claims against you. But he does not have the right to
            put Punk 6529 into the public domain (only Yuga Labs can do that).
            He also cannot authorize use of trademark &quot;Cryptopunks&quot; -
            the trademark is also owned by Yuga Labs.
          </p>
          <p>
            Neither 6529 Collection LLC nor the artists are responsible for
            damages you may suffer for infringement on the rights of third
            parties.
          </p>
          <br />
          <p>
            <b>6529 Gradient</b>
          </p>
          <p>
            In general, we do not mind if people use the Gradient NFTs as we
            have seen them used in some art and memes, but we are concerned
            about people impersonating 6529 (for example, to operate a phishing
            website).
          </p>
          <p>
            Please do not use the Gradient NFTs in a way that could lead to
            confusion about whether any product or service you are selling is
            offered by 6529. For these reasons, we are treating the Gradient
            NFTs differently from The Memes and Meme Lab NFTs at this point in
            time. The Gradient NFTs have not, at this point in time, been
            released under the CC0 license.
          </p>
          <p>
            We are working on a more detailed policy to give more clarity around
            how people can use the Gradient NFTs without getting further
            permissions in advance, but, until then, we reserve all
            &quot;IP&quot; rights in the Gradient NFTs. No &quot;IP rights&quot;
            have ever been promised to Gradient collectors and Gradient
            collectors should not buy a Gradient based on the expectation of any
            &quot;IP rights&quot; being available.
          </p>
        </Col>
      </Row>
    </Container>
  );
}
