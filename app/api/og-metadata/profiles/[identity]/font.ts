type MontserratFontWeight = 400 | 500 | 600 | 700;

type MontserratFontSource = {
  readonly url: URL;
  readonly weight: MontserratFontWeight;
};

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

let montserratFontsPromise:
  | Promise<
      {
        readonly name: "Montserrat";
        readonly data: ArrayBuffer;
        readonly weight: MontserratFontWeight;
        readonly style: "normal";
      }[]
    >
  | undefined;

export const loadMontserratFonts = () => {
  montserratFontsPromise ??= Promise.all(
    MONTSERRAT_FONT_SOURCES.map(async ({ url, weight }) => ({
      name: "Montserrat" as const,
      data: await fetch(url).then((response) => response.arrayBuffer()),
      weight,
      style: "normal" as const,
    }))
  );

  return montserratFontsPromise;
};
