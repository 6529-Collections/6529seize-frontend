import { Col, Container, Row, Table } from "react-bootstrap";
import styles from "./ManifoldMinting.module.scss";
import useManifoldClaim, {
  ManifoldClaimStatus,
  ManifoldPhase,
} from "../../hooks/useManifoldClaim";
import { useEffect, useState } from "react";
import {
  ManifoldInstance,
  ManifoldMerkleProof,
  getTraitValue,
} from "./manifold-types";
import DotLoader, { Spinner } from "../dotLoader/DotLoader";
import NFTImage from "../nft-image/NFTImage";
import Link from "next/link";
import { capitalizeEveryWord, numberWithCommas } from "../../helpers/Helpers";
import MintCountdownBox from "../mintCountdownBox/MintCountdownBox";
import HeaderUserConnect from "../header/user/HeaderUserConnect";
import { Time } from "../../helpers/time";
import ManifoldMintingSpot from "./ManifoldMintingSpot";
import { getRandomObjectId } from "../../helpers/AllowlistToolHelpers";
import NFTAttributes from "../nftAttributes/NFTAttributes";

interface Props {
  contract: string;
  proxy: string;
  abi: any;
  token_id: number;
}

export default function ManifoldMinting(props: Readonly<Props>) {
  // const account = useAccount();
  const account = {
    address: "0x5eeeb64d0e697a60e6dacd7ad9a16a6bdd5560e2",
    isConnected: true,
  };

  const manifoldClaim = useManifoldClaim(
    props.contract,
    props.proxy,
    props.abi,
    props.token_id
  );
  console.log(manifoldClaim);

  const [fetching, setFetching] = useState<boolean>(true);
  const [fetchingMerkle, setFetchingMerkle] = useState<boolean>(false);

  const [instance, setInstance] = useState<ManifoldInstance>();
  const [nftImage, setNftImage] = useState<any>();
  const [artist, setArtist] = useState<{
    name: string | undefined;
    handle: string | undefined;
  }>();

  const [merkleProofs, setMerkleProofs] = useState<ManifoldMerkleProof[]>([]);

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

  useEffect(() => {
    if (
      account.isConnected &&
      instance?.publicData.instanceAllowlist.merkleTreeId
    ) {
      setFetchingMerkle(true);
      const merkle = instance.publicData.instanceAllowlist.merkleTreeId;
      const url = `https://apps.api.manifoldxyz.dev/public/merkleTree/${merkle}/merkleInfo?address=${account.address}`;
      fetch(url)
        .then((response) => {
          response.json().then((data: ManifoldMerkleProof[]) => {
            setMerkleProofs(data);
          });
        })
        .catch((error) => {
          console.error("Error fetching merkle data", error);
        })
        .finally(() => {
          setFetchingMerkle(false);
        });
    }
  }, [
    account.isConnected,
    instance?.publicData.instanceAllowlist.merkleTreeId,
  ]);

  if (fetching) {
    return (
      <Container className="pt-4 pb-4">
        <Row>
          <Col>
            <h2>Mint</h2>
          </Col>
        </Row>
        <Row className="pt-2">
          <Col className="d-flex align-items-center gap-3">
            <span>Retrieving Mint information</span>
            <Spinner />
          </Col>
        </Row>
      </Container>
    );
  }

  function printMintRows() {
    if (!account.isConnected) {
      return (
        <tr>
          <td colSpan={2}>
            <HeaderUserConnect /> to mint
          </td>
        </tr>
      );
    }

    return (
      <>
        <tr>
          <td>Connected with</td>
          <td>{account.address}</td>
        </tr>
        {fetchingMerkle ? (
          <tr>
            <td colSpan={2}>
              <span className="d-flex align-items-center gap-3">
                <span>Retrieving Allowlist information</span>
                <Spinner />
              </span>
            </td>
          </tr>
        ) : (
          printSpots()
        )}
      </>
    );
  }

  function printSpots() {
    if (manifoldClaim?.phase === ManifoldPhase.ALLOWLIST) {
      const spotsContent = (
        <tr>
          <td className="pb-4">Phase Spots</td>
          <td className="pb-4">{merkleProofs.length}</td>
        </tr>
      );

      if (!merkleProofs || merkleProofs.length === 0) {
        return (
          <>
            {spotsContent}
            <tr>
              <td colSpan={2}>
                No claims for connected wallet in current phase
              </td>
            </tr>
          </>
        );
      }

      return (
        <>
          {spotsContent}
          {merkleProofs.map((proof, index) => (
            <ManifoldMintingSpot
              key={getRandomObjectId()}
              index={index + 1}
              contract={props.contract}
              proxy={props.proxy}
              abi={props.abi}
              claim={manifoldClaim}
              proof={proof}
            />
          ))}
        </>
      );
    }

    if (manifoldClaim?.phase === ManifoldPhase.PUBLIC) {
      return printPublicMint();
    }
  }

  function printPublicMint() {
    return (
      <tr>
        <td colSpan={2}>
          <button className="btn btn-primary">Mint Now</button>
        </td>
      </tr>
    );
  }

  if (!manifoldClaim || !instance || !nftImage) {
    return (
      <Container className="pt-4 pb-4">
        <Row>
          <Col>
            <h2>
              <span className="font-lightest">Mint</span>
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
                    {printMintRows()}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Container>
        </Col>
      </Row>
      <Row className="pt-5">
        <Col>
          <NFTAttributes attributes={instance.publicData.asset.attributes} />
        </Col>
      </Row>
    </Container>
  );
}
