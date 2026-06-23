import DotLoader from "@/components/dotLoader/DotLoader";
import NFTImage from "@/components/nft-image/NFTImage";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import { getRouteHrefWithLocale } from "@/components/rememes/rememesRouteParams";
import ArtistProfileHandle from "@/components/the-memes/ArtistProfileHandle";
import type { NFT } from "@/entities/INFT";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export function printMemeReferences(
  memes: NFT[],
  routerPath: string,
  memesLoaded: boolean = true,
  hideTitle: boolean = false,
  locale: SupportedLocale = DEFAULT_LOCALE
) {
  return (
    <div className="tw-pt-2">
      {!hideTitle && (
        <div className="tw-pt-2">
          <h1>{t(locale, "rememes.detail.references.title")}</h1>
        </div>
      )}
      {memesLoaded ? (
        <>
          {memes.length > 0 ? (
            <div className="tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-6 tw-pt-3 sm:tw-grid-cols-3 md:tw-grid-cols-4">
              {memes.map((nft) => {
                return (
                  <div
                    key={`${nft.contract}-${nft.id}`}
                    className="tw-min-w-0 tw-text-center tw-text-iron-200"
                  >
                    <a
                      href={getRouteHrefWithLocale({
                        href: `/${routerPath}/${nft.id}`,
                        locale,
                      })}
                      aria-label={t(locale, "rememes.detail.references.card", {
                        tokenId: nft.id,
                        name: nft.name,
                      })}
                      className="tw-block tw-min-w-0 tw-text-iron-200 tw-no-underline tw-transition-transform hover:tw-scale-[1.02] hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                    >
                      <NFTImage
                        nft={nft}
                        animation={false}
                        height={300}
                        showBalance={false}
                        showThumbnail={true}
                      />
                      <div className="tw-pt-2 tw-text-sm tw-font-semibold tw-leading-5">
                        #{nft.id} - {nft.name}
                      </div>
                      <div className="tw-pt-2 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
                        {t(locale, "rememes.detail.references.artistName", {
                          artist: nft.artist,
                        })}
                      </div>
                    </a>
                    <div className="tw-pt-2 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400 [&_a]:tw-text-iron-200 [&_a]:tw-no-underline hover:[&_a]:tw-text-white">
                      {t(locale, "rememes.detail.references.artistProfile")}{" "}
                      <ArtistProfileHandle nft={nft} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <NothingHereYetSummer />
            </div>
          )}
        </>
      ) : (
        <div>
          {t(locale, "rememes.detail.references.fetching")} <DotLoader />
        </div>
      )}
    </div>
  );
}

export function RememeReferencesGrid({
  memes,
  locale = DEFAULT_LOCALE,
}: {
  readonly memes: NFT[];
  readonly locale?: SupportedLocale | undefined;
}) {
  return (
    <section className="tw-space-y-5 tw-pb-5">
      <h2 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-200">
        {t(locale, "rememes.detail.references.title")}
      </h2>
      {memes.length > 0 ? (
        <div className="tw-grid tw-grid-cols-2 tw-gap-4 sm:tw-grid-cols-3 md:tw-grid-cols-4">
          {memes.map((nft) => (
            <div
              className="tw-group tw-min-w-0 tw-text-iron-200"
              key={`${nft.contract}-${nft.id}`}
            >
              <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-transition-colors group-hover:tw-border-iron-600">
                <a
                  href={getRouteHrefWithLocale({
                    href: `/the-memes/${nft.id}`,
                    locale,
                  })}
                  aria-label={t(locale, "rememes.detail.references.card", {
                    tokenId: nft.id,
                    name: nft.name,
                  })}
                  className="tw-block tw-min-w-0 tw-text-iron-200 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
                >
                  <div>
                    <NFTImage
                      nft={nft}
                      animation={false}
                      height={300}
                      showBalance={false}
                      showThumbnail={true}
                    />
                  </div>
                  <div className="tw-space-y-2 tw-p-3 tw-text-center">
                    <div className="tw-line-clamp-2 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100 group-hover:tw-text-white">
                      #{nft.id} - {nft.name}
                    </div>
                    <div className="tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400">
                      {t(locale, "rememes.detail.references.artistName", {
                        artist: nft.artist,
                      })}
                    </div>
                  </div>
                </a>
                <div className="tw-px-3 tw-pb-3 tw-text-center tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-400 [&_a]:tw-text-iron-200 [&_a]:tw-no-underline hover:[&_a]:tw-text-white">
                  {t(locale, "rememes.detail.references.artistProfile")}{" "}
                  <ArtistProfileHandle nft={nft} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <NothingHereYetSummer />
      )}
    </section>
  );
}
