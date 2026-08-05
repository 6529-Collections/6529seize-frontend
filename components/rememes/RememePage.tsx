"use client";

import { useCookieConsent } from "@/components/cookies/CookieConsentContext";
import RememeImage from "@/components/nft-image/RememeImage";
import NFTMarketplaceLinks from "@/components/nft-marketplace-links/NFTMarketplaceLinks";
import { RememeReferencesGrid } from "@/components/rememes/RememeReferences";
import {
  AdditionalDetailsSection,
  MetadataCard,
} from "@/components/the-memes/MemePageAdditionalDetails";
import { publicEnv } from "@/config/env";
import {
  MEMES_CONTRACT,
  OPENSEA_STORE_FRONT_CONTRACT,
} from "@/constants/constants";
import { useTitle } from "@/contexts/TitleContext";
import type { DBResponse } from "@/entities/IDBResponse";
import type { IAttribute, NFT, Rememe } from "@/entities/INFT";
import {
  areEqualAddresses,
  isIPFS,
  isUrl,
  parseIpfsUrl,
  parseNftDescriptionToHtml,
} from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import {
  CodeBracketSquareIcon,
  GlobeAltIcon,
  LinkIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useEnsName } from "wagmi";
import {
  getRememeDetailApiQuery,
  getRememeDetailHref,
  getRouteHrefWithLocale,
} from "./rememesRouteParams";
import {
  getRememeCollectionName,
  getRememeMetadataRecord,
  getRememeTitle,
  getRememeTokenLabel,
  RememeAddressValue,
  RememeExternalLink,
  RememeInfoMetric,
  RememeMetadataLink,
  RememeTabButton,
  Tabs,
} from "./RememePage.view";

export { printMemeReferences } from "@/components/rememes/RememeReferences";

interface Props {
  contract: string;
  id: string;
  locale?: SupportedLocale | undefined;
}

