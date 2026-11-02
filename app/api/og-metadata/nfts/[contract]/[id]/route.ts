import { getOgImageRequestOrigin } from "@/app/api/og-metadata/_lib/requestOrigin";
import {
  renderBrandedNftOgImage,
  type BrandedNftOgImageModel,
} from "@/app/api/og-metadata/_lib/brandedCards";
import {
  OG_CACHE_CONTROL,
  OG_FALLBACK_CACHE_CONTROL,
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
import {
  fetchNftCardMetadata,
  getFallbackNftCardMetadata,
  NFT_CONTRACT_PATTERN,
  NFT_TOKEN_ID_PATTERN,
  type NftCardMetadata,
} from "./metadata";

export const runtime = "edge";
export const revalidate = 3600;

// Explicit exports are user-initiated downloads that always need the backend
// artwork (there is no client-supplied fallback), so their lookup may take
// longer than a crawler preview's before the export is reported as failed.
const EXPORT_LOOKUP_TIMEOUT_MS = 10_000;

// Card text and artwork come only from the backend lookup for the path
// identity. Query strings select the export format and nothing else.
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
}): BrandedNftOgImageModel => ({
  artist: metadata?.artist,
  badge: metadata?.badge,
  collection: metadata?.collection,
  contract,
  displayId: metadata?.displayId,
  format,
  id,
  imageUrl: metadata?.imageUrl,
  origin: getOgImageRequestOrigin(request),
  title: metadata?.title ?? `NFT #${id}`,
});

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

  if (
    !normalizedContract ||
    !normalizedId ||
    !NFT_CONTRACT_PATTERN.test(normalizedContract) ||
    !NFT_TOKEN_ID_PATTERN.test(normalizedId)
  ) {
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
    const metadata = await fetchNftCardMetadata(
      normalizedContract,
      normalizedId,
      request.signal,
      requestedFormat === null
        ? undefined
        : { timeoutMs: EXPORT_LOOKUP_TIMEOUT_MS }
    );
    const model = getNftCardModel({
      contract: normalizedContract,
      id: normalizedId,
      format: cardFormat,
      request,
      metadata:
        metadata ??
        getFallbackNftCardMetadata(normalizedContract, normalizedId),
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
          "Cache-Control":
            metadata === null ? OG_FALLBACK_CACHE_CONTROL : OG_CACHE_CONTROL,
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
