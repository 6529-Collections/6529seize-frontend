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
    <div className="tw-group tw-relative">
      <div className="tw-relative tw-aspect-square tw-w-full">
        {hasVideo ? (
          <video
            src={animationUrl}
            poster={imageUrl}
            autoPlay
            loop
            muted
            playsInline
            className="tw-absolute tw-inset-0 tw-size-full tw-object-contain"
          />
        ) : (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 58vw, (min-width: 768px) 70vw, 100vw"
            className="tw-object-contain"
          />
        )}
      </div>
    </div>
  );
}
