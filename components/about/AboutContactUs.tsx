import { Col, Container, Row } from "react-bootstrap";

export default function AboutContactUs() {
  return (
    <>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">CONTACT US</h1>
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
          <Col>
            <p>
              The best way to find us at:{" "}
              <a
                href="https://twitter.com/6529collections"
                target="_blank"
                rel="noreferrer">
                https://twitter.com/6529collections
              </a>
            </p>
            <br />
            <p>Alternative, but not as good, methods to contact us are:</p>
            <ul>
              <li>
                Trying to get the attention of &#64;
                <a
                  href="https://twitter.com/punk6529"
                  target="_blank"
                  rel="noreferrer">
                  punk6529
                </a>{" "}
                or &#64;
                <a
                  href="https://twitter.com/6529er"
                  target="_blank"
                  rel="noreferrer">
                  6529er
                </a>{" "}
                or &#64;
                <a
                  href="https://twitter.com/teexels"
                  target="_blank"
                  rel="noreferrer">
                  teexels
                </a>{" "}
                on Twitter
              </li>
              <br />
              <li>
                Trying to get the attention of &#64;
                <a
                  href="https://twitter.com/punk6529"
                  target="_blank"
                  rel="noreferrer">
                  punk6529
                </a>
                , &#64;
                <a
                  href="https://twitter.com/6529er"
                  target="_blank"
                  rel="noreferrer">
                  6529er
                </a>{" "}
                or &#64;
                <a
                  href="https://twitter.com/teexels"
                  target="_blank"
                  rel="noreferrer">
                  teexels
                </a>{" "}
                in the OM Discord (
                <a
                  href="https://discord.gg/join-om"
                  target="_blank"
                  rel="noreferrer">
                  https://discord.gg/join-om
                </a>
                ). We don&apos;t answer Discord DMs from people we don&apos;t
                already know.
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </>
  );
}
