import { getOgImageRequestOrigin } from "@/app/api/og-metadata/_lib/requestOrigin";
import {
  renderBrandedNftOgImage,
  type BrandedNftOgImageModel,
} from "@/app/api/og-metadata/_lib/brandedCards";
import {
  getQueryImageUrl,
  getQueryText,
  OG_CACHE_CONTROL,
} from "@/app/api/og-metadata/_lib/routeUtils";
import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";
import { loadMontserratFonts } from "@/app/api/og-metadata/profiles/[identity]/font";
import {
  NFT_SOCIAL_CARD_SIZES,
  type NftSocialCardFormat,
} from "@/components/providers/metadata";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { prepareNftArtworkImage } from "./artwork";
import { fetchNftCardMetadata, type NftCardMetadata } from "./metadata";

export const runtime = "edge";
export const revalidate = 3600;

const getDefaultTitle = ({
  collection,
  id,
}: {
  readonly collection: string | null;
  readonly id: string;
}): string => (collection ? `${collection} #${id}` : `NFT #${id}`);

const getNftCardModel = ({
  contract,
  id,
  format,
  request,
  metadata,
}: {
  readonly contract: string;
  readonly id: string;
  readonly format: NftSocialCardFormat;
  readonly request: Request;
  readonly metadata: NftCardMetadata | null;
}): BrandedNftOgImageModel => {
  const searchParams = new URL(request.url).searchParams;
  const collection =
    getQueryText(searchParams, "collection") ?? metadata?.collection ?? null;
  const title =
    getQueryText(searchParams, "title") ??
    metadata?.title ??
    getDefaultTitle({ collection, id });

  return {
    artist: getQueryText(searchParams, "artist") ?? metadata?.artist,
    badge: getQueryText(searchParams, "badge") ?? metadata?.badge ?? collection,
    collection,
    contract,
    displayId: getQueryText(searchParams, "displayId") ?? metadata?.displayId,
    format,
    id,
    imageUrl: getQueryImageUrl(searchParams, "image") ?? metadata?.imageUrl,
    origin: getOgImageRequestOrigin(request),
    subtitle: getQueryText(searchParams, "subtitle"),
    title,
  };
};

export async function GET(
  request: Request,
  {
    params,
  }: {
    readonly params: Promise<{
      readonly contract?: string;
      readonly id?: string;
    }>;
  }
) {
  const { contract, id } = await params;
  const normalizedContract = getUsableText(contract);
  const normalizedId = getUsableText(id);

  if (!normalizedContract || !normalizedId) {
    return NextResponse.json(
      { error: "Invalid NFT. Use /api/og-metadata/nfts/<contract>/<id>." },
      { status: 400 }
    );
  }

  const requestedFormat = new URL(request.url).searchParams.get("format");
  const format = requestedFormat ?? "landscape";
  if (!Object.hasOwn(NFT_SOCIAL_CARD_SIZES, format)) {
    return NextResponse.json(
      {
        error:
          "Invalid artwork format. Use landscape, square, portrait, or story.",
      },
      { status: 400 }
    );
  }
  const cardFormat = format as NftSocialCardFormat;

  try {
    const searchParams = new URL(request.url).searchParams;
    const metadata =
      getQueryImageUrl(searchParams, "image") === null
        ? await fetchNftCardMetadata(
            normalizedContract,
            normalizedId,
            request.signal
          )
        : null;
    const model = getNftCardModel({
      contract: normalizedContract,
      id: normalizedId,
      format: cardFormat,
      request,
      metadata,
    });
    // Satori swallows remote image failures. Explicit downloads must have art
    // ready before rendering; ordinary crawler previews retain their fallback.
    const imageDataUrl =
      requestedFormat === null
        ? undefined
        : await prepareNftArtworkImage(model, request.signal);
    const montserratFonts = await loadMontserratFonts();
    return new ImageResponse(
      renderBrandedNftOgImage({ ...model, imageDataUrl }),
      {
        ...NFT_SOCIAL_CARD_SIZES[cardFormat],
        fonts: montserratFonts,
        headers: {
          "Cache-Control": OG_CACHE_CONTROL,
        },
      }
    );
  } catch (error) {
    console.error("Unable to generate NFT OG metadata image.", error);
    return NextResponse.json(
      { error: "Unable to generate NFT OG metadata image." },
      { status: 502 }
    );
  }
}
