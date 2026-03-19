"use client";

import Image from "next/image";
import Link from "next/link";
import { AppKitButton } from "@reown/appkit/react";
import {
  type ReactNode,
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Spinner } from "@/components/dotLoader/DotLoader";
import DropForgeTestnetIndicator from "@/components/drop-forge/DropForgeTestnetIndicator";
import NowMintingCountdown from "@/components/home/now-minting/NowMintingCountdown";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import NFTAttributes from "@/components/nft-attributes/NFTAttributes";
import NFTImage from "@/components/nft-image/NFTImage";
import DropPfp from "@/components/drops/create/utils/DropPfp";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
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
  ManifoldPhase,
  useManifoldClaim,
} from "@/hooks/useManifoldClaim";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useIdentity } from "@/hooks/useIdentity";
import ManifoldMintingWidget from "./ManifoldMintingWidget";
import type {
  ArweaveAttribute,
  ArweaveMetadata,
  ManifoldMintMetadata,
} from "./manifold-mint-metadata";
import type { Chain } from "viem";

interface Props {
  title: string;
  contract: string;
  chain: Chain;
  abi: any;
  mint_date: Time;
  mintMetadata: ManifoldMintMetadata;
  standalone?: boolean;
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

function getFeeLabelForPhase(phase: ManifoldPhase) {
  if (phase === ManifoldPhase.PUBLIC) {
    return "Manifold Fee (Public)";
  }

  return "Manifold Fee (Allowlist)";
}

function MetadataRow({
  label,
  value,
}: {
  readonly label: ReactNode;
  readonly value: ReactNode;
}) {
  return (
    <tr className="tw-border-b tw-border-white/5 last:tw-border-b-0">
      <td className="tw-h-[46px] tw-w-[45%] tw-py-2 tw-pr-4 tw-align-middle">
        {label}
      </td>
      <td className="tw-h-[46px] tw-w-[55%] tw-py-2 tw-align-middle">
        {value}
      </td>
    </tr>
  );
}

function StandaloneMintPageTopBar() {
  const { isConnected, seizeConnect, seizeConnectOpen } =
    useSeizeConnectContext();

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 md:tw-flex-row md:tw-items-center md:tw-justify-between md:tw-gap-6">
      <div className="tw-flex tw-items-center tw-gap-3">
        <Image src="/6529.svg" alt="6529" width={28} height={28} unoptimized />
        <span className="tw-text-xl tw-font-bold tw-text-white">
          The Memes by 6529 - Mint Page
        </span>
      </div>
      <div
        className="tw-flex tw-justify-start md:tw-justify-end"
        style={
          {
            "--apkt-tokens-core-backgroundAccentPrimary": "#406AFE",
            "--apkt-tokens-core-backgroundAccentPrimary-base": "#406AFE",
            "--apkt-tokens-theme-textInvert": "#FFFFFF",
            "--apkt-tokens-theme-iconInverse": "#FFFFFF",
            "--apkt-borderRadius-2": "10px",
            "--apkt-borderRadius-3": "12px",
          } as CSSProperties
        }
      >
        {isConnected ? (
          <AppKitButton balance="show" />
        ) : (
          <button
            type="button"
            onClick={seizeConnect}
            disabled={seizeConnectOpen}
            className="tw-inline-flex tw-h-8 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-full tw-border-0 tw-bg-primary-500 tw-px-4 !tw-text-[13px] tw-font-medium tw-leading-none tw-text-white tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-primary-500 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-primary-600 hover:tw-ring-primary-600 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
          >
            {seizeConnectOpen ? "CONNECTING..." : "CONNECT WALLET"}
          </button>
        )}
      </div>
    </div>
  );
}

