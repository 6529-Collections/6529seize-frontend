import { publicEnv } from "@/config/env";
import type { ApiOgMetadata } from "@/generated/models/ApiOgMetadata";
import { getOgImageRequestOrigin } from "@/app/api/og-metadata/_lib/requestOrigin";
import { loadMontserratFonts } from "@/app/api/og-metadata/profiles/[identity]/font";
import { renderProfileOgImage } from "@/app/api/og-metadata/profiles/[identity]/image";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 300;

const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;
const OG_CACHE_CONTROL =
  "public, max-age=300, s-maxage=300, stale-while-revalidate=600";

const getUsableText = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
};

const fetchProfileMetadata = async (
  identity: string
): Promise<ApiOgMetadata> => {
  const url = `${publicEnv.API_ENDPOINT}/api/og-metadata/profiles/${encodeURIComponent(
    identity
  )}`;
  const response = await fetch(url, {
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`Profile OG metadata request failed: ${response.status}`);
  }

  return response.json();
};

export async function GET(
  request: Request,
  { params }: { readonly params: Promise<{ readonly identity?: string }> }
) {
  const { identity } = await params;
  const normalizedIdentity = getUsableText(identity);

  if (!normalizedIdentity) {
    return NextResponse.json(
      { error: "Invalid identity. Use /api/og-metadata/profiles/<identity>." },
      { status: 400 }
    );
  }

  try {
    const metadata = await fetchProfileMetadata(normalizedIdentity);
    const montserratFonts = await loadMontserratFonts();

    return new ImageResponse(
      renderProfileOgImage({
        profile: metadata.profile,
        identity: normalizedIdentity,
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
    console.error("Unable to generate profile OG metadata image.", error);
    return NextResponse.json(
      { error: "Unable to generate profile OG metadata image." },
      { status: 502 }
    );
  }
}
