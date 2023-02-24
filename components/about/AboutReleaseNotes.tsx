import { Col, Container, Row } from "react-bootstrap";

export default function AboutReleaseNotes() {
  return (
    <>
      <Container>
        <Row>
          <Col className="text-center">
            <h1 className="float-none">RELEASE NOTES</h1>
          </Col>
        </Row>
        <Row className="pt-3 pb-3">
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
            </p>
            <ul>
              <li>Details about all Meme Cards</li>
              <li>Details about all Gradient</li>
              <li>Community Metrics</li>
              <li>Activity logs of purchases and transfers of Meme Cards</li>
              <li>Various informational pages</li>
            </ul>
          </Col>
        </Row>
      </Container>
    </>
  );
}
