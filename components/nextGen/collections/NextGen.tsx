import styles from "./NextGen.module.scss";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import { NextGenCollection } from "../../../entities/INextgen";
import {
  NextGenCountdown,
  NextGenMintCounts,
  NextGenPhases,
} from "./collectionParts/NextGenCollectionHeader";
import { formatNameForUrl, getStatusFromDates } from "../nextgen_helpers";
import { Status } from "../nextgen_entities";
import NextGenCollectionArtist from "./collectionParts/NextGenCollectionArtist";

interface Props {
  collection: NextGenCollection;
}

export default function NextGen(props: Readonly<Props>) {
  const available = props.collection.total_supply - props.collection.mint_count;

  return (
    <>
      <div className={styles.nextgenBannerWrapper}>
        <div className={styles.nextgenBanner} />
        <Container>
          <Row>
            <Col>
              <Container className="pt-5 pb-5 no-padding">
                <Row>
                  <Col sm={12} md={6}>
                    <Row>
                      <Col>
                        <NextGenPhases
                          collection={props.collection}
                          available={available}
                        />
                      </Col>
                    </Row>
                    <Row className="pt-2">
                      <Col>
                        <a
                          href={`/nextgen/collection/${formatNameForUrl(
                            props.collection.name
                          )}`}
                          className="decoration-none">
                          <h2 className="font-color mb-0">
                            <b>
                              #{props.collection.id} - {props.collection.name}
                            </b>
                          </h2>
                        </a>
                      </Col>
                    </Row>
                    <Row className="pt-3 font-larger font-color font-bolder">
                      <Col>
                        by{" "}
                        <b>
                          <a href={`/${props.collection.artist_address}`}>
                            {props.collection.artist}
                          </a>
                        </b>
                      </Col>
                    </Row>
                    <Row className="pt-3 font-larger font-color font-bolder">
                      <Col>
                        <NextGenMintCounts collection={props.collection} />
                      </Col>
                    </Row>
                    <DistributionLink
                      collection={props.collection}
                      class="pt-3 font-bolder font-larger"
                    />
                    <Row className="pt-4">
                      <Col>
                        <NextGenCountdown collection={props.collection} />
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </div>
      <Container className="pt-5">
        <Row>
          <Col className="font-larger">
            <b>NextGen</b> is a dynamic platform tailored for the creation and
            exploration of generative NFT art, positioning itself at the
            intersection of art, technology, and blockchain. It empowers artists
            and creators to use algorithmic methods to generate unique, digital
            artworks that are tokenized as non-fungible tokens (NFTs). This
            ensures each piece of art is one-of-a-kind, owned and traded
            securely on the blockchain. NextGen not only revolutionizes how art
            is created and collected but also offers a new avenue for artists to
            express themselves digitally, providing them with a global stage to
            showcase their creativity and for collectors to discover and invest
            in digital art like never before.
          </Col>
        </Row>
      </Container>
      <Container className="pt-5 pb-5">
        <Row>
          <Col>
            <h1>FEATURED ARTIST</h1>
          </Col>
        </Row>
        <Row>
          <Col>
            <NextGenCollectionArtist collection={props.collection} />
          </Col>
        </Row>
      </Container>
    </>
  );
  // return (
  //   <Container className="no-padding">
  //     <Row className="pt-3 pb-3">
  //       <Col>
  //         <h1 className="mb-0">FEATURED COLLECTION</h1>
  //       </Col>
  //     </Row>
  //     <Row>
  //       <Col sm={12} md={6} className="pt-2">
  //         <a
  //           href={`/nextgen/collection/${formatNameForUrl(
  //             props.collection.name
  //           )}`}
  //           className="decoration-none">
  //           <Image
  //             loading="eager"
  //             width="0"
  //             height="0"
  //             style={{
  //               height: "auto",
  //               width: "auto",
  //               maxHeight: "100%",
  //               maxWidth: "100%",
  //               padding: "10px",
  //             }}
  //             src={props.collection.image}
  //             alt={props.collection.name}
  //           />
  //         </a>
  //       </Col>
  //       <Col sm={12} md={6} className="pt-3">
  //         <Container className="no-padding">
  //           <Row>
  //             <Col>
  //               <NextGenPhases
  //                 collection={props.collection}
  //                 available={available}
  //               />
  //             </Col>
  //           </Row>
  //           <Row className="pt-2">
  //             <Col>
  //               <a
  //                 href={`/nextgen/collection/${formatNameForUrl(
  //                   props.collection.name
  //                 )}`}
  //                 className="decoration-none">
  //                 <h2 className="font-color mb-0">
  //                   #{props.collection.id} - {props.collection.name}
  //                 </h2>
  //               </a>
  //             </Col>
  //           </Row>
  //           <Row className="pt-3 font-larger font-color">
  //             <Col>
  //               by{" "}
  //               <b>
  //                 <a href={`/${props.collection.artist_address}`}>
  //                   {props.collection.artist}
  //                 </a>
  //               </b>
  //             </Col>
  //           </Row>
  //           <Row className="pt-3 font-larger font-color">
  //             <Col>
  //               <NextGenMintCounts collection={props.collection} />
  //             </Col>
  //           </Row>
  //           <DistributionLink collection={props.collection} class="pt-3" />
  //           <Row className="pt-4">
  //             <Col>
  //               <NextGenCountdown collection={props.collection} />
  //             </Col>
  //           </Row>
  //         </Container>
  //       </Col>
  //     </Row>
  //   </Container>
  // );
}

export function DistributionLink(
  props: Readonly<{
    collection: NextGenCollection;
    class: string;
  }>
) {
  const alStatus = getStatusFromDates(
    props.collection.allowlist_start,
    props.collection.allowlist_end
  );

  if (alStatus !== Status.UNAVAILABLE) {
    return (
      <Container className="no-padding">
        <Row className={`pt-1 font-color ${props.class}`}>
          <Col>
            <a
              href={`/nextgen/collection/${formatNameForUrl(
                props.collection.name
              )}/distribution-plan`}>
              Distribution Plan
            </a>
          </Col>
        </Row>
      </Container>
    );
  }
  return <></>;
}
