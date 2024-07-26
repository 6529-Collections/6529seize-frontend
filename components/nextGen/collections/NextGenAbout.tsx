import { Container, Row, Col } from "react-bootstrap";

export default function NextGenAbout() {
  return (
    <Container className="no-padding pt-4">
      <Row className="pb-3">
        <Col>
          <h1>
            <span className="font-lightest">About</span> NextGen
          </h1>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            NextGen is an on-chain generative art NFT contract. It is also a
            tool to support the ambitious aspirations of the 6529 community in
            the areas of art experimentation and decentralized social
            organization.
          </p>
          <p>
            The central 6529 thesis is that, with the popularization of NFTs, we
            now have the complete toolkit available to create decentralized,
            open and transparent social and economic systems.
          </p>
          <p>
            We believe that the classic values of liberal democracies such as
            human rights and public goods / commons should apply in the digital
            domain also and that it is important that the digital domain is not
            exclusively corporate-led.
          </p>
          <p>
            We often call this end-state an &quot;open metaverse&quot;, but
            other names for it could include &quot;a network state focused on
            decentralization&quot; or &quot;a decentralized social system&quot;.
          </p>
          <p>
            Whatever it is called, the desired end-state is 100,000 or 1M or 10M
            or 100M people organizing some meaningful part of their societal
            activities through decentralized systems (blockchains and smart
            contracts). This is what we are trying to build and NextGen is
            another piece of the infrastructure we consider important for this
            mission.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>Overall Approach</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            The fundamental structure of the NextGen contract follows the
            overall approach pioneered by Art Blocks in 2020-2021.
          </p>
          <p>
            <ul>
              <li>
                A single core contract (with various supporter contracts) with
                custom token number spaces to separate out different collections
                by different artists
              </li>
              <li>
                On-chain storage of the generative script and the seed/hash used
                to generate the image
              </li>
              <li>Randomized traits at mint</li>
            </ul>
          </p>
          <p>
            Given the above structure is generally well-understood, we would
            like to focus on a few areas where we have adjusted the standard
            approach to support our specific goals and needs.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>Native Allowlists</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            We believe that allowlists are the best approach for most in-demand
            mints. They support fairness and transparency in minting
            allocations, reduce gas costs, and permit both artists and projects
            to remain in control of their mint price and distribution approach.
          </p>
          <p>
            NextGen natively supports complex allowlists, across multiple
            minting phases.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>Native Delegation</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            We have been a leading voice for wallet safety for a long time and
            design all our systems to encourage 6529 collectors and community
            members to use safe practices when interacting with our website and
            smart contracts.
          </p>
          <p>
            To support this objective, we launched NFTDelegation.com in Spring
            2023 and have been using it within the community to support address
            consolidation and delegation.
          </p>
          <p>
            NextGen is the first NFT contract to support NFTDelegation natively.
            Allowlist members will be able to mint using whichever delegates
            they have active at the time of mint.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>Personalization, Customization and Collector Provenance</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            The classic approach to a generative mint is that the algorithm is
            fully randomly (or pseudo-randomly, to be precise) determined at the
            time of mint. This is a good practice and we are supportive of it.
          </p>
          <p>
            We believe, however, that there are both art and non-art use cases
            that could benefit from the output being influenced by information
            about the collecting or minting address.
          </p>
          <p>This is most easily explained with two examples:</p>
          <p>
            <ul>
              <li>
                Pebbles, for example, will pass some collector information for
                certain mints and adjust the output to reflect their provenance
                in a small way.
              </li>
              <li>
                The NextGen contract has been also deployed by the University of
                Nicosia to deploy student generative art certificates with
                on-chain student information (grade and name).
              </li>
            </ul>
          </p>
          <p>
            We believe this area is largely unexplored and potentially very
            fruitful.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>Extra On-Chain&#8482;</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            Most generative collections, even the on-chain ones, serve an
            off-chain URI with metadata and potentially rendered images, to
            easily interoperate with marketplace and galleries.
          </p>
          <p>
            NextGen mints will start off working in this model, but the NextGen
            contract has the ability to switch metadata and rendering data to be
            100% on-chain.
          </p>
          <p>
            This removes even the smallest dependency from off-chain systems
            and, more importantly, makes the metadata composable on-chain.
          </p>
          <p>
            The combination of the ability to personalize the output and then
            serve the data on-chain is extraordinarily interesting to us.
          </p>
          <p>
            It unlocks the ability to have a form of permanent Art Oracles
            on-chain. We can’t wait to see what people come up with.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>Artist Provenance</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            NextGen allows the artist to cryptographically sign a NextGen
            collection from an ethereum address or ENS of their choice.
          </p>
          <p>
            As our protocol for community-verified identity improves, we hope
            the combination of the two will be able to give assurances of
            &quot;who the artist was&quot; over decades and even centuries.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>Multiple Randomization Methods</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            NextGen supports three different randomization methods with the
            capacity to integrate more approaches in the future.
          </p>
          <p>
            Strictly speaking, all commonly used randomization methods are,
            scientifically speaking, pseudorandom methods but the differences
            have no practical effect in this context. For the purposes for which
            they are used for, they are effectively random.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>Phases / Periodicity</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            NextGen supports a wide range of phased and periodic minting
            approaches, from simple mints to periodic mints that can stretch for
            decades.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>Minting Sales Models</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            NextGen supports all widely used (and some not-widely used) minting
            sales models
          </p>
          <p>
            <ul>
              <li>Airdrops</li>
              <li>Fixed price mints</li>
              <li>Phase priced mints</li>
              <li>Linear descending auction</li>
              <li>Exponentially descending auction</li>
              <li>Linear ascending mint</li>
              <li>Burn-to-mint (internal or external collection)</li>
              <li>Swap-to-mint (internal or external collection)</li>
              <li>Mint-to-auction</li>
            </ul>
          </p>
          <p>
            The combination of Minting Sales Models and Phases can be used to
            create very interesting and experimental minting dynamics.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>On-Chain Libraries</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            NextGen supports the ability for collections to reference on-chain
            libraries to have no off-chain dependencies in rendering.
          </p>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>More Information</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          Additional technical information can be found here:{" "}
          <a
            href="https://seize-io.gitbook.io/nextgen/"
            target="_blank"
            rel="noopener noreferrer">
            https://seize-io.gitbook.io/nextgen/
          </a>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <h3>NextGen Collections Model</h3>
        </Col>
      </Row>
      <Row className="pb-3">
        <Col>
          <p>
            We do not have a fixed plan in place post the genesis Pebbles
            collection and will develop and refine our approach over time.
          </p>
          <p>This is what we currently believe will be our direction:</p>
          <p>
            <ul>
              <li>
                We do not anticipate a large number of NextGen collections in
                the short-term.
                <ul>
                  <li>
                    Generative collections require a lot of work to be done
                    correctly and we only would like to make interesting drops.
                  </li>
                  <li>
                    We have no pressure to mint NextGen collections, so we will
                    mint a collection whenever we feel right about it
                  </li>
                </ul>
              </li>
            </ul>
          </p>
          <p>
            <ul>
              <li>
                We are broadly interested in 3 categories of collections:
                <ul>
                  <li>
                    Collections that support our decentralization objectives
                  </li>
                  <li>
                    Collections that explore interoperability or composability
                    on-chain
                  </li>
                  <li>
                    Collections that are unusual or interesting aesthetically or
                    technically
                  </li>
                </ul>
              </li>
            </ul>
          </p>
          <p>
            <ul>
              <li>
                We have a strong bias towards all NextGen collections being
                released under a CC0 license.
              </li>
            </ul>
          </p>
          <p>
            <ul>
              <li>
                The NextGen contracts are available under an Apache 2
                open-source license
                <ul>
                  <li>
                    Anyone who would like to take advantage of the work and time
                    we have invested in the contracts, is welcome to deploy
                    their own instance of the contracts and mint their own
                    collections.
                  </li>
                  <li>
                    You do not need to ask our permission, but I am sure we will
                    appreciate hearing about what you are doing with the
                    contracts
                  </li>
                </ul>
              </li>
            </ul>
          </p>
          <p>
            If you have an interesting idea along the lines above, please get in
            touch with us. We would love to brainstorm about it and see if it is
            a fit.
          </p>
        </Col>
      </Row>
    </Container>
  );
}
