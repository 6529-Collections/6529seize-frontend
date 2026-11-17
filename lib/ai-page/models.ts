import modelsFile from "./content/models/models.json";
import publishedFile from "./content/models/published.json";
import sectionsFile from "./content/models/sections.json";

/**
 * The models in the 6529 AI registry, for /ai/models. The two JSON files
 * are written by build_models_page.py and replaced as a whole when the
 * registry changes: the page reads its format, `6529.io.ai-models.v1` and
 * `6529.io.ai-model-sections.v1`, and nothing else.
 */

type Nullable<T> = T | null;

export type AiModelVariant = {
  readonly entry: string;
  readonly format: string;
  readonly quantization: Nullable<string>;
  readonly engine: string;
  readonly sizeGB: number;
  readonly memoryGB: number;
  readonly withinCpuLimit: boolean;
  readonly runsToday: boolean;
  readonly todayCan: Nullable<string>;
  readonly whyNot: Nullable<string>;
  readonly part?: string | undefined;
};

export type AiModelBenchmark = {
  readonly name: string;
  /** Exactly as the card prints it. */
  readonly score: string;
  readonly unit: Nullable<string>;
  readonly lowerIsBetter: boolean;
  readonly source: string;
  readonly note: Nullable<string>;
};

export type AiModelMeasured = {
  readonly date: string;
  readonly machine: string;
  readonly engine: string;
  readonly note: Nullable<string>;
  readonly tokensPerSecond?: number | undefined;
  readonly tokensPerSecondMin?: number | undefined;
  readonly tokensPerSecondMax?: number | undefined;
  readonly result?: string | undefined;
};

export type AiModelLicense = {
  readonly name: string;
  readonly class: "permissive" | "conditional";
  readonly summary: string;
  readonly url: Nullable<string>;
  readonly territoriesExcluded?: readonly string[] | undefined;
};

export type AiModel = {
  readonly id: string;
  readonly name: string;
  readonly publisher: string;
  readonly packagedBy: Nullable<string>;
  readonly section: string;
  readonly summary: string;
  readonly parameters: Nullable<{ readonly text: string }>;
  readonly contextLength: Nullable<{ readonly text: string }>;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly license: AiModelLicense;
  readonly source: {
    readonly repo: string;
    readonly revision: string;
    readonly url: string;
  };
  readonly refusalsRemoved: Nullable<{
    readonly madeFrom: string;
    readonly note: string;
  }>;
  readonly runsToday: boolean;
  readonly today: {
    readonly can: readonly string[];
    readonly memoryGB: Nullable<number>;
    readonly whyNot: Nullable<string>;
    readonly note: Nullable<string>;
  };
  readonly variants: readonly AiModelVariant[];
  readonly benchmarks: readonly AiModelBenchmark[];
  readonly measured: readonly AiModelMeasured[];
};

export type AiModelSection = {
  readonly id: string;
  readonly title: string;
  readonly line: string;
  readonly models: readonly AiModel[];
  readonly runnable: number;
};

type ModelsFile = {
  readonly schema: string;
  readonly registry: {
    readonly entries: number;
    readonly models: number;
    readonly entriesRunnableToday: number;
    readonly modelsRunnableToday: number;
  };
  readonly models: readonly AiModel[];
};

type SectionsFile = {
  readonly schema: string;
  readonly sections: readonly {
    readonly id: string;
    readonly title: string;
    readonly line: string;
  }[];
};

const MODELS = modelsFile as unknown as ModelsFile;
const SECTIONS = sectionsFile as unknown as SectionsFile;
// When each model's repository was made on Hugging Face, for "Newest":
// written by scripts/ai-models-published.cjs from the same models.json.
const PUBLISHED = (
  publishedFile as unknown as {
    readonly models: Readonly<Record<string, { readonly date: string }>>;
  }
).models;

/** The registry's counts, as the build wrote them. */
export function getAiModelCounts() {
  return MODELS.registry;
}

/** Every section in page order, each with its models in the file's order. */
export function getAiModelSections(): readonly AiModelSection[] {
  return SECTIONS.sections.map((section) => {
    const models = MODELS.models.filter(
      (model) => model.section === section.id
    );
    return {
      id: section.id,
      title: section.title,
      line: section.line,
      models,
      runnable: models.filter((model) => model.runsToday).length,
    };
  });
}

/** What a model reads or makes, as the page's filter names it. */
export type AiMedium = "text" | "image" | "audio";

const MEDIUM: Readonly<Record<string, AiMedium>> = {
  text: "text",
  image: "image",
  audio: "audio",
  speech: "audio",
};

function media(values: readonly string[]): AiMedium[] {
  const found = new Set<AiMedium>();
  for (const value of values) {
    const medium = MEDIUM[value];
    if (medium) {
      found.add(medium);
    }
  }
  return [...found];
}

/** What the page's filter knows about a model; small, for the browser. */
export type AiModelFacets = {
  /** Its name, publisher, packager and id, in lower case, for the search. */
  readonly search: string;
  /** The day its repository was made on Hugging Face, YYYY-MM-DD, or "". */
  readonly published: string;
  readonly runs: boolean;
  readonly reads: readonly AiMedium[];
  readonly makes: readonly AiMedium[];
  /** The app's memory estimate for the smallest variant, in GB. */
  readonly memoryGB: number;
  /** The same for the smallest variant the app runs, or null. */
  readonly runnableMemoryGB: number | null;
};

function smallest(values: readonly number[]): number | null {
  return values.length === 0 ? null : Math.min(...values);
}

