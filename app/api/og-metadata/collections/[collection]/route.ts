import { getOgImageRequestOrigin } from "@/app/api/og-metadata/_lib/requestOrigin";
import {
  renderBrandedCollectionOgImage,
  type BrandedCollectionOgImageModel,
} from "@/app/api/og-metadata/_lib/brandedCards";
import {
  OG_CACHE_CONTROL,
  OG_FALLBACK_CACHE_CONTROL,
  OG_IMAGE_SIZE,
} from "@/app/api/og-metadata/_lib/routeUtils";
import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";
import { loadMontserratFonts } from "@/app/api/og-metadata/profiles/[identity]/font";
import {
  COLLECTION_CARD_VARIANTS,
  COLLECTION_CARD_VIEW_LABELS,
  findClosedCardValue,
  type CollectionCardVariant,
} from "@/components/providers/socialCardVariants";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import {
  fetchLatestMemeMintTitle,
  fetchNextgenCollectionCard,
} from "./metadata";

export const runtime = "edge";
export const revalidate = 3600;

type CollectionCardText = {
  readonly subtitle: string;
  readonly title: string;
};

type CollectionDefaults = CollectionCardText & {
  readonly imageUrl: string;
  readonly variants?: Partial<
    Record<CollectionCardVariant, CollectionCardText>
  >;
};

type CollectionCardContent = CollectionCardText & {
  readonly imageUrl: string;
  readonly isResolved: boolean;
};

// Every collection card is built from this fixed registry plus backend
// lookups. Request query strings never supply card text or artwork.
const COLLECTION_DEFAULTS: Record<string, CollectionDefaults> = {
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
    variants: {
      admin: {
        subtitle: "Manage NextGen collections",
        title: "NextGen Admin",
      },
    },
  },
  rememes: {
    imageUrl: "/re-memes-b.jpeg",
    subtitle: "Community remixes and derivatives",
    title: "ReMemes",
    variants: {
      add: {
        subtitle: "Submit a community remix or derivative",
        title: "Add a ReMeme",
      },
    },
  },
  "the-memes": {
    imageUrl: "/memes-preview.png",
    subtitle: "The Memes by 6529",
    title: "The Memes",
    variants: {
      mint: {
        subtitle: "Latest The Memes mint on 6529.io",
        title: "Mint | The Memes",
      },
    },
  },
};

const resolveCollectionCardContent = async ({
  defaults,
  searchParams,
  signal,
  slug,
}: {
  readonly defaults: CollectionDefaults;
  readonly searchParams: URLSearchParams;
  readonly signal: AbortSignal;
  readonly slug: string;
}): Promise<CollectionCardContent> => {
  const variant = findClosedCardValue(
    COLLECTION_CARD_VARIANTS,
    searchParams.get("variant")
  );
  const variantText =
    variant === undefined ? undefined : defaults.variants?.[variant];
  const content: CollectionCardContent = {
    imageUrl: defaults.imageUrl,
    isResolved: true,
    subtitle: variantText?.subtitle ?? defaults.subtitle,
    title: variantText?.title ?? defaults.title,
  };

  if (slug === "the-memes" && variant === "mint") {
    const mintTitle = await fetchLatestMemeMintTitle(signal);
    return {
      ...content,
      isResolved: mintTitle !== null,
      title: mintTitle ?? content.title,
    };
  }

  const collectionId =
    slug === "nextgen" ? getUsableText(searchParams.get("collection")) : null;
  if (collectionId === null) {
    return content;
  }

  const collection = await fetchNextgenCollectionCard(collectionId, signal);
  if (collection === null) {
    return { ...content, isResolved: false };
  }
  return {
    ...content,
    imageUrl: collection.imageUrl ?? content.imageUrl,
    subtitle: `${collection.name} | NextGen`,
    title: collection.name,
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
  const defaults = Object.hasOwn(COLLECTION_DEFAULTS, normalizedCollection)
    ? COLLECTION_DEFAULTS[normalizedCollection]
    : undefined;
  if (defaults === undefined) {
    return NextResponse.json({ error: "Unknown collection." }, { status: 404 });
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const content = await resolveCollectionCardContent({
      defaults,
      searchParams,
      signal: request.signal,
      slug: normalizedCollection,
    });
    const view = findClosedCardValue(
      COLLECTION_CARD_VIEW_LABELS,
      searchParams.get("view")
    );
    const model: BrandedCollectionOgImageModel = {
      imageUrl: content.imageUrl,
      origin: getOgImageRequestOrigin(request),
      slug: normalizedCollection,
      subtitle: content.subtitle,
      title: view === undefined ? content.title : `${view} | ${content.title}`,
    };
    const montserratFonts = await loadMontserratFonts();
    return new ImageResponse(renderBrandedCollectionOgImage(model), {
      ...OG_IMAGE_SIZE,
      fonts: montserratFonts,
      headers: {
        "Cache-Control": content.isResolved
          ? OG_CACHE_CONTROL
          : OG_FALLBACK_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Unable to generate collection OG metadata image.", error);
    return NextResponse.json(
      { error: "Unable to generate collection OG metadata image." },
      { status: 502 }
    );
  }
}
