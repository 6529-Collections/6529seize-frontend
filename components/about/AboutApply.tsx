import { Col, Container, Row } from "react-bootstrap";

export default function AboutApply() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>Apply</h1>
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col>
          <p>
            We accept third-party and self-nominations to be Meme Card artists.
          </p>
          <p>
            Please send an email to{" "}
            <a
              href="mailto:collections@6529.io"
              target="_blank"
              rel="noreferrer">
              collections&#64;6529.io
            </a>{" "}
            with:
          </p>
          <ul>
            <li>Your name</li>
            <br />
            <li>Your twitter handle</li>
            <br />
            <li>A link to your work</li>
            <br />
            <li>Anything you would like us to know</li>
          </ul>
          <br />
          <p>Please note:</p>
          <ul>
            <li>We are currently working on mints 2-3 months in the future</li>
            <br />
            <li>
              We are generally overwhelmed with messages so we might be slow to
              respond or might forget to respond. Please do not take it
              personally - we are doing our best!
            </li>
          </ul>
        </Col>
      </Row>
    </Container>
  );
}
