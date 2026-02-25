"use client";

import { Spinner } from "@/components/dotLoader/DotLoader";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import NowMintingCountdown from "@/components/home/now-minting/NowMintingCountdown";
import NFTAttributes from "@/components/nft-attributes/NFTAttributes";
import NFTImage from "@/components/nft-image/NFTImage";
import {
  ETHEREUM_ICON_TEXT,
  MANIFOLD_LAZY_CLAIM_CONTRACT,
  MEMES_CONTRACT,
} from "@/constants/constants";
import type { Distribution } from "@/entities/IDistribution";
import {
  areEqualAddresses,
  capitalizeEveryWord,
  fromGWEI,
  getNameForContract,
  getPathForContract,
  numberWithCommas,
  parseNftDescriptionToHtml,
} from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import type { ManifoldClaim, MemePhase } from "@/hooks/useManifoldClaim";
import {
  buildMemesPhases,
  ManifoldClaimStatus,
  useManifoldClaim,
} from "@/hooks/useManifoldClaim";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import type { Chain } from "viem";
import type {
  ArweaveAttribute,
  ArweaveMetadata,
  ManifoldMintMetadata,
} from "./manifold-mint-metadata";
import styles from "./ManifoldMinting.module.scss";
import ManifoldMintingWidget from "./ManifoldMintingWidget";

interface Props {
  title: string;
  contract: string;
  chain: Chain;
  abi: any;
  mint_date: Time;
  mintMetadata: ManifoldMintMetadata;
}

interface MintMetadata {
  id: number;
  asset: ArweaveMetadata;
}

function getTraitValue(
  attributes: ArweaveAttribute[] | undefined,
  traitType: string
): string | undefined {
  const value = attributes?.find(
    (attribute) => attribute.trait_type === traitType
  )?.value;
  if (typeof value === "string") {
    return value;
  }
  if (value != null) {
    return String(value);
  }
  return undefined;
}

function getDateTimeString(time: Time, local_timezone: boolean) {
  if (local_timezone) {
    return time.toLocaleDateTimeString();
  }

  const d = time.toIsoDateString();
  const t = time.toIsoTimeString().split(" ")[0];

  return `${d} ${t?.slice(0, 5)}`;
}

