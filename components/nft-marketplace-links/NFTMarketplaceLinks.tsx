import Image from "next/image";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import Link from "next/link";
import { isGradientsContract } from "@/helpers/Helpers";

type MarketplaceLink = {
  key: string;
  title: string;
  alt: string;
  imageSrc: string;
  enabled: boolean;
  getHref: (contract: string, id: string | number) => string;
  shouldShow?: (contract: string) => boolean;
};

const MARKETPLACES: readonly MarketplaceLink[] = [
  {
    key: "opensea",
    title: "OpenSea",
    alt: "opensea",
    imageSrc: "/opensea.png",
    enabled: true,
    getHref: (contract: string, id: string | number) =>
      `https://opensea.io/assets/ethereum/${contract}/${id}`,
  },
  {
    key: "blur",
    title: "Blur.io",
    alt: "blur",
    imageSrc: "/blur.png",
    enabled: true,
    shouldShow: (contract: string) => isGradientsContract(contract),
    getHref: (contract: string, id: string | number) =>
      `https://blur.io/eth/asset/${contract}/${id}`,
  },
  {
    key: "magiceden",
    title: "Magic Eden",
    alt: "magic-eden",
    imageSrc: "/magiceden.png",
    enabled: false,
    getHref: (contract: string, id: string | number) =>
      `https://magiceden.io/item-details/ethereum/${contract}/${id}`,
  },
  {
    key: "rarible",
    title: "Rarible",
    alt: "rarible",
    imageSrc: "/rarible.svg",
    enabled: true,
    getHref: (contract: string, id: string | number) =>
      `https://rarible.com/ethereum/items/${contract}:${id}`,
  },
];

export default function NFTMarketplaceLinks({
  contract,
  id,
}: {
  readonly contract: string;
  readonly id: string | number;
}) {
  const isMobile = useIsMobileScreen();
  const size = isMobile ? 25 : 35;
  const visibleMarketplaces = MARKETPLACES.filter(
    (marketplace) =>
      marketplace.enabled &&
      (marketplace.shouldShow ? marketplace.shouldShow(contract) : true)
  );

  return (
    <div className="tw-flex tw-gap-2">
      {visibleMarketplaces.map((marketplace) => (
        <Link
          key={marketplace.key}
          title={marketplace.title}
          className="hover:tw-opacity-75"
          href={marketplace.getHref(contract, id)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            unoptimized
            src={marketplace.imageSrc}
            alt={marketplace.alt}
            width={size}
            height={size}
          />
        </Link>
      ))}
    </div>
  );
}