function ArtistInfoStrip({
  handle,
  name,
  standalone,
}: {
  readonly handle: string;
  readonly name: string | undefined;
  readonly standalone: boolean | undefined;
}) {
  const { profile } = useIdentity({
    handleOrWallet: handle,
    initialProfile: null,
  });

  const href = standalone ? `https://6529.io/${handle}` : `/${handle}`;
  const displayName = profile?.handle ?? name ?? handle;
  const linkProps = standalone
    ? {
        href,
        target: "_blank" as const,
        rel: "noopener noreferrer",
      }
    : {
        href,
      };

  return (
    <UserProfileTooltipWrapper user={handle} hideActions={!!standalone}>
      <div className="tw-inline-flex tw-items-center tw-gap-3 tw-pb-4 tw-pt-1">
        <DropPfp pfpUrl={profile?.pfp} />
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <Link
            {...linkProps}
            className="tw-text-white tw-no-underline hover:tw-text-white"
          >
            <span className="tw-text-lg tw-font-medium tw-leading-none">
              {displayName}
            </span>
          </Link>
          {!!profile?.level && (
            <UserCICAndLevel
              level={profile.level}
              size={UserCICAndLevelSize.SMALL}
            />
          )}
          {profile && (
            <DropAuthorBadges
              profile={profile}
              tooltipIdPrefix={`mint-artist-badges-${profile.id ?? handle}`}
            />
          )}
        </div>
      </div>
    </UserProfileTooltipWrapper>
  );
}

