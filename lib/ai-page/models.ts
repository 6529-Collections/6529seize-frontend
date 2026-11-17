import modelsFile from "./content/models/models.json";
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

type AiModelSection = {
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
 * which this release leaves out of its pages, and without "No speed
 * recorded.", which the card says already.
 */
export function getMeasuredNote(measured: AiModelMeasured): string | null {
  const sentences = (measured.note ?? "")
    .split(/(?<=\.)\s+/)
    .filter(
      (sentence) =>
        sentence !== "" &&
        !/\bnetwork\b/i.test(sentence) &&
        !/^no speed recorded\.$/i.test(sentence)
    );
  return sentences.length === 0 ? null : sentences.join(" ");
}
