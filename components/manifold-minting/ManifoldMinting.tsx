"use client";

import clsx from "clsx";
import Link from "next/link";
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
import {
  areEqualAddresses,
  capitalizeEveryWord,
  fromGWEI,
  getNameForContract,
  getPathForContract,
  numberWithCommas,
  parseNftDescriptionToHtml,
} from "@/helpers/Helpers";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";
import { Time } from "@/helpers/time";
import type { ManifoldClaim } from "@/hooks/useManifoldClaim";
import {
  ManifoldClaimStatus,
  ManifoldPhase,
  useManifoldClaim,
} from "@/hooks/useManifoldClaim";
import { useIdentity } from "@/hooks/useIdentity";
import ManifoldMintingWidget from "./ManifoldMintingWidget";
import type {
  ArweaveAttribute,
  ArweaveMetadata,
  ManifoldMintMetadata,
} from "./manifold-mint-metadata";
import type { Abi, Chain } from "viem";
import WalletConnectBalance from "@/components/wallet-connect-balance/WalletConnectBalance";
import ManifoldMemesMintingPhases from "./ManifoldMintingPhases";
import { getDateTimeString } from "./ManifoldMinting.utils";

interface Props {
  title: string;
  contract: string;
  chain: Chain;
  abi: Abi;
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
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-items-center tw-gap-4 md:tw-flex-row md:tw-items-center md:tw-justify-between md:tw-gap-6">
      <div className="tw-flex tw-items-center tw-justify-center tw-gap-3">
        <img src="/6529.svg" alt="6529" width={28} height={28} />
        <span className="tw-text-xl tw-font-bold tw-text-white">
          The Memes by 6529 - Mint Page
        </span>
      </div>
      <div
        className="tw-flex tw-justify-center md:tw-justify-end"
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
        <WalletConnectBalance />
      </div>
    </div>
  );
}

function ArtistInfoStrip({
  handle,
  name,
  standalone = false,
}: {
  readonly handle: string;
  readonly name: string | undefined;
  readonly standalone?: boolean;
}) {
  const { profile } = useIdentity({
    handleOrWallet: handle,
    initialProfile: null,
  });

  const href = `/${handle}`;
  const displayName = profile?.handle ?? name ?? handle;
  const standaloneDisplayName = name ?? profile?.handle ?? handle;
  const standaloneHref = `https://6529.io/${profile?.handle ?? handle}`;
  const badgesProfile = useMemo(() => {
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      handle: profile.handle,
      pfp: profile.pfp,
      banner1_color: getBannerColorValue(profile.banner1),
      banner2_color: getBannerColorValue(profile.banner2),
      cic: profile.cic,
      rep: profile.rep,
      tdh: profile.tdh,
      tdh_rate: profile.tdh_rate,
      xtdh: profile.xtdh,
      xtdh_rate: profile.xtdh_rate,
      level: profile.level,
      primary_wallet: profile.primary_wallet,
      active_main_stage_submission_ids:
        profile.active_main_stage_submission_ids,
      winner_main_stage_drop_ids: profile.winner_main_stage_drop_ids,
      artist_of_prevote_cards: profile.artist_of_prevote_cards,
      is_wave_creator: profile.is_wave_creator,
      classification: profile.classification,
      sub_classification: profile.sub_classification,
    };
  }, [profile]);

  if (standalone) {
    return (
      <a
        href={standaloneHref}
        target="_blank"
        rel="noopener noreferrer"
        className="tw-inline-flex tw-items-center tw-gap-3 tw-pb-4 tw-pt-1 tw-text-white tw-no-underline hover:tw-text-white"
      >
        <DropPfp pfpUrl={profile?.pfp} />
        <span className="tw-text-lg tw-font-medium tw-leading-none">
          {standaloneDisplayName}
        </span>
      </a>
    );
  }

  return (
    <UserProfileTooltipWrapper user={handle}>
      <div className="tw-inline-flex tw-items-center tw-gap-3 tw-pb-4 tw-pt-1">
        <DropPfp pfpUrl={profile?.pfp} />
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <Link
            href={href}
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
          {badgesProfile && (
            <DropAuthorBadges
              profile={badgesProfile}
              tooltipIdPrefix={`mint-artist-badges-${badgesProfile.id ?? handle}`}
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

  const manifoldClaimState = useManifoldClaim({
    chainId: props.chain.id,
    contract: props.contract,
    proxy: MANIFOLD_LAZY_CLAIM_CONTRACT,
    abi: props.abi,
    identifier: props.mintMetadata.tokenId,
    onError: () => {
      setIsError(true);
    },
  });
  const manifoldClaim = manifoldClaimState?.claim;
  const isManifoldClaimFetching = manifoldClaimState?.isFetching ?? false;

  const [fee, setFee] = useState<number>(0);
  const [mintForAddress, setMintForAddress] = useState<string | null>(null);
  const pageContainerClassName =
    "tw-mx-auto tw-w-full tw-max-w-7xl tw-px-4 md:tw-px-6";
  const standalonePageContainerClassName = clsx(
    pageContainerClassName,
    props.standalone && "tw-pt-4"
  );

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
  const artistNameLink = useMemo(() => {
    if (!artist) {
      return undefined;
    }

    const artistLabel = artist.name ?? artist.handle;

    if (!artist.handle) {
      return artistLabel;
    }

    if (props.standalone) {
      return (
        <a
          href={`https://6529.io/${artist.handle}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {artistLabel}
        </a>
      );
    }

    return <Link href={`/${artist.handle}`}>{artistLabel}</Link>;
  }, [artist, props.standalone]);

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
        hideConnect={props.standalone ?? false}
        setFee={setFee}
        setMintForAddress={setMintForAddress}
      />
    );
  }

  function printTitle() {
    return (
      <div className="tw-flex tw-items-center tw-gap-2 tw-py-8">
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
      <div className="tw-order-2 tw-py-8 md:tw-order-1 md:tw-col-span-5">
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
            {getNameForContract(props.contract)} #{props.mintMetadata.tokenId}
          </span>
        </div>
        {artist?.handle && (
          <ArtistInfoStrip
            handle={artist.handle}
            name={artist.name ?? undefined}
            standalone={props.standalone ?? false}
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
                        manifoldClaim.status !== ManifoldClaimStatus.ENDED && (
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
    );
  }

  function printImage() {
    if (!nftImage) {
      return <></>;
    }

    return (
      <div className="tw-order-1 tw-flex tw-items-center tw-justify-center tw-pt-4 md:tw-order-2 md:tw-col-span-7 md:tw-h-screen md:tw-pt-0">
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

  const printContent = (content: ReactNode, padContent?: boolean) => {
    return (
      <div className={standalonePageContainerClassName}>
        {props.standalone && (
          <div>
            <StandaloneMintPageTopBar />
            <div className="tw-mt-4 tw-h-px tw-w-full tw-bg-white/20" />
          </div>
        )}
        {printTestnetIndicator()}
        {!instance && !nftImage && printTitle()}
        {padContent ? <div className="tw-pt-8">{content}</div> : content}
      </div>
    );
  };

  if (!manifoldClaim) {
    return printContent(
      <div>
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
      </div>,
      true
    );
  }

  if (!instance || !nftImage) {
    return printContent(
      <div>
        <p className="tw-mb-0 tw-text-iron-100">No mint information found</p>
      </div>,
      true
    );
  }

  return printContent(
    <>
      <div className="tw-grid tw-gap-8 md:tw-grid-cols-12">
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
                <MetadataRow label="Artist" value={<b>{artistNameLink}</b>} />
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
    </>
  );
}
