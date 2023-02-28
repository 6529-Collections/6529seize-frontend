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
            <p>
              <b>General Methodology</b>
            </p>
            <ul>
              <li>The log is updated in reverse chronological order</li>
              <li>Major site-wide releases are incremented as 1.x.x</li>
              <li>New features are incremented as x.1.x</li>
              <li>Small updates or bug fixes are incremented as x.x.1</li>
            </ul>
            <br />
            <p>
              <b>Release 1.0.1</b>
              <br />
              Feb 29, 2023
            </p>
            <ul>
              <li>
                Fixed bug where in some cases wallet connectors would be
                duplicated under the Connect button dropdown.
              </li>
              <li>
                Changed User page to use radio buttons for &apos;All&apos;,
                &apos;Seized&apos;, &apos;Unseized&apos; as opposed to
                &apos;Hide Seized&apos;, &apos;Hide Non-Seized&apos; switches
              </li>
              <li>
                Introduced search functionality by wallet address and ENS in
                Comunity Table
              </li>
              <li>Added Volume tab in The Memes page and Meme Lab Page</li>
              <li>
                Added Volumes table for each Meme and Meme Lab Card under
                Activity
              </li>
              <li>Added profile link in User page</li>
              <li>Reposition card balance to not hide the art</li>
              <li>Added SZN filter in User page</li>
            </ul>
            <br />
            <p>
              <b>Release 1.0.0</b>
              <br />
              Feb 24, 2023
              <br />
              This release is the initial site launch. Given Release 1.0.0 is
              the initial release and is a broad release, the log for this
              release will be less detailed on a per-feature basis than
              subsequent logs will be.
            </p>
            <p>The initial release includes:</p>
            <ul>
              <li>Initial release of seize.io</li>
              <li>Information and statistics about The Memes NFTs</li>
              <li>Information and statistics about Meme Lab NFTs</li>
              <li>Information and statistics about 6529 Gradient NFTs </li>
              <li>
                Information and statistics about collectors of The Memes and
                Gradient NFTs
              </li>
              <li>Ability to connect a wallet to see your own owned NFTs</li>
              <li>Activity logs of purchases and transfers of NFTs</li>
              <li>Various informational pages</li>
            </ul>
          </Col>
        </Row>
      </Container>
    </>
  );
}