export default function RememePage(props: Readonly<Props>) {
  const locale = props.locale ?? DEFAULT_LOCALE;
  const { setTitle } = useTitle();
  const capacitor = useCapacitor();
  const { country } = useCookieConsent();
  const [rememe, setRememe] = useState<Rememe>();

  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.LIVE);

  const [memes, setMemes] = useState<NFT[]>([]);
  const [referencesLoaded, setReferencesLoaded] = useState(false);

  useEffect(() => {
    setRememe(undefined);
    setMemes([]);
    setReferencesLoaded(false);

    if (!props.contract || !props.id) {
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();

    async function fetchRememe() {
      if (!props.contract || !props.id) {
        return;
      }

      try {
        const query = getRememeDetailApiQuery({
          contract: props.contract,
          id: props.id,
        });
        const response = await fetchUrl<DBResponse<Rememe>>(
          `${publicEnv.API_ENDPOINT}/api/rememes?${query}`,
          { signal: abortController.signal }
        );
        if (cancelled) {
          return;
        }
        const fetchedRememe = response.data[0];
        if (response.data.length !== 1 || fetchedRememe === undefined) {
          return;
        }

        setRememe(fetchedRememe);
        setTitle(
          t(locale, "rememes.detail.browserTitle", {
            name: getRememeTitle(fetchedRememe),
          })
        );
      } catch (error: unknown) {
        if (
          cancelled ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }
        console.error("Failed to fetch ReMeme", error);
      }
    }

    void fetchRememe();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [locale, props.contract, props.id, setTitle]);

  useEffect(() => {
    if (activeTab !== Tabs.REFERENCES || !rememe || referencesLoaded) {
      return;
    }

    if (rememe.meme_references.length === 0) {
      setMemes([]);
      setReferencesLoaded(true);
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();

    fetchAllPages<NFT>(
      `${
        publicEnv.API_ENDPOINT
      }/api/nfts?contract=${MEMES_CONTRACT}&id=${rememe.meme_references.join(
        ","
      )}`,
      { signal: abortController.signal }
    )
      .then((responseNfts) => {
        if (cancelled) {
          return;
        }
        setMemes(responseNfts.sort((a, b) => a.id - b.id));
        setReferencesLoaded(true);
      })
      .catch((error: unknown) => {
        if (
          cancelled ||
          (error instanceof Error && error.name === "AbortError")
        ) {
          return;
        }
        console.error("Failed to fetch ReMeme references", error);
        setMemes([]);
        setReferencesLoaded(true);
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [activeTab, referencesLoaded, rememe]);

  const ensResolutionDeployer = useEnsName({
    address: rememe ? (rememe.deployer as `0x${string}`) : undefined,
    query: { enabled: rememe !== undefined },
    chainId: 1,
  });

  const ensResolutionAddedBy = useEnsName({
    address: rememe ? (rememe.added_by as `0x${string}`) : undefined,
    query: { enabled: rememe !== undefined },
    chainId: 1,
  });

  function printContent() {
    switch (activeTab) {
      case Tabs.LIVE:
        return printOverview();
      case Tabs.METADATA:
        return printMetadata();
      case Tabs.REFERENCES:
        return (
          <RememeReferencesGrid
            memes={memes}
            loading={!referencesLoaded}
            locale={locale}
          />
        );
    }
  }

  function getTabLabel(tab: Tabs) {
    switch (tab) {
      case Tabs.LIVE:
        return t(locale, "rememes.detail.tabs.overview");
      case Tabs.METADATA:
        return t(locale, "rememes.detail.tabs.metadata");
      case Tabs.REFERENCES:
        return t(locale, "rememes.detail.tabs.references");
    }
  }

  function printStaticCardHeader() {
    if (!rememe) {
      return null;
    }

    const isOpenSeaStorefront = areEqualAddresses(
      rememe.contract,
      OPENSEA_STORE_FRONT_CONTRACT
    );
    const addedByVisible =
      typeof rememe.added_by === "string" &&
      rememe.added_by.length > 0 &&
      !areEqualAddresses(rememe.deployer, rememe.added_by);

    return (
      <div className="tw-mb-6 tw-grid tw-grid-cols-1 tw-gap-x-10 lg:tw-grid-cols-[minmax(0,11fr)_minmax(0,9fr)] xl:tw-gap-x-16">
        <div className="tw-relative lg:tw-flex lg:tw-flex-col lg:tw-self-stretch">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-bg-iron-950 lg:tw-flex-1">
            <RememeImage nft={rememe} animation={true} height={650} />
          </div>
        </div>
        <div className="tw-pt-6 md:tw-pt-8 lg:tw-pt-2">
          <section
            aria-label={t(locale, "rememes.detail.sections.details")}
            className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-6 md:tw-pb-8"
          >
            <div className="tw-space-y-5">
              <RememeInfoMetric label={t(locale, "rememes.detail.collection")}>
                {getRememeTokenLabel(rememe)}
              </RememeInfoMetric>
              {!isOpenSeaStorefront && (
                <RememeInfoMetric
                  label={t(locale, "rememes.detail.createdBy")}
                  valueClassName="!tw-flex-nowrap [&_a]:tw-text-white [&_a:hover]:tw-text-iron-300"
                >
                  <RememeAddressValue
                    wallet={rememe.deployer}
                    display={ensResolutionDeployer.data ?? undefined}
                  />
                </RememeInfoMetric>
              )}
              {addedByVisible && (
                <RememeInfoMetric
                  label={t(locale, "rememes.detail.addedBy")}
                  valueClassName="!tw-flex-nowrap [&_a]:tw-text-white [&_a:hover]:tw-text-iron-300"
                >
                  <RememeAddressValue
                    wallet={rememe.added_by}
                    display={ensResolutionAddedBy.data ?? undefined}
                  />
                </RememeInfoMetric>
              )}
            </div>
          </section>
          <section className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-py-6 md:tw-py-8">
            <div className="tw-space-y-8">
              <div className="tw-space-y-4">
                <div className="tw-flex tw-min-w-0">
                  <RememeExternalLink
                    href={`https://etherscan.io/token/${rememe.contract}/?a=${rememe.id}`}
                    ariaLabel={t(locale, "rememes.detail.external.etherscan", {
                      collectionName: getRememeCollectionName(rememe),
                    })}
                  >
                    <Image
                      unoptimized
                      width={0}
                      height={0}
                      style={{ width: "20px", height: "auto" }}
                      src="/etherscan_w.png"
                      alt=""
                      aria-hidden="true"
                    />
                    <span>{getRememeCollectionName(rememe)}</span>
                  </RememeExternalLink>
                </div>
                {rememe.contract_opensea_data.externalUrl && (
                  <div className="-tw-ml-0.5 tw-flex tw-min-w-0">
                    <RememeExternalLink
                      href={rememe.contract_opensea_data.externalUrl}
                      openInNewTab={false}
                      ariaLabel={t(locale, "rememes.detail.external.website", {
                        url: rememe.contract_opensea_data.externalUrl,
                      })}
                    >
                      <GlobeAltIcon
                        aria-hidden="true"
                        className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-text-iron-400"
                      />
                      <span>{rememe.contract_opensea_data.externalUrl}</span>
                    </RememeExternalLink>
                  </div>
                )}
                {rememe.contract_opensea_data.twitterUsername && (
                  <div className="tw-flex tw-min-w-0">
                    <RememeExternalLink
                      href={`https://x.com/${rememe.contract_opensea_data.twitterUsername}`}
                      ariaLabel={t(locale, "rememes.detail.external.twitter", {
                        username: rememe.contract_opensea_data.twitterUsername,
                      })}
                    >
                      <Image
                        unoptimized
                        width={0}
                        height={0}
                        style={{ width: "20px", height: "auto" }}
                        src="/twitter.png"
                        alt=""
                        aria-hidden="true"
                      />
                      <span>
                        @{rememe.contract_opensea_data.twitterUsername}
                      </span>
                    </RememeExternalLink>
                  </div>
                )}
              </div>
              {(!capacitor.isIos || country === "US") && (
                <div className="tw-w-fit tw-max-w-full">
                  <NFTMarketplaceLinks
                    contract={rememe.contract}
                    id={rememe.id}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  function printOverview() {
    if (!rememe) {
      return null;
    }

    const metadata = getRememeMetadataRecord(rememe);
    const description =
      typeof metadata["description"] === "string"
        ? metadata["description"]
        : "";

    return (
      <div className="tw-space-y-4 tw-pb-8">
        <section className="tw-max-w-4xl tw-text-pretty tw-pb-3">
          <div
            className="tw-text-base tw-font-normal tw-text-iron-300"
            dangerouslySetInnerHTML={{
              __html: parseNftDescriptionToHtml(description),
            }}
          />
        </section>
        {printReplicas()}
      </div>
    );
  }

  function printReplicas() {
    if (!rememe || rememe.replicas.length <= 1) {
      return null;
    }

    return (
      <section className="tw-pb-5 tw-pt-3">
        <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
          <h2 className="tw-mb-0 tw-text-lg tw-font-semibold tw-leading-6 tw-text-iron-100">
            {t(locale, "rememes.detail.replicas.title")}
          </h2>
          <span className="tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-400">
            {t(locale, "rememes.detail.replicas.count", {
              count: formatInteger(locale, rememe.replicas.length),
            })}
          </span>
        </div>
        <div className="tw-mt-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-500">
          {t(locale, "rememes.detail.replicas.description")}
        </div>
        <div className="tw-mt-5 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
          {rememe.replicas
            .filter((rep) => Number(rep) !== Number.parseInt(rememe.id, 10))
            .map((rep) => (
              <Link
                href={getRememeDetailHref({
                  contract: rememe.contract,
                  id: rep,
                  locale,
                })}
                aria-label={t(locale, "rememes.detail.replicas.link", {
                  tokenId: rep,
                })}
                className="tw-inline-flex tw-items-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-200 tw-no-underline tw-transition-colors hover:tw-border-iron-500 hover:tw-bg-iron-900 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                key={`${rememe.contract}-${rep}-replica`}
              >
                #{rep}
              </Link>
            ))}
        </div>
      </section>
    );
  }

  function getAttributes(): IAttribute[] {
    if (!rememe) {
      return [];
    }

    const metadata = getRememeMetadataRecord(rememe);
    const attributes = metadata["attributes"];
    if (Array.isArray(attributes)) {
      return attributes as IAttribute[];
    }

    if (
      attributes !== null &&
      attributes !== undefined &&
      typeof attributes === "object"
    ) {
      return Object.entries(attributes as Record<string, string | number>).map(
        ([key, value]) => ({
          trait_type: key,
          value,
        })
      );
    }

    return [];
  }

  function printValue(value: string) {
    if (isUrl(value) || isIPFS(value)) {
      return (
        <RememeMetadataLink href={parseIpfsUrl(value)}>
          <span>{value}</span>
        </RememeMetadataLink>
      );
    }

    return value;
  }

  function getMetadataRows() {
    if (!rememe) {
      return [];
    }

    return Object.entries(getRememeMetadataRecord(rememe)).flatMap(
      ([key, value]) => {
        if (key === "name" || key === "description" || key === "attributes") {
          return [];
        }

        if (typeof value === "string") {
          return [{ key, label: key, value: printValue(value) }];
        }

        if (
          value !== null &&
          value !== undefined &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          return Object.entries(value as Record<string, unknown>).flatMap(
            ([nestedKey, nestedValue]) => {
              if (typeof nestedValue !== "string") {
                return [];
              }

              return [
                {
                  key: `${key}-${nestedKey}`,
                  label: `${key}::${nestedKey}`,
                  value: nestedValue,
                },
              ];
            }
          );
        }

        return [];
      }
    );
  }

  function printMetadata() {
    if (!rememe) {
      return null;
    }

    const attributes = getAttributes();
    const metadataRows = getMetadataRows();

    return (
      <div className="tw-space-y-14 tw-pb-8">
        <section>
          <div className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-6 sm:tw-gap-x-8 md:tw-grid-cols-3 md:tw-gap-x-10">
            <div className="tw-min-w-0 md:tw-col-span-2">
              <RememeInfoMetric label={t(locale, "rememes.detail.tokenUri")}>
                <RememeExternalLink href={rememe.token_uri} align="start">
                  <LinkIcon
                    aria-hidden="true"
                    className="tw-mt-0.5 tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-500 md:tw-mt-1"
                  />
                  <span className="tw-min-w-0 tw-break-words">
                    {rememe.token_uri}
                  </span>
                </RememeExternalLink>
              </RememeInfoMetric>
            </div>
            <RememeInfoMetric label={t(locale, "rememes.detail.tokenType")}>
              {rememe.token_type}
            </RememeInfoMetric>
          </div>
        </section>

        {metadataRows.length > 0 && (
          <AdditionalDetailsSection
            title={t(locale, "rememes.detail.metadata.title")}
            icon={CodeBracketSquareIcon}
          >
            <div className="tw-overflow-x-auto tw-overflow-y-hidden tw-pb-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
              <table className="tw-w-full tw-min-w-[640px] tw-border-collapse">
                <tbody>
                  {metadataRows.map((row) => (
                    <tr
                      key={row.key}
                      className="odd:tw-bg-iron-900/40 even:tw-bg-transparent"
                    >
                      <td className="tw-w-52 tw-whitespace-nowrap tw-border-0 tw-px-4 tw-py-3 tw-align-top tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-text-iron-500">
                        {row.label}
                      </td>
                      <td className="tw-border-0 tw-px-4 tw-py-3 tw-align-top tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-200">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdditionalDetailsSection>
        )}

        {attributes.length > 0 && (
          <AdditionalDetailsSection
            title={t(locale, "rememes.detail.properties.title")}
            icon={SwatchIcon}
          >
            <div className="tw-grid tw-grid-cols-2 tw-gap-3 sm:tw-grid-cols-3 lg:tw-grid-cols-4">
              {attributes.map((attribute) => (
                <MetadataCard
                  key={`${attribute.trait_type}-${attribute.value}`}
                  label={attribute.trait_type}
                  value={attribute.value}
                />
              ))}
            </div>
          </AdditionalDetailsSection>
        )}
      </div>
    );
  }

  function printTabs() {
    if (!rememe) {
      return null;
    }

    return (
      <nav
        aria-label={t(locale, "rememes.detail.sections.tabs")}
        className="tw-relative tw-mb-8 tw-overflow-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800"
      >
        <div className="tw-w-full tw-overflow-x-auto tw-overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:tw-hidden">
          <div className="-tw-mb-px tw-flex tw-min-w-max tw-gap-x-3 lg:tw-gap-x-4">
            {Object.values(Tabs).map((tab) => (
              <RememeTabButton
                key={`${tab}-tab`}
                title={getTabLabel(tab)}
                isActive={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <div className="tailwind-scope tw-min-h-[calc(100vh-100px)] tw-border tw-border-y-0 tw-border-l-0 tw-border-solid tw-border-iron-800 tw-bg-[#0D0D0F] tw-pb-5 tw-text-white">
      <div className="tw-px-4 tw-py-4 md:tw-px-6 md:tw-pb-10 lg:tw-px-8">
        <header className="tw-pb-8">
          <div className="tw-flex tw-flex-col tw-gap-4">
            <div className="tw-mb-0 tw-flex tw-items-center">
              <Link
                href={getRouteHrefWithLocale({ href: "/rememes", locale })}
                aria-label={t(locale, "rememes.detail.backLink.ariaLabel")}
                className="tw-group -tw-ml-2 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-md tw-px-2 tw-py-2 tw-text-xs tw-font-semibold tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors hover:tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
              >
                <ArrowLeftIcon
                  aria-hidden="true"
                  className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-transition-transform group-hover:-tw-translate-x-0.5"
                />
                {t(locale, "rememes.title")}
              </Link>
            </div>
            {rememe ? (
              <h1
                className="tw-mb-0 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 md:tw-flex-nowrap md:tw-gap-x-0"
                aria-label={t(locale, "rememes.detail.heading.ariaLabel", {
                  name: getRememeTitle(rememe),
                })}
              >
                <span className="tw-shrink-0">
                  <Image
                    unoptimized
                    loading="eager"
                    width={0}
                    height={0}
                    style={{ width: "200px", height: "auto" }}
                    src="/re-memes.png"
                    alt={t(locale, "rememes.logoAlt")}
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="tw-mx-3 tw-h-5 tw-w-px tw-self-center tw-bg-white/[0.16] sm:tw-h-6"
                />
                <span className="tw-mb-0 tw-min-w-0 tw-whitespace-normal tw-break-words tw-text-lg tw-font-semibold tw-leading-tight tw-text-iron-100 sm:tw-text-2xl">
                  {getRememeTitle(rememe)}
                </span>
              </h1>
            ) : (
              <Image
                unoptimized
                loading="eager"
                width={0}
                height={0}
                style={{ width: "200px", height: "auto" }}
                src="/re-memes.png"
                alt={t(locale, "rememes.logoAlt")}
              />
            )}
          </div>
        </header>
        {rememe && (
          <>
            {printStaticCardHeader()}
            {printTabs()}
            {printContent()}
          </>
        )}
      </div>
    </div>
  );
}
