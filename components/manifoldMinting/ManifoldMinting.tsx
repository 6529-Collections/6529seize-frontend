import styles from "./ManifoldMinting.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import useManifoldClaim from "../../hooks/useManifoldClaim";
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
        <Col sm={12} md={5}>
          <Container className="no-padding">
            <Row className="pt-2 pb-2">
              <Col>
                <h3 className="pb-3">{instance.publicData.asset.name}</h3>
                <Table className={styles.spotsTable}>
                  <tbody>
                    {artist && (
                      <tr>
                        <td>Artist</td>
                        <td>
                          <b>
                            {artist?.handle ? (
                              <Link href={`/${artist.handle}`}>
                                {artist.name}
                              </Link>
                            ) : (
                              artist.name
                            )}
                          </b>
                        </td>
                      </tr>
                    )}
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      }}>
                      <td className="pt-2"></td>
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
                          {manifoldClaim.isFetching && (
                            <Spinner dimension={12} />
                          )}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="pt-2">Minting Approach</td>
                      <td className="pt-2">
                        <b>{printDistributionLink()}</b>
                      </td>
                    </tr>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      }}>
                      <td className="pt-2"></td>
                    </tr>
                    <tr>
                      <td className="pt-2">Phase</td>
                      <td className="pt-2">
                        <b>{manifoldClaim.phase}</b>
                      </td>
                    </tr>
                    <tr>
                      <td>Phase Start</td>
                      <td>
                        <b>
                          {Time.seconds(
                            manifoldClaim.startDate
                          ).toIsoDateTimeString()}{" "}
                          UTC
                        </b>
                      </td>
                    </tr>
                    <tr>
                      <td>Phase End</td>
                      <td>
                        <b>
                          {Time.seconds(
                            manifoldClaim.endDate
                          ).toIsoDateTimeString()}{" "}
                          UTC
                        </b>
                      </td>
                    </tr>
                    <tr>
                      <td>Status</td>
                      <td>
                        <b>{capitalizeEveryWord(manifoldClaim.status)}</b>
                      </td>
                    </tr>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      }}>
                      <td className="pt-2"></td>
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
                      <td className="pb-1">Manifold Fee</td>
                      <td className="pb-1">
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
                      <td>Total Price Per Token</td>
                      <td>
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
            <Row>
              <Col>
                <MemePageMintCountdown
                  nft_id={props.token_id}
                  hide_mint_btn={true}
                />
              </Col>
            </Row>
            <Row>
              <Col>{printMint()}</Col>
            </Row>
          </Container>
        </Col>
        <Col sm={12} md={7} className="d-flex align-items-center">
          <NFTImage
            nft={nftImage}
            animation={true}
            height={650}
            balance={-1}
            showUnseized={false}
            transparentBG={true}
          />
        </Col>
      </Row>
      <hr />
      <Row className="pt-3 pb-3">
        <Col>
          <Container className="no-padding">
            <Row>
              <Col>
                <span
                  dangerouslySetInnerHTML={{
                    __html: parseNftDescriptionToHtml(
                      instance.publicData.asset.description
                    ),
                  }}
                />
              </Col>
            </Row>
          </Container>
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
