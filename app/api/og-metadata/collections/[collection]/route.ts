import { getOgImageRequestOrigin } from "@/app/api/og-metadata/_lib/requestOrigin";
import {
  renderBrandedCollectionOgImage,
  type BrandedCollectionOgImageModel,
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

const COLLECTION_DEFAULTS: Record<
  string,
  {
    readonly imageUrl: string;
    readonly subtitle: string;
    readonly title: string;
  }
> = {
  "6529-gradient": {
    imageUrl: "/gradients-preview.png",
    subtitle: "The official 6529 Gradient collection",
    title: "6529 Gradient",
  },
  "meme-lab": {
    imageUrl: "/meme-lab.jpg",
    subtitle: "Experiments, editions, and collaborations from Meme Lab",
    title: "Meme Lab",
  },
  nextgen: {
    imageUrl: "/nextgen.png",
    subtitle: "Generative art collections from 6529",
    title: "NextGen",
  },
  rememes: {
    imageUrl: "/re-memes-b.jpeg",
    subtitle: "Community remixes and derivatives",
    title: "ReMemes",
  },
  "the-memes": {
    imageUrl: "/memes-preview.png",
    subtitle: "The Memes by 6529",
    title: "The Memes",
  },
};

const getCollectionCardModel = ({
  request,
  slug,
}: {
  readonly request: Request;
  readonly slug: string;
}): BrandedCollectionOgImageModel => {
  const searchParams = new URL(request.url).searchParams;
  const defaults = COLLECTION_DEFAULTS[slug];
  const title =
    getQueryText(searchParams, "title") ?? defaults?.title ?? "6529 Collection";

  return {
    badge: getQueryText(searchParams, "badge"),
    imageUrl: getQueryImageUrl(searchParams, "image") ?? defaults?.imageUrl,
    origin: getOgImageRequestOrigin(request),
    slug,
    subtitle:
      getQueryText(searchParams, "subtitle") ??
      defaults?.subtitle ??
      "Collections on 6529.io",
    title,
  };
};

export async function GET(
  request: Request,
  {
    params,
  }: {
    readonly params: Promise<{
      readonly collection?: string;
    }>;
  }
) {
  const { collection } = await params;
  const normalizedCollection = getUsableText(collection)?.toLowerCase();

  if (!normalizedCollection) {
    return NextResponse.json(
      {
        error:
          "Invalid collection. Use /api/og-metadata/collections/<collection>.",
      },
      { status: 400 }
    );
  }

  try {
    const montserratFonts = await loadMontserratFonts();
    return new ImageResponse(
      renderBrandedCollectionOgImage(
        getCollectionCardModel({
          request,
          slug: normalizedCollection,
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
    console.error("Unable to generate collection OG metadata image.", error);
    return NextResponse.json(
      { error: "Unable to generate collection OG metadata image." },
      { status: 502 }
    );
  }
}
