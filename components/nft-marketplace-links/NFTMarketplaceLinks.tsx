import Image from "next/image";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import Link from "next/link";
import { isGradientsContract } from "@/helpers/Helpers";

export default function NFTMarketplaceLinks({
  contract,
  id,
}: {
  readonly contract: string;
  readonly id: string | number;
}) {
  const isMobile = useIsMobileScreen();
  const size = isMobile ? 25 : 35;

  return (
    <div className="tw-flex tw-gap-2">
      <Link
        title="OpenSea"
        className="hover:tw-opacity-75"
        href={`https://opensea.io/assets/ethereum/${contract}/${id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          unoptimized
          src="/opensea.png"
          alt="opensea"
          width={size}
          height={size}
        />
      </Link>
      {isGradientsContract(contract) && (
        <Link
          title="Blur.io"
          className="hover:tw-opacity-75"
          href={`https://blur.io/eth/asset/${contract}/${id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            unoptimized
            src="/blur.png"
            alt="blur"
            width={size}
            height={size}
          />
        </Link>
      )}
      <Link
        title="Magic Eden"
        className="hover:tw-opacity-75"
        href={`https://magiceden.io/item-details/ethereum/${contract}/${id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          unoptimized
          src="/magiceden.png"
          alt="magic-eden"
          width={size}
          height={size}
        />
      </Link>
      <Link
        title="Rarible"
        className="hover:tw-opacity-75"
        href={`https://rarible.com/ethereum/items/${contract}:${id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          unoptimized
          src="/rarible.svg"
          alt="rarible"
          width={size}
          height={size}
        />
      </Link>
    </div>
  );
}