export function getAiModelFacets(model: AiModel): AiModelFacets {
  return {
    search: [model.name, model.publisher, model.packagedBy ?? "", model.id]
      .join(" ")
      .toLowerCase(),
    published: PUBLISHED[model.id]?.date ?? "",
    runs: model.runsToday,
    reads: media(model.inputs),
    makes: media(model.outputs),
    memoryGB: smallest(model.variants.map((variant) => variant.memoryGB)) ?? 0,
    runnableMemoryGB: smallest(
      model.variants
        .filter((variant) => variant.runsToday)
        .map((variant) => variant.memoryGB)
    ),
  };
}

/**
 * The scores the original model's publisher reports, rather than this
 * model's own: the build's note says so for each one.
 */
export function isOriginalModelScore(benchmark: AiModelBenchmark): boolean {
  return /\boriginal\b/i.test(benchmark.note ?? "");
}

/** The first sentence of a model's description, for its card's one line. */
export function getAiModelLine(model: AiModel): string {
  const end = model.summary.search(/\.\s/);
  return end === -1 ? model.summary : model.summary.slice(0, end + 1);
}

/**
 * A measured run's note without the sentences about the 6529 AI network,
 * which this release leaves out of its pages, about the demo catalog the
 * run came from, and "No speed recorded.".
 */
export function getMeasuredNote(measured: AiModelMeasured): string | null {
  const sentences = (measured.note ?? "")
    .split(/(?<=\.)\s+/)
    .filter(
      (sentence) =>
        sentence !== "" &&
        !/\bnetwork\b/i.test(sentence) &&
        !sentence.startsWith("From the demo catalog's entry") &&
        !/^no speed recorded\.$/i.test(sentence)
    );
  return sentences.length === 0 ? null : sentences.join(" ");
}

/**
 * The hardware of a measured run, without the cloud instance's name:
 * "AWS p5en.48xlarge, spot, 8 H200 GPUs of 141 GB" reads "8 × H200, 141 GB
 * each".
 */
export function getMeasuredHardware(measured: AiModelMeasured): string {
  const text = measured.machine
    .replace(/^AWS [^,]+,\s*/, "")
    .replace(/^spot,\s*/, "")
    .replace(/^Apple M2 with 24 GB, on its GPU with Metal$/, "Apple M2, 24 GB")
    .replace(/^on one of its eight (\w+) GPUs of (\d+) GB/, "one $1, $2 GB")
    .replace(/^on one (\w+) of (\d+) GB/, "one $1, $2 GB")
    .replace(/^one (\w+) GPU of (\d+) GB/, "one $1, $2 GB")
    .replace(/^(\d+) (\w+) GPUs of (\d+) GB/, "$1 × $2, $3 GB each")
    .replace(/^([\w ]+) with (\d+) vCPUs/, "$1, $2 vCPUs")
    .replace(
      ", with its expert weights in system memory",
      ", experts in system memory"
    );
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Scores that are a share of a whole, printed as 0 to 1 by their cards:
// accuracies and win rates. Any other score without a unit is shown as
// its card prints it, rounded, since its scale isn't the page's to guess.
const SHARE_OF_ONE =
  /^(?:Arena Hard|MATH Maj@1|GenEval|AA LCR|CTI-MCQA|CTI-RCM|CTI-Reasoning)$|\(accuracy\)|^MMLU/;
// Scores out of a fixed maximum.
const OUT_OF: readonly (readonly [RegExp, number])[] = [
  [/MT-?Bench/i, 10],
  [/^OCRBench$/, 1000],
];

/** How a score reads on the page. */
export type AiScore =
  | { readonly kind: "percent"; readonly value: number }
  | { readonly kind: "outOf"; readonly value: number; readonly max: number }
  | { readonly kind: "number"; readonly value: number; readonly digits: number }
  | { readonly kind: "text"; readonly text: string };

/**
 * A score in one scale: percentages, and shares of one that are
 * accuracies or win rates, as a percent; scores out of a fixed maximum
 * with it ("8.49 /10"); anything else as its card prints it. asPercent
 * turns any value from 0 to 1 into a percent, for a column in which other
 * cards give the same benchmark in percent.
 */
export function getAiScore(
  benchmark: AiModelBenchmark,
  asPercent = false
): AiScore {
  const value = Number(benchmark.score);
  if (!Number.isFinite(value)) {
    return { kind: "text", text: benchmark.score };
  }
  if (benchmark.unit === "%") {
    return { kind: "percent", value };
  }
  const outOf = OUT_OF.find(([name]) => name.test(benchmark.name));
  if (outOf) {
    return { kind: "outOf", value, max: outOf[1] };
  }
  if (
    value >= 0 &&
    value <= 1 &&
    (asPercent || SHARE_OF_ONE.test(benchmark.name))
  ) {
    return { kind: "percent", value: value * 100 };
  }
  return { kind: "number", value, digits: Math.abs(value) < 1 ? 3 : 1 };
}

/**
 * The benchmark most of a section's models report, for its column in the
 * table, with each model's score; null when fewer than half of them report
 * any one benchmark.
 */
export function getSectionScore(section: AiModelSection): {
  readonly name: string;
  readonly lowerIsBetter: boolean;
  readonly scores: Readonly<Record<string, AiScore>>;
} | null {
  const counts = new Map<string, number>();
  for (const model of section.models) {
    for (const name of new Set(model.benchmarks.map((b) => b.name))) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (!best || best[1] * 2 < section.models.length) {
    return null;
  }
  const [name] = best;
  const found = section.models.flatMap((model) =>
    model.benchmarks
      .filter((b) => b.name === name)
      .slice(0, 1)
      .map((b) => [model.id, b] as const)
  );
  const anyPercent = found.some(([, b]) => b.unit === "%");
  return {
    name,
    lowerIsBetter: found.some(([, b]) => b.lowerIsBetter),
    scores: Object.fromEntries(
      found.map(([id, b]) => [id, getAiScore(b, anyPercent)])
    ),
  };
}
