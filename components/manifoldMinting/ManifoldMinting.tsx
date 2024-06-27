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
import { capitalizeEveryWord, numberWithCommas } from "../../helpers/Helpers";
import MintCountdownBox from "../mintCountdownBox/MintCountdownBox";
import { Time } from "../../helpers/time";
import NFTAttributes from "../nftAttributes/NFTAttributes";
import ManifoldMintingPublic from "./ManifoldMintingPublic";
import ManifoldMintingAllowlist from "./ManifoldMintingAllowlist";

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
              <>
                <span>Error fetching mint information</span>
              </>
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
      return <ManifoldMintingPublic />;
    }

    return (
      <ManifoldMintingAllowlist
        contract={props.contract}
        proxy={props.proxy}
        abi={props.abi}
        instanceId={manifoldClaim!.instanceId}
        cost={manifoldClaim!.cost}
        merkleTreeId={instance!.publicData.instanceAllowlist.merkleTreeId}
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
      <Row>
        <Col>
          <h2>
            <span className="font-lightest">Mint</span>{" "}
            {instance.publicData.contract.name} #{props.token_id}
          </h2>
        </Col>
      </Row>
      <Row>
        <Col
          className="pt-3 pb-3 d-flex align-items-center justify-content-center"
          xs={{ span: 12 }}
          sm={{ span: 12 }}
          md={{ span: 6 }}
          lg={{ span: 6 }}>
          <NFTImage
            nft={nftImage}
            animation={true}
            height={650}
            balance={-1}
            showUnseized={false}
          />
        </Col>
        <Col
          className="pt-3 pb-3"
          xs={{ span: 12 }}
          sm={{ span: 12 }}
          md={{ span: 6 }}
          lg={{ span: 6 }}>
          <Container className="no-padding">
            {manifoldClaim.status !== ManifoldClaimStatus.EXPIRED && (
              <Row className="pb-3">
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
                          * The timer above displays the current time remaining
                          for a specific phase of the drop. Please refer to the
                          distribution plan to check if you are in the
                          allowlist.
                        </span>
                      )
                    }
                  />
                </Col>
              </Row>
            )}
            <Row>
              <Col>
                <Table bordered={false}>
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
                          ).toIsoDateTimeString()}
                        </b>
                      </td>
                    </tr>
                    <tr>
                      <td>Phase End</td>
                      <td>
                        <b>
                          {Time.seconds(
                            manifoldClaim.endDate
                          ).toIsoDateTimeString()}
                        </b>
                      </td>
                    </tr>
                    <tr>
                      <td className="pb-4">Status</td>
                      <td className="pb-4">
                        <b>{capitalizeEveryWord(manifoldClaim.status)}</b>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
            <Row>
              <Col>{printMint()}</Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="pt-5">
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