export default function ManifoldMinting(props: Readonly<Props>) {
  const [isError, setIsError] = useState<boolean>(false);

  const [isLocalTimezone, setIsLocalTimezone] = useState<boolean>(true);

  const [descriptionClamped, setDescriptionClamped] = useState<boolean>(true);
  const [needsClamping, setNeedsClamping] = useState<boolean>(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

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
    const name =
      getTraitValue(instance?.asset.attributes, "Artist") ?? undefined;
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
        local_timezone={isLocalTimezone}
        setFee={setFee}
        setMintForAddress={setMintForAddress}
      />
    );
  }

  function printTitle() {
    return (
      <div className="tw-flex tw-items-center tw-gap-2 tw-pb-2">
        <h2 className="tw-mb-0 tw-text-3xl tw-font-semibold tw-text-white">
          Mint {props.title}
        </h2>
      </div>
    );
  }

  function printTestnetIndicator() {
    return <DropForgeTestnetIndicator alignEnd padBottom />;
  }

  function printDistributionLink() {
    const contractPath = getPathForContract(props.contract);
    if (props.standalone) {
      return (
        <a
          href={`https://6529.io/${contractPath}/${props.mintMetadata.tokenId}/distribution`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Distribution Plan
        </a>
      );
    }

    return (
      <Link
        href={`/${contractPath}/${props.mintMetadata.tokenId}/distribution`}
      >
        Distribution Plan
      </Link>
    );
  }

  function printDescription(i: MintMetadata) {
    const rawDescription = i.asset.description ?? "";

    return (
      <div>
        <div>
          <div
            ref={descriptionRef}
            className={
              descriptionClamped
                ? "tw-block tw-overflow-hidden tw-text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [display:-webkit-box]"
                : undefined
            }
            dangerouslySetInnerHTML={{
              __html: parseNftDescriptionToHtml(rawDescription),
            }}
          />
        </div>
        {(needsClamping ||
          rawDescription.trim().length > 140 ||
          rawDescription.includes("\n")) && (
          <div className="tw-pt-2">
            <button
              type="button"
              className="tw-border-0 tw-bg-transparent tw-p-0 !tw-text-sm tw-font-medium tw-text-iron-300 tw-transition-colors hover:tw-text-white"
              onClick={() => setDescriptionClamped(!descriptionClamped)}
            >
              {descriptionClamped ? "+ SHOW MORE" : "- SHOW LESS"}
            </button>
          </div>
        )}
      </div>
    );
  }

  function printActions(instance: MintMetadata, manifoldClaim: ManifoldClaim) {
    return (
      <div className="tw-order-2 tw-p-4 md:tw-order-1 md:tw-col-span-5">
        <div>
          <div className="tw-pb-2">
            <div className="tw-flex tw-items-center tw-justify-between">
              {props.standalone ? (
                <div className="tw-mb-0 tw-text-xl tw-font-semibold tw-leading-tight tw-text-white">
                  {instance.asset.name ?? props.title}
                </div>
              ) : (
                <Link
                  href={`/${getPathForContract(props.contract)}/${
                    props.mintMetadata.tokenId
                  }`}
                  className="tw-text-white hover:tw-text-white"
                >
                  <div className="tw-mb-0 tw-text-xl tw-font-semibold tw-leading-tight">
                    {instance.asset.name ?? props.title}
                  </div>
                </Link>
              )}
            </div>
            <div className="tw-pb-3 tw-pt-1 tw-text-base tw-font-light tw-text-iron-200">
              <span>
                {getNameForContract(props.contract)} #
                {props.mintMetadata.tokenId}
              </span>
            </div>
            {artist?.handle && (
              <ArtistInfoStrip
                handle={artist.handle}
                name={artist.name ?? undefined}
                standalone={props.standalone}
              />
            )}
            <div className="tw-text-base tw-text-iron-100">
              {printDescription(instance)}
            </div>
            <div className="tw-pt-3">
              <table className="tw-w-full tw-border-separate tw-border-spacing-0">
                <tbody>
                  <MetadataRow
                    label="Edition Size"
                    value={
                      <span className="tw-flex tw-items-center tw-justify-end tw-gap-1.5">
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
                    }
                  />
                </tbody>
              </table>
            </div>
            <div className="tw-pt-3">
              <NowMintingCountdown
                nftId={props.mintMetadata.tokenId}
                hideMintBtn={true}
                contract={props.contract}
                chainId={props.chain.id}
              />
            </div>
            <div className="tw-pt-3">{printMint()}</div>
          </div>
        </div>
      </div>
    );
  }

  function printImage() {
    if (!nftImage) {
      return <></>;
    }

    return (
      <div className="tw-order-1 tw-flex tw-pt-4 tw-items-center tw-justify-center md:tw-order-2 md:tw-pt-0 md:tw-h-screen md:tw-col-span-7">
        <NFTImage
          nft={nftImage}
          animation={true}
          height="full"
          showBalance={false}
          transparentBG={true}
        />
      </div>
    );
  }

  if (!manifoldClaim) {
    return (
      <div className="tw-mx-auto tw-w-full tw-max-w-7xl tw-px-4 md:tw-px-6">
        {printTestnetIndicator()}
        {printTitle()}
        <div className="tw-p-4">
          {isError ? (
            <span className="tw-text-iron-100">
              Error fetching mint information
            </span>
          ) : (
            <div className="tw-inline-flex tw-items-center tw-gap-3 tw-text-iron-100">
              <span>Retrieving Mint information</span>
              <Spinner />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!instance || !nftImage) {
    return (
      <div className="tw-mx-auto tw-w-full tw-max-w-7xl tw-p-4 tw-px-4 md:tw-px-6">
        {printTestnetIndicator()}
        {printTitle()}
        <div>
          <p className="tw-mb-0 tw-text-iron-100">No mint information found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-mx-auto tw-w-full tw-max-w-7xl tw-px-4 md:tw-px-6">
      {printTestnetIndicator()}
      {props.standalone && (
        <div className="tw-pb-8">
          <StandaloneMintPageTopBar />
          <div className="tw-mt-4 tw-h-px tw-w-full tw-bg-white/20" />
        </div>
      )}
      <div className="tw-grid tw-gap-8 tw-pb-3 md:tw-grid-cols-12">
        {printImage()}
        {printActions(instance, manifoldClaim)}
      </div>
      {areEqualAddresses(props.contract, MEMES_CONTRACT) && (
        <>
          <div className="tw-my-6 tw-h-px tw-w-full tw-bg-white/20" />
          <div className="tw-pb-3 tw-pt-2">
            <ManifoldMemesMintingPhases
              address={mintForAddress}
              contract={props.contract}
              token_id={props.mintMetadata.tokenId}
              mint_date={props.mint_date}
              claim={manifoldClaim}
              local_timezone={isLocalTimezone}
            />
          </div>
        </>
      )}
      <div className="tw-grid tw-gap-1 tw-pt-2">
        <div className="tw-text-base tw-text-iron-300">
          Note: The start/end times have some variance. Watch this page or{" "}
          <a
            href="https://x.com/6529collections"
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-iron-300 hover:tw-text-white"
          >
            &#64;6529collections
          </a>{" "}
          for updates.
        </div>
        <div className="tw-pt-1 tw-text-base tw-text-iron-300">
          All times are in{" "}
          {isLocalTimezone ? (
            <>
              your local timezone.{" "}
              <button
                type="button"
                className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-base tw-text-iron-300 tw-underline hover:tw-text-white"
                onClick={() => setIsLocalTimezone(false)}
              >
                Change to UTC
              </button>
            </>
          ) : (
            <>
              UTC.{" "}
              <button
                type="button"
                className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-base tw-text-iron-300 tw-underline hover:tw-text-white"
                onClick={() => setIsLocalTimezone(true)}
              >
                Change to your local timezone
              </button>
            </>
          )}
        </div>
      </div>
      <div className="tw-my-6 tw-h-px tw-w-full tw-bg-white/20" />
      <div className="tw-grid tw-gap-x-10 tw-gap-y-2 tw-pb-2 md:tw-grid-cols-2">
        <div className="tw-pb-1 tw-pt-1">
          <table className="tw-w-full tw-border-separate tw-border-spacing-0">
            <tbody>
              {artist && (
                <MetadataRow
                  label="Artist"
                  value={
                    <b>
                      {artist?.handle ? (
                        props.standalone ? (
                          <a
                            href={`https://6529.io/${artist.handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {artist.name}
                          </a>
                        ) : (
                          <Link href={`/${artist.handle}`}>{artist.name}</Link>
                        )
                      ) : (
                        artist.name
                      )}
                    </b>
                  }
                />
              )}
              <MetadataRow
                label="Minting Approach"
                value={<b>{printDistributionLink()}</b>}
              />
              <MetadataRow
                label="Mint Price"
                value={
                  <b>
                    {fromGWEI(Number(manifoldClaim.costWei ?? 0n)).toFixed(5)}{" "}
                    {ETHEREUM_ICON_TEXT}
                  </b>
                }
              />
              <MetadataRow
                label={getFeeLabelForPhase(manifoldClaim.phase)}
                value={
                  <b>
                    {fee ? (
                      <>
                        {fromGWEI(fee).toFixed(5)} {ETHEREUM_ICON_TEXT}
                      </>
                    ) : (
                      <>-</>
                    )}
                  </b>
                }
              />
              <MetadataRow
                label="Total Price Per Token"
                value={
                  <b>
                    {fromGWEI(
                      Number(manifoldClaim.costWei ?? 0n) + fee
                    ).toFixed(5)}{" "}
                    {ETHEREUM_ICON_TEXT}
                  </b>
                }
              />
            </tbody>
          </table>
        </div>
        <div className="tw-pb-1 tw-pt-1">
          <table className="tw-w-full tw-border-separate tw-border-spacing-0">
            <tbody>
              <MetadataRow
                label="Edition Size"
                value={
                  <span className="tw-flex tw-items-center tw-gap-1.5">
                    <b>
                      {numberWithCommas(manifoldClaim.total)} /{" "}
                      {numberWithCommas(manifoldClaim.totalMax)}
                      {manifoldClaim.remaining > 0 &&
                        manifoldClaim.status !== ManifoldClaimStatus.ENDED && (
                          <> ({manifoldClaim.remaining} remaining)</>
                        )}
                    </b>
                    {isManifoldClaimFetching && <Spinner dimension={12} />}
                  </span>
                }
              />
              <MetadataRow label="Phase" value={<b>{manifoldClaim.phase}</b>} />
              <MetadataRow
                label="Status"
                value={<b>{capitalizeEveryWord(manifoldClaim.status)}</b>}
              />
              <MetadataRow
                label="Phase Times"
                value={
                  <b>
                    {getDateTimeString(
                      Time.seconds(manifoldClaim.startDate),
                      isLocalTimezone
                    )}{" "}
                    -{" "}
                    {getDateTimeString(
                      Time.seconds(manifoldClaim.endDate),
                      isLocalTimezone
                    )}
                  </b>
                }
              />
              <MetadataRow
                label="View On"
                value={
                  <NFTMarketplaceLinks
                    contract={props.contract}
                    id={props.mintMetadata.tokenId}
                    include6529CollectionLink={props.standalone ?? false}
                  />
                }
              />
            </tbody>
          </table>
        </div>
      </div>
      <div className="tw-my-6 tw-h-px tw-w-full tw-bg-white/20" />
      <div className="tw-py-3">
        <NFTAttributes attributes={instance.asset.attributes ?? []} />
      </div>
    </div>
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
  const phaseAnchorDate =
    props.claim.startDate > 0
      ? Time.seconds(props.claim.startDate)
      : props.mint_date;
  const phases = buildMemesPhases(phaseAnchorDate);

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
    <div>
      {distribution?.airdrops !== undefined && distribution.airdrops > 0 && (
        <div className="tw-pb-2 tw-text-lg tw-font-bold tw-text-white">
          Airdrops: x{distribution.airdrops}
        </div>
      )}
      <div className="tw-grid tw-gap-4 md:tw-grid-cols-12">
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
      </div>
    </div>
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
    props.phase.id === "public" ? "tw-font-semibold" : "";

  if (eligibleMints) {
    const count = eligibleMints.spots;
    eligibleMintsText = `${count} eligible spot${count > 1 ? "s" : ""}`;
    eligibleMintsStyle = "tw-font-semibold tw-text-success";
  }

  let status: PhaseStatus = PhaseStatus.UPCOMING;
  const isDropComplete = props.claim.isDropComplete;

  if (
    props.claim.memePhase?.id === props.phase.id &&
    props.claim.status === ManifoldClaimStatus.ACTIVE
  ) {
    status = PhaseStatus.ACTIVE;
  } else if (props.phase.end.lt(Time.now()) || isDropComplete) {
    status = PhaseStatus.COMPLETED;
  }

  if (props.phase.id === "public" && !eligibleMints) {
    eligibleMintsStyle =
      status === PhaseStatus.ACTIVE
        ? "tw-font-semibold tw-text-success"
        : status === PhaseStatus.UPCOMING
          ? "tw-font-semibold tw-text-primary-300"
          : "tw-font-semibold tw-text-red/75";
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
  const hasActivePhase = props.claim.status === ManifoldClaimStatus.ACTIVE;
  const isHighlighted =
    status === PhaseStatus.ACTIVE ||
    (status === PhaseStatus.UPCOMING &&
      !hasActivePhase &&
      props.claim.nextMemePhase?.id === props.phase.id &&
      !isDropComplete);
  const highlightedRingClass =
    status === PhaseStatus.ACTIVE
      ? "tw-border-success tw-bg-iron-900/60 tw-ring-1 tw-ring-inset tw-ring-success"
      : "tw-border-primary-300 tw-bg-iron-900/60 tw-ring-1 tw-ring-inset tw-ring-primary-300";

  return (
    <div className="tw-pb-1 tw-pt-1 md:tw-col-span-3">
      <div
        className={`tw-h-full tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-p-5 tw-text-left ${
          isHighlighted
            ? highlightedRingClass
            : "tw-border-white/5 tw-bg-iron-900/40"
        }`}
      >
        <div className="tw-text-center tw-text-lg tw-font-bold tw-text-white">
          {props.phase.name}
        </div>
        <div className="tw-mt-4 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-text-sm tw-font-light tw-text-iron-300">
            Status
          </span>
          <span
            className={`tw-text-right tw-font-semibold ${
              status === PhaseStatus.ACTIVE
                ? "tw-text-success"
                : status === PhaseStatus.UPCOMING
                  ? "tw-text-primary-300"
                  : "tw-text-red/75"
            }`}
          >
            {status}
          </span>
        </div>
        <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-text-sm tw-font-light tw-text-iron-300">
            {startText}
          </span>
          <span className="tw-text-right tw-text-sm tw-text-iron-100">
            {startDisplay}
          </span>
        </div>
        <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
          <span className="tw-text-sm tw-font-light tw-text-iron-300">
            {endText}
          </span>
          <span className="tw-text-right tw-text-sm tw-text-iron-100">
            {endDisplay}
          </span>
        </div>
        {props.address && (
          <div className={`tw-pt-4 tw-text-center ${eligibleMintsStyle}`}>
            {eligibleMintsText}
          </div>
        )}
      </div>
    </div>
  );
}
