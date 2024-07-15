import styles from "./ManifoldMinting.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import useManifoldClaim, { ManifoldClaim } from "../../hooks/useManifoldClaim";
import { useEffect, useState } from "react";
import { ManifoldInstance, getTraitValue } from "./manifold-types";
import { Spinner } from "../dotLoader/DotLoader";
import NFTImage from "../nft-image/NFTImage";
import Link from "next/link";
import {
  capitalizeEveryWord,
  fromGWEI,
  numberWithCommas,
  parseNftDescriptionToHtml,
} from "../../helpers/Helpers";
import { Time } from "../../helpers/time";
import NFTAttributes from "../nftAttributes/NFTAttributes";
import ManifoldMintingWidget from "./ManifoldMintingWidget";
import {
  ETHEREUM_ICON_TEXT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
} from "../../constants";
import MemePageMintCountdown from "../the-memes/MemePageMintCountdown";

interface Props {
  title: string;
  contract: string;
  proxy: string;
  abi: any;
  token_id: number;
}

export default function ManifoldMinting(props: Readonly<Props>) {
  const [isError, setIsError] = useState<boolean>(false);

  const [descriptionClamped, setDescriptionClamped] = useState<boolean>(true);

  const manifoldClaim = useManifoldClaim(
    props.contract,
    props.proxy,
    props.abi,
    props.token_id,
    () => {
      setIsError(true);
    }
  );

  const [fee, setFee] = useState<number>(0);

  const [fetching, setFetching] = useState<boolean>(true);

  const [instance, setInstance] = useState<ManifoldInstance>();
  const [nftImage, setNftImage] = useState<any>();
  const [artist, setArtist] = useState<{
    name: string | undefined;
    handle: string | undefined;
  }>();

  useEffect(() => {
    if (manifoldClaim?.instanceId) {
      fetch(
        `https://apps.api.manifoldxyz.dev/public/instance/data?id=${manifoldClaim.instanceId}`
      )
        .then((response) => {
          response.json().then((data: ManifoldInstance) => {
            setInstance(data);
            const nftImage = {
              id: data.id,
              contract: props.contract,
              name: data.publicData.asset.name,
              image: data.publicData.asset.image_url,
              animation: data.publicData.asset.animation_url,
              icon: "",
              thumbnail: "",
              scaled: "",
              metadata: data.publicData.asset,
            };
            setNftImage(nftImage);
            setArtist({
              name: getTraitValue(data, "Artist"),
              handle: getTraitValue(data, "SEIZE Artist Profile"),
            });
          });
        })
        .catch((error) => {
          console.error("Error fetching instance data", error);
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [manifoldClaim?.instanceId]);

  function printMint() {
    if (!manifoldClaim) {
      return <></>;
    }

    return (
      <ManifoldMintingWidget
        contract={props.contract}
        proxy={props.proxy}
        abi={props.abi}
        claim={manifoldClaim}
        merkleTreeId={instance!.publicData.instanceAllowlist?.merkleTreeId}
        setFee={(f: number) => {
          setFee(f);
        }}
      />
    );
  }

  function printTitle() {
    return (
      <Row className="pb-2">
        <Col className="d-flex align-items-center gap-2 ">
          <h2 className="mb-0">
            <span className="font-lightest">Mint</span> {props.title}
          </h2>
          <span className="badge bg-white text-dark">beta</span>
        </Col>
      </Row>
    );
  }

  function printDistributionLink() {
    let contractPath;
    switch (props.contract) {
      case MEMES_CONTRACT:
        contractPath = "the-memes";
        break;
      case MEMELAB_CONTRACT:
        contractPath = "meme-lab";
        break;
      default:
        contractPath = props.contract;
        break;
    }
    return (
      <Link href={`/${contractPath}/${props.token_id}/distribution`}>
        Distribution Plan
      </Link>
    );
  }

  function printDescription(i: ManifoldInstance) {
    return (
      <Container className="no-padding">
        <Row>
          <Col>
            <span
              className={descriptionClamped ? styles.descriptionClamped : ""}
              dangerouslySetInnerHTML={{
                __html: parseNftDescriptionToHtml(
                  i.publicData.asset.description
                ),
              }}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <button
              className="btn btn-link decoration-none"
              onClick={() => setDescriptionClamped(!descriptionClamped)}>
              <span className="font-smaller font-color-silver font-color-hover">
                {descriptionClamped ? "+ SHOW MORE" : "- SHOW LESS"}
              </span>
            </button>
          </Col>
        </Row>
      </Container>
    );
  }

  function printActions(
    instance: ManifoldInstance,
    manifoldClaim: ManifoldClaim
  ) {
    return (
      <Col sm={{ span: 12, order: 2 }} md={{ span: 5, order: 1 }}>
        <Container className="no-padding">
          <Row className="pt-2 pb-2">
            <Col xs={12}>
              <h3 className="pb-3">{instance.publicData.asset.name}</h3>
            </Col>
            <Col xs={12}>{printDescription(instance)}</Col>
            <Col xs={12} className="pt-3">
              <Table className={styles.spotsTable}>
                <tbody>
                  <tr>
                    <td className="pt-2">Edition Size</td>
                    <td className="pt-2">
                      <span className="d-flex align-items-center gap-1">
                        <b>
                          {numberWithCommas(manifoldClaim.total)} /{" "}
                          {numberWithCommas(manifoldClaim.totalMax)}
                          {manifoldClaim.remaining > 0 && (
                            <> ({manifoldClaim.remaining} remaining)</>
                          )}
                        </b>
                        {manifoldClaim.isFetching && <Spinner dimension={12} />}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col xs={12} className="pt-3">
              {printMint()}
            </Col>
          </Row>
          <Row>
            <Col>
              <MemePageMintCountdown
                nft_id={props.token_id}
                hide_mint_btn={true}
              />
            </Col>
          </Row>
          {/* <Row>
            <Col>{printMint()}</Col>
          </Row> */}
        </Container>
      </Col>
    );
  }

  function printImage() {
    return (
      <Col sm={{ span: 12, order: 1 }} md={{ span: 7, order: 2 }}>
        <NFTImage
          nft={nftImage}
          animation={true}
          height="full"
          balance={-1}
          showUnseized={false}
          transparentBG={true}
        />
      </Col>
    );
  }

  if (fetching) {
    return (
      <Container className="pt-4 pb-4">
        {printTitle()}
        <Row className="pt-2">
          <Col className="d-flex align-items-center gap-3">
            {isError ? (
              <span>Error fetching mint information</span>
            ) : (
              <>
                <span>Retrieving Mint information</span>
                <Spinner />
              </>
            )}
          </Col>
        </Row>
      </Container>
    );
  }

  if (!manifoldClaim || !instance || !nftImage) {
    return (
      <Container className="pt-4 pb-4">
        {printTitle()}
        <Row>
          <Col>
            <p>No mint information found</p>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="pt-4 pb-4">
      <Row className="pb-3">
        {printImage()}
        {printActions(instance, manifoldClaim)}
      </Row>
      <hr />
      <Row className="pb-2">
        <Col sm={12} md={6} className="pt-1 pb-1">
          <Table className={styles.spotsTable}>
            <tbody>
              {artist && (
                <tr>
                  <td className="pt-2">Artist</td>
                  <td className="pt-2">
                    <b>
                      {artist?.handle ? (
                        <Link href={`/${artist.handle}`}>{artist.name}</Link>
                      ) : (
                        artist.name
                      )}
                    </b>
                  </td>
                </tr>
              )}
              <tr>
                <td className="pt-2">Minting Approach</td>
                <td className="pt-2">
                  <b>{printDistributionLink()}</b>
                </td>
              </tr>
              <tr>
                <td className="pt-2">Edition Size</td>
                <td className="pt-2">
                  <span className="d-flex align-items-center gap-1">
                    <b>
                      {numberWithCommas(manifoldClaim.total)} /{" "}
                      {numberWithCommas(manifoldClaim.totalMax)}
                      {manifoldClaim.remaining > 0 && (
                        <> ({manifoldClaim.remaining} remaining)</>
                      )}
                    </b>
                    {manifoldClaim.isFetching && <Spinner dimension={12} />}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="pt-2">Mint Price</td>
                <td className="pt-2">
                  <b>
                    {fromGWEI(manifoldClaim.cost).toFixed(5)}{" "}
                    {ETHEREUM_ICON_TEXT}
                  </b>
                </td>
              </tr>
              <tr>
                <td className="pt-2">Status</td>
                <td className="pt-2">
                  <b>{capitalizeEveryWord(manifoldClaim.status)}</b>
                </td>
              </tr>
            </tbody>
          </Table>
        </Col>
        <Col sm={12} md={6} className="pt-1 pb-1">
          <Table className={styles.spotsTable}>
            <tbody>
              <tr>
                <td className="pt-2">Phase</td>
                <td className="pt-2">
                  <b>{manifoldClaim.phase}</b>
                </td>
              </tr>
              <tr>
                <td className="pt-2">Phase Start</td>
                <td className="pt-2">
                  <b>
                    {Time.seconds(
                      manifoldClaim.startDate
                    ).toIsoDateTimeString()}{" "}
                    UTC
                  </b>
                </td>
              </tr>
              <tr>
                <td className="pt-2">Phase End</td>
                <td className="pt-2">
                  <b>
                    {Time.seconds(manifoldClaim.endDate).toIsoDateTimeString()}{" "}
                    UTC
                  </b>
                </td>
              </tr>
              <tr>
                <td className="pt-2">Manifold Fee</td>
                <td className="pt-2">
                  <b>
                    {fee ? (
                      <>
                        {fromGWEI(fee).toFixed(5)} {ETHEREUM_ICON_TEXT}
                      </>
                    ) : (
                      <>-</>
                    )}
                  </b>
                </td>
              </tr>
              <tr>
                <td className="pt-2">Total Price Per Token</td>
                <td className="pt-2">
                  <b>
                    {fromGWEI(manifoldClaim.cost + fee).toFixed(5)}{" "}
                    {ETHEREUM_ICON_TEXT}
                  </b>
                </td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>
      <hr />
      <Row className="pt-3 pb-3">
        <Col>
          <NFTAttributes attributes={instance.publicData.asset.attributes} />
        </Col>
      </Row>
    </Container>
  );
}
