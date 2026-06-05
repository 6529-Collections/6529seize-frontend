import { publicEnv } from "@/config/env";
import type { ApiOgMetadata } from "@/generated/models/ApiOgMetadata";
import { getOgImageRequestOrigin } from "@/app/api/og-metadata/_lib/requestOrigin";
import { loadMontserratFonts } from "@/app/api/og-metadata/profiles/[identity]/font";
import { renderWaveOgImage } from "@/app/api/og-metadata/waves/[id]/image";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 3600;

const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;
const OG_CACHE_CONTROL =
  "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400";

const getUsableText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
};

const fetchWaveMetadata = async (id: string): Promise<ApiOgMetadata> => {
  const url = `${publicEnv.API_ENDPOINT}/api/og-metadata/waves/${encodeURIComponent(
    id
  )}`;
  const response = await fetch(url, {
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`Wave OG metadata request failed: ${response.status}`);
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
      { error: "Invalid wave id. Use /api/og-metadata/waves/<id>." },
      { status: 400 }
    );
  }

  try {
    const metadata = await fetchWaveMetadata(normalizedId);
    const montserratFonts = await loadMontserratFonts();

    return new ImageResponse(
      renderWaveOgImage({
        wave: metadata.wave,
        author: metadata.author,
        id: normalizedId,
        origin: getOgImageRequestOrigin(request),
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
    console.error("Unable to generate wave OG metadata image.", error);
    return NextResponse.json(
      { error: "Unable to generate wave OG metadata image." },
      { status: 502 }
    );
  }
}
