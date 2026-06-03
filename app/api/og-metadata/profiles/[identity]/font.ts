type MontserratFontWeight = 400 | 500 | 600 | 700;

type MontserratFontSource = {
  readonly url: URL;
  readonly weight: MontserratFontWeight;
};

type MontserratFontDefinition = {
  readonly name: "Montserrat";
  readonly data: ArrayBuffer;
  readonly weight: MontserratFontWeight;
  readonly style: "normal";
};

const FONT_FETCH_TIMEOUT_MS = 3000;

const MONTSERRAT_FONT_SOURCES: readonly MontserratFontSource[] = [
  {
    url: new URL(
      "../../../../../assets/montserrat/Montserrat-Regular.ttf",
      import.meta.url
    ),
    weight: 400,
  },
  {
    url: new URL(
      "../../../../../assets/montserrat/Montserrat-Medium.ttf",
      import.meta.url
    ),
    weight: 500,
  },
  {
    url: new URL(
      "../../../../../assets/montserrat/Montserrat-SemiBold.ttf",
      import.meta.url
    ),
    weight: 600,
  },
  {
    url: new URL(
      "../../../../../assets/montserrat/Montserrat-Bold.ttf",
      import.meta.url
    ),
    weight: 700,
  },
] as const;

let montserratFontsPromise: Promise<MontserratFontDefinition[]> | undefined;

const fetchFontData = async (url: URL): Promise<ArrayBuffer> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FONT_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Font request failed: ${response.status}`);
    }
    return response.arrayBuffer();
  } finally {
    clearTimeout(timeout);
  }
};

const fetchMontserratFonts = (): Promise<MontserratFontDefinition[]> =>
  Promise.all(
    MONTSERRAT_FONT_SOURCES.map(async ({ url, weight }) => ({
      name: "Montserrat" as const,
      data: await fetchFontData(url),
      weight,
      style: "normal" as const,
    }))
  );

export const loadMontserratFonts = () => {
  montserratFontsPromise ??= fetchMontserratFonts().catch((error: unknown) => {
    montserratFontsPromise = undefined;
    console.error("Unable to load Montserrat OG fonts.", error);
    return [];
  });

  return montserratFontsPromise;
};
