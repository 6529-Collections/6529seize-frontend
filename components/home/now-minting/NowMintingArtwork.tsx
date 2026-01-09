import Image from "next/image";

interface NowMintingArtworkProps {
  readonly imageUrl: string;
  readonly animationUrl?: string;
  readonly title: string;
}

export default function NowMintingArtwork({
  imageUrl,
  animationUrl,
  title,
}: NowMintingArtworkProps) {
  const hasVideo = !!animationUrl && animationUrl.length > 0;

  return (
    <div className="tw-w-full md:tw-w-1/2">
      <div className="tw-relative tw-aspect-square tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-iron-900">
        {hasVideo ? (
          <video
            src={animationUrl}
            poster={imageUrl}
            autoPlay
            loop
            muted
            playsInline
            className="tw-size-full tw-object-cover"
          />
        ) : (
          <Image src={imageUrl} alt={title} fill className="tw-object-cover" />
        )}
      </div>
    </div>
  );
}
