import { publicEnv } from "@/config/env";
import type { ApiOgMetadata } from "@/generated/models/ApiOgMetadata";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getOgImageRequestOrigin } from "../../_lib/requestOrigin";
import { loadMontserratFonts } from "../../profiles/[identity]/font";
import { renderDropOgImage } from "./image";

export const runtime = "edge";
export const revalidate = 86400;

const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;
const OG_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";

const getUsableText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
};

const fetchDropMetadata = async (id: string): Promise<ApiOgMetadata> => {
  const url = `${publicEnv.API_ENDPOINT}/api/og-metadata/drops/${encodeURIComponent(
    id
  )}`;
  const response = await fetch(url, {
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`Drop OG metadata request failed: ${response.status}`);
  }

  return response.json();
};

export async function GET(
  request: Request,
  { params }: { readonly params: Promise<{ readonly id?: string }> }
) {
  const { id } = await params;
  const normalizedId = getUsableText(id);

  if (!normalizedId) {
    return NextResponse.json(
      { error: "Invalid drop id. Use /api/og-metadata/drops/<id>." },
      { status: 400 }
    );
  }

  try {
    const metadata = await fetchDropMetadata(normalizedId);
    const montserratFonts = await loadMontserratFonts();

    return new ImageResponse(
      renderDropOgImage({
        author: metadata.author,
        drop: metadata.drop,
        id: normalizedId,
        origin: getOgImageRequestOrigin(request),
        wave: metadata.wave,
      }),
      {
        ...OG_IMAGE_SIZE,
        fonts: montserratFonts,
        headers: {
          "Cache-Control": OG_CACHE_CONTROL,
        },
      }
    );
  } catch (error) {
    console.error("Unable to generate drop OG metadata image.", error);
    return NextResponse.json(
      { error: "Unable to generate drop OG metadata image." },
      { status: 502 }
    );
  }
}
