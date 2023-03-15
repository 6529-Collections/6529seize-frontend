import { Col, Container, Row } from "react-bootstrap";
import { AboutSection } from "../../pages/about/[section]";

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
              <b>Release 1.2.0</b>
              <br />
              Mar 14, 2023
            </p>
            <ul>
              <li>
                Optimized the search functionality in{" "}
                <a href={`/community`} target="_blank" rel="noreferrer">
                  Community
                </a>{" "}
                table
              </li>
              <li>
                Added support for pagination in{" "}
                <a href={`/downloads`} target="_blank" rel="noreferrer">
                  Downloads
                </a>
              </li>
              <li>
                Developed a new Distribution plan page to display the
                distribution plan for each NFT as well as the airdrop list and
                allowlists directly on seize.io and not github. This will be
                visible on the release of The Memes #79.
              </li>
              <li>
                Moved minting links from 6529.io to seize.io domain:
                <br />
                <a
                  href={`https://thememes.seize.io`}
                  target="_blank"
                  rel="noreferrer">
                  https://thememes.seize.io
                </a>
                <br />
                <a
                  href={`https://memelab.seize.io`}
                  target="_blank"
                  rel="noreferrer">
                  https://memelab.seize.io
                </a>
              </li>
              <li>
                About
                <ul>
                  <li>
                    New section to show our support for{" "}
                    <a
                      href={`/about/${AboutSection.GDRC1}`}
                      target="_blank"
                      rel="noreferrer">
                      The Global Digital Rights Charter v1
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
            <br />
            <p>
              <b>Release 1.1.1</b>
              <br />
              Mar 03, 2023
            </p>
            <ul>
              <li>
                Fixed bug that was appearing on the Card titles links on the
                Meme Lab Section causing them to navigate to a wrong page.
              </li>
            </ul>
            <br />
            <p>
              <b>Release 1.1.0</b>
              <br />
              Mar 02, 2023
            </p>
            <ul>
              <li>
                Fixed bug where in some cases wallet connectors would be
                duplicated under the Connect button dropdown.
              </li>
              <li>
                All NFT Images
                <ul>
                  <li>Reposition card balance to not hide the art</li>
                </ul>
              </li>
              <li>
                Community page
                <ul>
                  <li>
                    Introduced search functionality by wallet address and ENS
                  </li>
                  <li>Added &apos;Hide 6529Team&apos; toggle</li>
                </ul>
              </li>
              <li>
                User Page
                <ul>
                  <li>
                    Changed to use radio buttons for &apos;All&apos;,
                    &apos;Seized&apos;, &apos;Unseized&apos; as opposed to
                    &apos;Hide Seized&apos;, &apos;Hide Non-Seized&apos;
                    switches
                  </li>
                  <li>Added profile link</li>
                  <li>Added SZN filter</li>
                  <li>
                    Now showing wallet activity and transactions even if no
                    Cards are currently owned
                  </li>
                </ul>
              </li>
              <li>
                The Memes, Meme Lab, Meme Lab Collections
                <ul>
                  <li>
                    Added Volume tab for:
                    <ul>
                      <li>24 Hours</li>
                      <li>7 Days</li>
                      <li>30 Days</li>
                      <li>All Time</li>
                    </ul>
                  </li>
                </ul>
              </li>
              <li>
                The Memes card page, Meme Lab card page
                <ul>
                  <li>Added Volumes table under Activity tab</li>
                </ul>
              </li>
              <li>
                About
                <ul>
                  <li>
                    New section added{" "}
                    <a
                      href={`/about/${AboutSection.DATA_DECENTR}`}
                      target="_blank"
                      rel="noreferrer">
                      Data Decentralization
                    </a>
                  </li>
                </ul>
              </li>
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
