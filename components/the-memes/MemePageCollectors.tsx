import NFTLeaderboard from "@/components/leaderboard/NFTLeaderboard";
import type { MemesExtendedData, NFT } from "@/entities/INFT";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { MemeCollectorsStats } from "./MemePageLiveStats";

export function MemePageCollectorsSubMenu(props: {
  show: boolean;
  nft: NFT | undefined;
  nftMeta?: MemesExtendedData | undefined;
  locale?: SupportedLocale;
}) {
  if (props.show && props.nft) {
    const locale = props.locale ?? DEFAULT_LOCALE;

    return (
      <>
        {props.nftMeta && (
          <div>
            <MemeCollectorsStats nftMeta={props.nftMeta} locale={locale} />
          </div>
        )}
        <div className="tw-pt-3">
          <NFTLeaderboard contract={props.nft.contract} nftId={props.nft.id} />
        </div>
      </>
    );
  }

  return <></>;
}
