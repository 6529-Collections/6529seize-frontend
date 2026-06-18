import { getOgImageRequestOrigin } from "@/app/api/og-metadata/_lib/requestOrigin";
import {
  renderBrandedNftOgImage,
  type BrandedNftOgImageModel,
} from "@/app/api/og-metadata/_lib/brandedCards";
import {
  getQueryImageUrl,
  getQueryText,
  OG_CACHE_CONTROL,
  OG_IMAGE_SIZE,
} from "@/app/api/og-metadata/_lib/routeUtils";
import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";
import { loadMontserratFonts } from "@/app/api/og-metadata/profiles/[identity]/font";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

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
  request,
}: {
  readonly contract: string;
  readonly id: string;
  readonly request: Request;
}): BrandedNftOgImageModel => {
  const searchParams = new URL(request.url).searchParams;
  const collection = getQueryText(searchParams, "collection");
  const title =
    getQueryText(searchParams, "title") ?? getDefaultTitle({ collection, id });

  return {
    artist: getQueryText(searchParams, "artist"),
    badge: getQueryText(searchParams, "badge") ?? collection,
    collection,
    contract,
    displayId: getQueryText(searchParams, "displayId"),
    id,
    imageUrl: getQueryImageUrl(searchParams, "image"),
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

  try {
    const montserratFonts = await loadMontserratFonts();
    return new ImageResponse(
      renderBrandedNftOgImage(
        getNftCardModel({
          contract: normalizedContract,
          id: normalizedId,
          request,
        })
      ),
      {
        ...OG_IMAGE_SIZE,
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
