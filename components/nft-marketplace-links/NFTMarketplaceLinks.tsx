import Image from "next/image";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import Link from "next/link";
import { isGradientsContract, isMemesContract } from "@/helpers/Helpers";

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
    key: "manifold",
    title: "Manifold.xyz",
    alt: "manifold",
    imageSrc: "/manifold.svg",
    enabled: true,
    shouldShow: (contract: string) => isMemesContract(contract),
    getHref: (_contract: string, id: string | number) =>
      `https://manifold.xyz/@6529-collections/contract/1828532464/${id}`,
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
  include6529CollectionLink = false,
}: {
  readonly contract: string;
  readonly id: string | number;
  readonly include6529CollectionLink?: boolean;
}) {
  const isMobile = useIsMobileScreen();
  const size = isMobile ? 25 : 35;
  const visibleMarketplaces = MARKETPLACES.filter(
    (marketplace) =>
      marketplace.enabled &&
      (marketplace.shouldShow ? marketplace.shouldShow(contract) : true)
  );
  const marketplaces = include6529CollectionLink
    ? [
        {
          key: "6529",
          title: "6529.io",
          alt: "6529",
          imageSrc: "/6529bgwhite.svg",
          href: `https://6529.io/the-memes/${id}`,
        },
        ...visibleMarketplaces.map((marketplace) => ({
          key: marketplace.key,
          title: marketplace.title,
          alt: marketplace.alt,
          imageSrc: marketplace.imageSrc,
          href: marketplace.getHref(contract, id),
        })),
      ]
    : visibleMarketplaces.map((marketplace) => ({
        key: marketplace.key,
        title: marketplace.title,
        alt: marketplace.alt,
        imageSrc: marketplace.imageSrc,
        href: marketplace.getHref(contract, id),
      }));

  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      {marketplaces.map((marketplace) => (
        <Link
          key={marketplace.key}
          title={marketplace.title}
          className="tw-flex tw-items-center hover:tw-opacity-75"
          href={marketplace.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            unoptimized
            className="tw-rounded-md"
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
