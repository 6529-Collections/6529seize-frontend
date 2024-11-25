import { Col, Container, Row } from "react-bootstrap";

export default function AboutDataDecentral() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="font-lightest">Data</span> Decentralization
          </h1>
        </Col>
      </Row>
      <Row className="pt-3 pb-3">
        <Col className="text-left">
          <p>
            One of our goals is to demonstrate how applications can be built in
            a decentralized manner.
          </p>
          <p>
            Effectively all information on 6529.io comes from on-chain or
            public sources or is derived in transparent ways from on-chain or
            public sources. This means anyone can replicate the data available
            on this site for a website or application of their own, without
            seeking permission from us and without any dependency on us.
          </p>
          <p>This page shares the source of all data displayed on 6529.io.</p>
          <p>On-Chain (Ethereum)</p>
          <ul>
            <li>The token #</li>
            <li>
              The location (URI/URL) of the JSON with the token&apos;s metadata
            </li>
            <li>The collectors&apos; Ethereum addresses</li>
            <li>
              The collectors&apos; NFTs currently owned, as well as bought, sold
              or transfered
            </li>
            <li>ENS addresses of collectors</li>
          </ul>
          <p>Arweave (Decentralized storage)</p>
          <ul>
            <li>The image of the art associated with each NFT</li>
            <li>The metadata for the NFT</li>
          </ul>
          <p>OpenSea API</p>
          <ul>
            <li>NFT listing prices on OpenSea</li>
          </ul>
          <p>Internal Database</p>
          <ul>
            <li>
              6529 Team addresses. A record of these can be found on Arweave{" "}
              <a
                href={`https://arweave.net/fy83ffOGqR9cR2zooI7u9JxsG0oEWVJxH3B-bNxXKJg`}
                target="_blank"
                rel="noreferrer">
                here
              </a>
              . We will move this list 100% on-chain in the coming weeks.
            </li>
          </ul>
          <p>Internally Calculated / Computed</p>
          <ul>
            <li>
              Thumbnail images to match the site design (transformed from the
              original image from Arweave)
            </li>
            <li>
              TDH values (calculated from on-chain data, using this formula. We
              will release sample code for this calculation soon)
            </li>
          </ul>
          <p>Compiled 6529.io Data</p>
          <ul>
            <li>
              Even though everyone can compile and calculate the same data as
              us, we also export daily all our compiled and calculated data for
              the convenience of those without programming backgrounds
            </li>
            <li>
              Every day, we post our complete set of on-chain and calculated
              values shown on the site to Arweave as a CSV. The specific links
              can be found{" "}
              <a href={`/open-data`} target="_blank" rel="noreferrer">
                here
              </a>
              .
            </li>
          </ul>
        </Col>
      </Row>
    </Container>
  );
}