export default function ManifoldMinting(props: Readonly<Props>) {
  const [isError, setIsError] = useState<boolean>(false);

  const [isLocalTimezone, setIsLocalTimezone] = useState<boolean>(true);

  const [descriptionClamped, setDescriptionClamped] = useState<boolean>(true);
  const [needsClamping, setNeedsClamping] = useState<boolean>(false);
  const descriptionRef = useRef<HTMLSpanElement>(null);

  const { claim: manifoldClaim, isFetching: isManifoldClaimFetching } =
    useManifoldClaim({
      chainId: props.chain.id,
      contract: props.contract,
      proxy: MANIFOLD_LAZY_CLAIM_CONTRACT,
      abi: props.abi,
      identifier: props.mintMetadata.tokenId,
      onError: () => {
        setIsError(true);
      },
    });

  const [fee, setFee] = useState<number>(0);
  const [mintForAddress, setMintForAddress] = useState<string>("");

  const instance = useMemo<MintMetadata | undefined>(() => {
    if (
      !props.mintMetadata.metadata ||
      typeof props.mintMetadata.metadata !== "object"
    ) {
      return undefined;
    }
    const metadata = { ...props.mintMetadata.metadata };
    if (
      metadata.animation_details &&
      typeof metadata.animation_details === "string"
    ) {
      try {
        metadata.animation_details = JSON.parse(metadata.animation_details);
      } catch {
        // Preserve original string when parsing fails.
      }
    }
    return {
      id: props.mintMetadata.tokenId,
      asset: metadata,
    };
  }, [props.mintMetadata]);

  const nftImage = useMemo(() => {
    if (!instance) {
      return undefined;
    }
    return {
      id: instance.id,
      contract: props.contract,
      name: instance.asset.name ?? props.title,
      image: instance.asset.image_url ?? instance.asset.image ?? "",
      animation: instance.asset.animation_url ?? instance.asset.animation ?? "",
      icon: "",
      thumbnail: "",
      scaled: "",
      metadata: instance.asset,
    };
  }, [instance, props.contract, props.title]);

  const artist = useMemo(() => {
    const name = getTraitValue(instance?.asset.attributes, "Artist") ?? undefined;
    const handle =
      getTraitValue(instance?.asset.attributes, "SEIZE Artist Profile") ??
      undefined;
    if (!name && !handle) {
      return undefined;
    }
    return { name, handle };
  }, [instance?.asset.attributes]);

  useEffect(() => {
    if (instance) {
      setNeedsClamping(false);
      setDescriptionClamped(true);
    }
  }, [instance]);

  useEffect(() => {
    if (descriptionRef.current && descriptionClamped && instance) {
      const checkClamping = () => {
        const element = descriptionRef.current;
        if (element) {
          const needsClamp = element.scrollHeight > element.clientHeight;
          setNeedsClamping(needsClamp);
        }
      };
      const frameId = requestAnimationFrame(checkClamping);
      return () => cancelAnimationFrame(frameId);
    }
    return undefined;
  }, [instance, descriptionClamped]);

  function printMint() {
    if (!manifoldClaim) {
      return <></>;
    }

    return (
      <ManifoldMintingWidget
        contract={props.contract}
        chain={props.chain}
        abi={props.abi}
        claim={manifoldClaim}
        setFee={setFee}
        setMintForAddress={setMintForAddress}
      />
    );
  }

  function printTitle() {
    return (
      <Row className="pb-2">
        <Col className="d-flex align-items-center gap-2">
          <h2 className="mb-0">Mint {props.title}</h2>
        </Col>
      </Row>
    );
  }

  function printTestnetIndicator() {
    return (
      <Row className="pb-2">
        <Col className="d-flex justify-content-end">
          <DropForgeTestnetIndicator />
        </Col>
      </Row>
    );
  }

  function printDistributionLink() {
    const contractPath = getPathForContract(props.contract);
    return (
      <Link
        href={`/${contractPath}/${props.mintMetadata.tokenId}/distribution`}
      >
        Distribution Plan
      </Link>
    );
  }

  function printDescription(i: MintMetadata) {
    return (
      <Container className="no-padding">
        <Row>
          <Col>
            <span
              ref={descriptionRef}
              className={descriptionClamped ? styles["descriptionClamped"] : ""}
              dangerouslySetInnerHTML={{
                __html: parseNftDescriptionToHtml(i.asset.description ?? ""),
              }}
            />
          </Col>
        </Row>
        {needsClamping && (
          <Row>
            <Col>
              <button
                className="btn btn-link decoration-none"
                onClick={() => setDescriptionClamped(!descriptionClamped)}
              >
                <span className="font-smaller font-color-silver font-color-hover">
                  {descriptionClamped ? "+ SHOW MORE" : "- SHOW LESS"}
                </span>
              </button>
            </Col>
          </Row>
        )}
      </Container>
    );
  }

  function printActions(instance: MintMetadata, manifoldClaim: ManifoldClaim) {
    return (
      <Col sm={{ span: 12, order: 2 }} md={{ span: 5, order: 1 }}>
        <Container className="no-padding">
          <Row className="pb-2">
            <Col
              xs={12}
              className="d-flex align-items-center justify-content-between"
            >
              <Link
                href={`/${getPathForContract(props.contract)}/${
                  props.mintMetadata.tokenId
                }`}
              >
                <h3 className="mb-0">{instance.asset.name ?? props.title}</h3>
              </Link>
            </Col>
            <Col xs={12} className="pt-1 pb-3 font-lighter">
              <span>
                {getNameForContract(props.contract)} #
                {props.mintMetadata.tokenId}
              </span>
            </Col>
            <Col xs={12}>{printDescription(instance)}</Col>
            <Col xs={12} className="pt-3">
              <Table className={styles["spotsTable"]}>
                <tbody>
                  <tr>
                    <td className="pt-2">Edition Size</td>
                    <td className="pt-2">
                      <span className="d-flex align-items-center justify-content-end tw-gap-1.5">
                        {isManifoldClaimFetching && <Spinner dimension={12} />}
                        <b>
                          {numberWithCommas(manifoldClaim.total)} /{" "}
                          {numberWithCommas(manifoldClaim.totalMax)}
                          {manifoldClaim.remaining > 0 &&
                            manifoldClaim.status !==
                              ManifoldClaimStatus.ENDED && (
                              <> ({manifoldClaim.remaining} remaining)</>
                            )}
                        </b>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col xs={12} className="pt-3">
              <NowMintingCountdown
                nftId={props.mintMetadata.tokenId}
                hideMintBtn={true}
                contract={props.contract}
                chainId={props.chain.id}
              />
            </Col>
            <Col xs={12} className="pt-3">
              {printMint()}
            </Col>
          </Row>
        </Container>
      </Col>
    );
  }

  function printImage() {
    if (!nftImage) {
      return <></>;
    }

    return (
      <Col sm={{ span: 12, order: 1 }} md={{ span: 7, order: 2 }}>
        <NFTImage
          nft={nftImage}
          animation={true}
          height="full"
          showBalance={false}
          transparentBG={true}
        />
      </Col>
    );
  }

  if (!manifoldClaim) {
    return (
      <Container className="pt-4 pb-4 px-4">
        {printTestnetIndicator()}
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

  if (!instance || !nftImage) {
    return (
      <Container className="pt-4 pb-4 px-4">
        {printTestnetIndicator()}
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
    <Container className="pt-4 pb-4 px-4">
      {printTestnetIndicator()}
      <Row className="pb-3">
        {printImage()}
        {printActions(instance, manifoldClaim)}
      </Row>
      {areEqualAddresses(props.contract, MEMES_CONTRACT) && (
        <Row className="pt-2 pb-3">
          <Col>
            <ManifoldMemesMintingPhases
              address={mintForAddress}
              contract={props.contract}
              token_id={props.mintMetadata.tokenId}
              mint_date={props.mint_date}
              claim={manifoldClaim}
              local_timezone={isLocalTimezone}
            />
          </Col>
        </Row>
      )}
      <Row className="pt-2">
        <Col xs={12} className="font-color-h">
          Note: The start/end times have some variance. Watch this page or{" "}
          <a
            href="https://x.com/6529collections"
            target="_blank"
            rel="noopener noreferrer"
            className="font-color-h font-color-hover"
          >
            &#64;6529collections
          </a>{" "}
          for updates.
        </Col>
        <Col className="font-color-h pt-1">
          All times are in{" "}
          {isLocalTimezone ? (
            <>
              your local timezone.{" "}
              <button
                className="btn btn-link"
                onClick={() => setIsLocalTimezone(false)}
              >
                <span className="font-color-hover">Change to UTC</span>
              </button>
            </>
          ) : (
            <>
              UTC.{" "}
              <button
                className="btn btn-link font-color-hover"
                onClick={() => setIsLocalTimezone(true)}
              >
                <span className="font-color-hover">
                  Change to your local timezone
                </span>
              </button>
            </>
          )}
        </Col>
      </Row>
      <hr />
      <Row className="pb-2">
        <Col sm={12} md={6} className="pt-1 pb-1">
          <Table className={styles["spotsTable"]}>
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
                  <span className="d-flex align-items-center tw-gap-1.5">
                    {isManifoldClaimFetching && <Spinner dimension={12} />}
                    <b>
                      {numberWithCommas(manifoldClaim.total)} /{" "}
                      {numberWithCommas(manifoldClaim.totalMax)}
                      {manifoldClaim.remaining > 0 &&
                        manifoldClaim.status !== ManifoldClaimStatus.ENDED && (
                          <> ({manifoldClaim.remaining} remaining)</>
                        )}
                    </b>
                  </span>
                </td>
              </tr>
              <tr>
                <td className="pt-2">Mint Price</td>
                <td className="pt-2">
                  <b>
                    {fromGWEI(Number(manifoldClaim.costWei ?? 0n)).toFixed(5)}{" "}
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
          <Table className={styles["spotsTable"]}>
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
                    {getDateTimeString(
                      Time.seconds(manifoldClaim.startDate),
                      isLocalTimezone
                    )}
                  </b>
                </td>
              </tr>
              <tr>
                <td className="pt-2">Phase End</td>
                <td className="pt-2">
                  <b>
                    {getDateTimeString(
                      Time.seconds(manifoldClaim.endDate),
                      isLocalTimezone
                    )}
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
                    {fromGWEI(
                      Number(manifoldClaim.costWei ?? 0n) + fee
                    ).toFixed(5)}{" "}
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
          <NFTAttributes attributes={instance.asset.attributes ?? []} />
        </Col>
      </Row>
    </Container>
  );
}

function ManifoldMemesMintingPhases(
  props: Readonly<{
    address: string;
    contract: string;
    token_id: number;
    mint_date: Time;
    claim: ManifoldClaim;
    local_timezone: boolean;
  }>
) {
  const [distribution, setDistribution] = useState<Distribution>();
  const phases = buildMemesPhases(props.mint_date);

  useEffect(() => {
    if (props.address) {
      fetch(
        `https://api.6529.io/api/distributions?card_id=${props.token_id}&contract=${props.contract}&page=1&search=${props.address}`
      )
        .then((response) => response.json())
        .then((data) => {
          setDistribution(data.data[0]);
        });
    } else {
      setDistribution(undefined);
    }
  }, [props.address]);

  return (
    <Container className="no-padding">
      {distribution?.airdrops !== undefined && distribution.airdrops > 0 && (
        <Row className="tw-pb-2">
          <Col className="tw-text-lg tw-font-bold">
            Airdrops: x{distribution.airdrops}
          </Col>
        </Row>
      )}
      <Row>
        {phases.map((phase) => (
          <ManifoldMemesMintingPhase
            key={`phase-${phase.id}`}
            claim={props.claim}
            address={props.address}
            phase={phase}
            distribution={distribution}
            local_timezone={props.local_timezone}
          />
        ))}
      </Row>
    </Container>
  );
}

function ManifoldMemesMintingPhase(
  props: Readonly<{
    claim: ManifoldClaim;
    address: string;
    phase: MemePhase;
    distribution: Distribution | undefined;
    local_timezone: boolean;
  }>
) {
  enum PhaseStatus {
    UPCOMING = "UPCOMING",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
  }

  const eligibleMints = props.distribution?.allowlist.find((phase) =>
    phase.phase.includes(props.phase.id)
  );

  let eligibleMintsText =
    props.phase.id === "public" ? "Unlimited spots" : "No eligible spots";
  let eligibleMintsStyle =
    props.phase.id === "public" ? "font-color-green font-bolder" : "";

  if (eligibleMints) {
    const count = eligibleMints.spots;
    eligibleMintsText = `${count} eligible spot${count > 1 ? "s" : ""}`;
    eligibleMintsStyle = "font-color-green font-bolder";
  }

  let status: PhaseStatus = PhaseStatus.UPCOMING;
  if (props.phase.end.lt(Time.now()) || props.claim.isFinalized) {
    status = PhaseStatus.COMPLETED;
  } else if (
    props.claim.memePhase?.id === props.phase.id &&
    props.claim.status === ManifoldClaimStatus.ACTIVE
  ) {
    status = PhaseStatus.ACTIVE;
  }

  let startText = "Expected start";
  let endText = "Expected end";
  if (status === PhaseStatus.ACTIVE) {
    startText = "Started";
    endText = "Ends";
  } else if (status === PhaseStatus.COMPLETED) {
    startText = "Started";
    endText = "Ended";
  }

  let startDate = props.phase.start;
  let endDate = props.phase.end;
  if (status === PhaseStatus.ACTIVE) {
    startDate = Time.seconds(props.claim.startDate);
    endDate = Time.seconds(props.claim.endDate);
  }

  const startDisplay = getDateTimeString(startDate, props.local_timezone);
  const endDisplay = getDateTimeString(endDate, props.local_timezone);

  return (
    <Col xs={12} sm={6} md={3} className="pt-1 pb-1">
      <Container
        className={
          props.claim.memePhase?.id === props.phase.id &&
          !props.claim.isFinalized
            ? styles["phaseBoxActive"]
            : styles["phaseBox"]
        }
      >
        <Row>
          <Col xs={12} className="font-bolder font-larger text-center pb-2">
            {props.phase.name}
          </Col>
          <Col
            xs={12}
            className="d-flex align-items-center justify-content-between gap-2"
          >
            <span className="font-lighter font-smaller">Status</span>
            <span
              className={`${
                status === PhaseStatus.ACTIVE || status === PhaseStatus.UPCOMING
                  ? "font-color-blue font-bolder text-right"
                  : "font-color-red font-bolder text-right opacity-75"
              }`}
            >
              {status}
            </span>
          </Col>
          <Col
            xs={12}
            className="d-flex align-items-center justify-content-between gap-2"
          >
            <span className="font-lighter font-smaller">{startText}</span>
            <span className="text-right">{startDisplay}</span>
          </Col>
          <Col
            xs={12}
            className="d-flex align-items-center justify-content-between gap-2"
          >
            <span className="font-lighter font-smaller">{endText}</span>
            <span className="text-right">{endDisplay}</span>
          </Col>
          {props.address && (
            <Col xs={12} className={`pt-3 text-center ${eligibleMintsStyle}`}>
              {eligibleMintsText}
            </Col>
          )}
        </Row>
      </Container>
    </Col>
  );
}
