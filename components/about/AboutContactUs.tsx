import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";

export default function AboutContactUs() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            Contact Us
          </h1>
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p>
            The best way to find us at:{" "}
            <Link
              href="https://x.com/6529collections"
              target="_blank"
              rel="noopener noreferrer">
              https://x.com/6529collections
            </Link>
          </p>
          <p>
            or email us at <a href="mailto:support@6529.io">support@6529.io</a>
          </p>
          <br />
          <p>Alternative, but not as good, methods to contact us are:</p>
          <ul>
            <li>
              Trying to get the attention of &#64;
              <Link
                href="https://x.com/punk6529"
                target="_blank"
                rel="noopener noreferrer">
                punk6529
              </Link>{" "}
              or &#64;
              <Link
                href="https://x.com/6529er"
                target="_blank"
                rel="noopener noreferrer">
                6529er
              </Link>{" "}
              or &#64;
              <Link
                href="https://x.com/teexels"
                target="_blank"
                rel="noopener noreferrer">
                teexels
              </Link>{" "}
              on Twitter
            </li>
            <br />
            <li>
              Trying to get the attention of &#64;
              <Link
                href="https://x.com/punk6529"
                target="_blank"
                rel="noopener noreferrer">
                punk6529
              </Link>
              , &#64;
              <Link
                href="https://x.com/6529er"
                target="_blank"
                rel="noopener noreferrer">
                6529er
              </Link>{" "}
              or &#64;
              <Link
                href="https://x.com/teexels"
                target="_blank"
                rel="noopener noreferrer">
                teexels
              </Link>{" "}
              in the OM Discord (
              <Link
                href="https://discord.gg/join-om"
                target="_blank"
                rel="noopener noreferrer">
                https://discord.gg/join-om
              </Link>
              ). We don&apos;t answer Discord DMs from people we don&apos;t
              already know.
            </li>
          </ul>
          <br />
          <p>
            If, for some strange reason, you would like to send us a letter or
            postcard, you can do so here:
            <br />
            <br />
            6529 Collection LLC
            <br />
            2810 N Church St
            <br />
            #76435 Wilmington, DE 19802-4447
            <br />
            United States of America
          </p>
        </Col>
      </Row>
    </Container>
  );
}
