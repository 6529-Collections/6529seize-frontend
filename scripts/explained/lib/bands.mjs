/**
 * SCORECARD.md §2 and §3 as data: each genre's bands and the machine checks
 * every page must pass. A failure caps that axis at 8.
 */

/** Genre bands (SCORECARD.md §2). firstScreen: [min, max] words; phone max. */
const GENRES = {
  H: {
    firstScreen: [0, 120],
    firstScreenPhone: 100,
    wordsPerScreen: [30, 150],
    figuresPer1000: 0,
    body: "18/29",
  },
  E: {
    firstScreen: [0, 120],
    firstScreenPhone: 100,
    wordsPerScreen: [130, 160],
    figuresPer1000: 6,
    body: "18/29",
  },
  "E-guide": {
    firstScreen: [0, 130],
    firstScreenPhone: 100,
    wordsPerScreen: [130, 180],
    figuresPer1000: 3,
    body: "18/29",
  },
  status: {
    firstScreen: [0, 160],
    firstScreenPhone: 160,
    wordsPerScreen: [120, 160],
    figuresPer1000: 0,
    body: "18/29",
  },
  C: {
    firstScreen: [0, 140],
    firstScreenPhone: 140,
    wordsPerScreen: [30, 140],
    figuresPer1000: 0,
    body: "18/29",
  },
  V: {
    firstScreen: [150, 285],
    firstScreenPhone: 285,
    wordsPerScreen: [150, 300],
    figuresPer1000: 0,
    body: "min15",
  },
  R: {
    firstScreen: [90, 285],
    firstScreenPhone: 285,
    wordsPerScreen: [110, 230],
    figuresPer1000: 0,
    body: "18/29",
  },
  kit: null,
};

/** The machine checks of SCORECARD.md §3 that hold on every page. */
const MACHINE = {
  overflowPx: 0,
  minHtmlText: 12,
  minSvgText: 12,
  maxTones: 4,
  paragraphGap: [0.6, 1.3],
  lineHeightRatio: [1.45, 1.7],
  ledeWords: 45,
  longSentenceShare: 0.1,
  phoneGutter: 20,
  desktopGutterMin: 48,
};

function band(value, [min, max]) {
  return value >= min && value <= max;
}

/**
 * Each failed check as { axis, check, detail }. `view` is "1440" or "390";
 * `budget` is the page's own row in pages.json, which can narrow a band.
 */
export function evaluate(genreName, budget, view, m) {
  const fails = [];
  const fail = (axis, check, detail) => fails.push({ axis, check, detail });
  const phone = view === "390";

  if (m.overflowPx > MACHINE.overflowPx)
    fail(
      "polish",
      "overflow",
      `${m.overflowPx} px past ${view}: ${m.offenders.join("; ")}`
    );
  if (m.clipped.length)
    fail("polish", "text cut by its box", m.clipped.join("; "));
  if (m.escapes?.length)
    fail("polish", "text escapes its frame", m.escapes.slice(0, 5).join("; "));
  if (m.minHtmlText < MACHINE.minHtmlText)
    fail(
      "polish",
      "text under 12 px",
      `${m.minHtmlText} px: ${m.minHtmlWhere}`
    );
  if (m.minSvgText < MACHINE.minSvgText)
    fail("polish", "SVG text under 12 px", `${m.minSvgText} px`);
  if (m.collisions.length)
    fail(
      "polish",
      "SVG labels collide or are cut",
      m.collisions.slice(0, 5).join("; ")
    );
  if (m.consoleErrors.length)
    fail("polish", "console errors", m.consoleErrors.slice(0, 3).join(" | "));
  if (m.tones > MACHINE.maxTones)
    fail("polish", "text tones", `${m.tones} tones carry 2% or more`);
  if (m.paragraphGap !== null && !band(m.paragraphGap, MACHINE.paragraphGap))
    fail("polish", "paragraph gap", `${m.paragraphGap} lines`);
  if (m.gutter !== null) {
    if (phone && Math.abs(m.gutter - MACHINE.phoneGutter) > 1)
      fail("polish", "gutter", `${m.gutter} px at 390 (20 expected)`);
    if (!phone && m.gutter < MACHINE.desktopGutterMin - 1)
      fail("polish", "gutter", `${m.gutter} px at 1440 (48 or more expected)`);
  }

  const genre = GENRES[genreName];
  if (!genre) return fails;

  if (m.body) {
    const [size, line] = m.body.split("/").map(Number);
    if (genre.body === "18/29") {
      const want = phone ? [16, 26] : [18, 29];
      if (size !== want[0] || line !== want[1])
        fail("polish", "body size", `${m.body} (${want.join("/")} expected)`);
    } else if (size < 15) {
      fail("polish", "body size", `${m.body} (15 or more expected)`);
    }
    const ratio = line / size;
    if (!band(ratio, MACHINE.lineHeightRatio))
      fail("polish", "line height", `${ratio.toFixed(2)}`);
  }
  const first = budget?.firstScreen ?? genre.firstScreen[1];
  const firstMin = budget?.firstScreenMin ?? genre.firstScreen[0];
  const firstMax = phone ? Math.min(first, genre.firstScreenPhone) : first;
  if (
    m.firstScreenWords > firstMax ||
    (!phone && m.firstScreenWords < firstMin)
  ) {
    fail(
      "clarity",
      "first-screen words",
      `${m.firstScreenWords} (${phone ? `≤ ${firstMax}` : `${firstMin} to ${firstMax}`})`
    );
  }
  const wpsMax = budget?.wordsPerScreen ?? genre.wordsPerScreen[1];
  if (
    !phone &&
    (m.wordsPerScreen < genre.wordsPerScreen[0] || m.wordsPerScreen > wpsMax)
  ) {
    fail(
      "clarity",
      "words per screen",
      `${m.wordsPerScreen} (${genre.wordsPerScreen[0]} to ${wpsMax})`
    );
  }
  if (budget?.words && !phone && m.words > budget.words)
    fail("clarity", "words", `${m.words} (≤ ${budget.words})`);
  const figures = budget?.figuresPer1000 ?? genre.figuresPer1000;
  if (!phone && figures && m.figuresPer1000 < figures)
    fail(
      "clarity",
      "figures per 1,000 words",
      `${m.figuresPer1000} (≥ ${figures})`
    );
  if (
    m.ledeWords !== null &&
    (m.ledeWords > MACHINE.ledeWords || m.ledeSentences > 1)
  )
    fail(
      "clarity",
      "lede",
      `${m.ledeWords} words, ${m.ledeSentences} sentences`
    );
  if (
    m.sentences > 0 &&
    m.longSentences / m.sentences >= MACHINE.longSentenceShare
  )
    fail(
      "clarity",
      "sentences over 30 words",
      `${m.longSentences} of ${m.sentences}`
    );
  if (m.numbersOutsideFacts.length)
    fail(
      "trust",
      "numbers outside facts",
      m.numbersOutsideFacts.slice(0, 6).join("; ")
    );
  return fails;
}
