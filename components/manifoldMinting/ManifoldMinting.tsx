import styles from "./ManifoldMinting.module.scss";
import { Col, Container, Row, Table } from "react-bootstrap";
import useManifoldClaim, {
  ManifoldClaimStatus,
  ManifoldPhase,
} from "../../hooks/useManifoldClaim";
import { useEffect, useState } from "react";
import { ManifoldInstance, getTraitValue } from "./manifold-types";
import DotLoader, { Spinner } from "../dotLoader/DotLoader";
import NFTImage from "../nft-image/NFTImage";
import Link from "next/link";
import {
  capitalizeEveryWord,
  fromGWEI,
  numberWithCommas,
} from "../../helpers/Helpers";
import MintCountdownBox from "../mintCountdownBox/MintCountdownBox";
import { Time } from "../../helpers/time";
import NFTAttributes from "../nftAttributes/NFTAttributes";
import ManifoldMintingPublic from "./ManifoldMintingPublic";
import ManifoldMintingAllowlist from "./ManifoldMintingAllowlist";
import { ETHEREUM_ICON_TEXT } from "../../constants";

interface Props {
  title: string;
  contract: string;
  proxy: string;
  abi: any;
  token_id: number;
}

export default function ManifoldMinting(props: Readonly<Props>) {
  const [isError, setIsError] = useState<boolean>(false);

  const [fee, setFee] = useState<number>(0);

  const manifoldClaim = useManifoldClaim(
    props.contract,
    props.proxy,
    props.abi,
    props.token_id,
    () => {
      setIsError(true);
    }
  );

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

  if (fetching) {
    return (
      <Container className="pt-4 pb-4">
        <Row>
          <Col>
            <h2>
              <span className="font-lightest">Mint</span> {props.title}
            </h2>
          </Col>
        </Row>
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

  function printMint() {
    if (manifoldClaim?.phase === ManifoldPhase.PUBLIC) {
      return (
        <ManifoldMintingAllowlist
          contract={props.contract}
          proxy={props.proxy}
          abi={props.abi}
          claim={manifoldClaim!}
          merkleTreeId={instance!.publicData.instanceAllowlist.merkleTreeId}
          setFee={(f: number) => {
            setFee(f);
          }}
        />
      );
    }

    return (
      <ManifoldMintingAllowlist
        contract={props.contract}
        proxy={props.proxy}
        abi={props.abi}
        claim={manifoldClaim!}
        merkleTreeId={instance!.publicData.instanceAllowlist.merkleTreeId}
        setFee={(f: number) => {
          setFee(f);
        }}
      />
    );
  }

  if (!manifoldClaim || !instance || !nftImage) {
    return (
      <Container className="pt-4 pb-4">
        <Row>
          <Col>
            <h2>
              <span className="font-lightest">Mint</span> {props.title}
            </h2>
          </Col>
        </Row>
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
      <Row className="pt-2 pb-2">
        <Col>
          <h2>
            <span className="font-lightest">Mint</span>{" "}
            {instance.publicData.contract.name} #{props.token_id}
          </h2>
        </Col>
      </Row>
      <Row className="pt-2 pb-2">
        <Col>
          <NFTImage
            nft={nftImage}
            animation={true}
            height={650}
            balance={-1}
            showUnseized={false}
          />
        </Col>
      </Row>
      {manifoldClaim.status !== ManifoldClaimStatus.EXPIRED && (
        <Row className="pt-3">
          <Col>
            <MintCountdownBox
              title={
                manifoldClaim.status === ManifoldClaimStatus.UPCOMING
                  ? `${manifoldClaim.phase} Starts In`
                  : `${manifoldClaim.phase} Ends In`
              }
              date={
                manifoldClaim.status === ManifoldClaimStatus.UPCOMING
                  ? manifoldClaim.startDate
                  : manifoldClaim.endDate
              }
              hide_mint_btn={true}
              btn_label=""
              mint_link=""
              new_tab={true}
              additional_elements={
                manifoldClaim.phase === ManifoldPhase.ALLOWLIST && (
                  <span className="font-smaller pt-1">
                    * The timer above displays the current time remaining for a
                    specific phase of the drop. Please refer to the distribution
                    plan to check if you are in the allowlist.
                  </span>
                )
              }
            />
          </Col>
        </Row>
      )}
      <Row className="pt-3">
        <Col sm={12} md={6} className="pt-2 pb-2">
          <Table className={styles.spotsTable}>
            <tbody>
              <tr>
                <td>Name</td>
                <td>
                  <b>{instance.publicData.asset.name}</b>
                </td>
              </tr>
              {artist && (
                <tr>
                  <td>Artist</td>
                  <td>
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
                <td className="pt-4 pb-4">Edition Size</td>
                <td className="pt-4 pb-4">
                  <b>
                    {numberWithCommas(manifoldClaim.total)} /{" "}
                    {numberWithCommas(manifoldClaim.totalMax)}
                    {manifoldClaim.remaining > 0 && (
                      <> ({manifoldClaim.remaining} remaining)</>
                    )}
                  </b>
                  {manifoldClaim.isFetching && (
                    <>
                      {" "}
                      <DotLoader />
                    </>
                  )}
                </td>
              </tr>
              <tr>
                <td>Phase</td>
                <td>
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
                    {Time.seconds(manifoldClaim.endDate).toIsoDateTimeString()}{" "}
                    UTC
                  </b>
                </td>
              </tr>
              <tr>
                <td className="pb-4">Status</td>
                <td className="pb-4">
                  <b>{capitalizeEveryWord(manifoldClaim.status)}</b>
                </td>
              </tr>
              <tr>
                <td>Mint Price</td>
                <td>
                  <b>
                    {fromGWEI(manifoldClaim.cost)} {ETHEREUM_ICON_TEXT}
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
                    {fromGWEI(manifoldClaim.cost + fee)} {ETHEREUM_ICON_TEXT}
                  </b>
                </td>
              </tr>
            </tbody>
          </Table>
        </Col>
        <Col sm={12} md={6} className="pt-2 pb-2">
          {printMint()}
        </Col>
      </Row>
      <Row className="pt-3">
        <Col xs={12}>
          <h4>Attributes</h4>
        </Col>
        <Col xs={12}>
          <NFTAttributes attributes={instance.publicData.asset.attributes} />
        </Col>
      </Row>
    </Container>
  );
}
