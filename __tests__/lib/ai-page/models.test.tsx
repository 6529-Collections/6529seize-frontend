/** @jest-environment node */
import { renderToStaticMarkup } from "react-dom/server";

import AiModelsPage from "@/components/ai-page/models/AiModelsPage";
import modelsFile from "@/lib/ai-page/content/models/models.json";
import sectionsFile from "@/lib/ai-page/content/models/sections.json";
import { formatAiScore } from "@/components/ai-page/models/formatAiScore";
import {
  getAiModelCounts,
  getAiScore,
  getMeasuredHardware,
  getAiModelFacets,
  getAiModelLine,
  getAiModelSections,
  getMeasuredNote,
  isOriginalModelScore,
  type AiModel,
} from "@/lib/ai-page/models";

const models = getAiModelSections().flatMap((section) => section.models);

function model(id: string): AiModel {
  const found = models.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`no model ${id}`);
  }
  return found;
}

describe("the models data", () => {
  it("names the hardware of a measured run, not the cloud instance", () => {
    expect(
      getMeasuredHardware({
        date: "2026-11-14",
        machine:
          "AWS p5.48xlarge, on one H100 of 80 GB, with its expert weights in system memory",
        engine: "llama.cpp",
        note: null,
      })
    ).toBe("One H100, 80 GB, experts in system memory");
  });

  it("is in the format the page reads", () => {
    expect(modelsFile.schema).toBe("6529.io.ai-models.v1");
    expect(sectionsFile.schema).toBe("6529.io.ai-model-sections.v1");
  });

  it("puts every model in one of the sections, and counts as the build did", () => {
    const counts = getAiModelCounts();
    const sections = getAiModelSections();
    expect(sections).toHaveLength(19);
    expect(models).toHaveLength(counts.models);
    expect(models.flatMap((entry) => entry.variants)).toHaveLength(
      counts.entries
    );
    expect(
      models.flatMap((entry) => entry.variants).filter((v) => v.runsToday)
    ).toHaveLength(counts.entriesRunnableToday);
    expect(models.filter((entry) => entry.runsToday)).toHaveLength(
      counts.modelsRunnableToday
    );
    expect(new Set(models.map((entry) => entry.id)).size).toBe(models.length);
  });

  it("gives the filter what a model reads and makes, and its memory", () => {
    expect(getAiModelFacets(model("gemma-4-26b-a4b"))).toEqual({
      search: "gemma 4 26b a4b google  gemma-4-26b-a4b",
      published: "2026-03-11",
      runs: true,
      reads: ["text", "image"],
      makes: ["text"],
      memoryGB: 18.4,
      runnableMemoryGB: 18.4,
    });
    expect(getAiModelFacets(model("qwen3-4b-mlx-4bit"))).toMatchObject({
      runs: false,
      runnableMemoryGB: null,
    });
    expect(getAiModelFacets(model("whisper-large-v3-turbo")).reads).toEqual([
      "audio",
    ]);
  });

  it("marks the scores that are the original model's", () => {
    const [score] = model("gemma-4-26b-a4b").benchmarks;
    expect(isOriginalModelScore(score!)).toBe(true);
    expect(
      isOriginalModelScore({ ...score!, note: "OpenDataLab's score." })
    ).toBe(false);
  });

  it("leaves the network and repeated words out of a measured run's note", () => {
    const [run] = model("gpt-oss-120b").measured;
    expect(run?.note).toMatch(/network/);
    expect(getMeasuredNote(run!)).toBe(
      "256 tokens at temperature 0 after a warm-up."
    );
    const [smoke] = model("qwen3-0.6b").measured;
    expect(getMeasuredNote(smoke!)).toBe("Ran a test chat.");
  });

  it("describes each model in one sentence", () => {
    expect(getAiModelLine(model("gemma-4-26b-a4b"))).toBe(
      "A mixture-of-experts Gemma 4 model from Google with 25.2 billion parameters, 3.8 billion of them active for each token."
    );
  });
});

describe("scores", () => {
  const score = (name: string, value: string, unit: string | null = null) =>
    formatAiScore(
      "en-US",
      getAiScore({
        name,
        score: value,
        unit,
        lowerIsBetter: false,
        source: "",
        note: null,
      })
    );

  it("prints one scale, rounded, and guesses no other", () => {
    expect(score("IFEval", "5.008769117619326", "%")).toBe("5.0%");
    expect(score("Arena Hard", "0.551")).toBe("55.1%");
    expect(score("MM MTBench", "8.49")).toBe("8.49 /10");
    expect(score("OCRBench", "880")).toBe("880 /1,000");
    // A share of one whose scale its card leaves open stays as printed.
    expect(score("Seed-TTS test-en speaker similarity", "0.633")).toBe("0.633");
    expect(score("BEIR", "55.33")).toBe("55.3");
  });
});

describe("/ai/models", () => {
  const html = renderToStaticMarkup(<AiModelsPage version="0.1.0-rc.1" />);
  const card = (id: string) => {
    const start = html.indexOf(`id="model-${id}"`);
    return html.slice(start, html.indexOf("</article>", start));
  };

  it("leads with the count the app runs, under the release", () => {
    expect(html).toContain(
      "227 open-weights models. 139 run in the app today."
    );
    expect(html).toContain(">0.1.0-rc.1</span>");
  });

  it("shows every model as a card, by section", () => {
    expect(html.match(/<article/g)).toHaveLength(models.length);
    for (const section of getAiModelSections()) {
      expect(html).toContain(`id="${section.id}"`);
    }
    expect(html).toContain("227 of 227 models");
  });

  it("credits the publisher, linked to the files at the pinned revision", () => {
    expect(card("qwen3.8-27b-uncensored-cyber")).toContain(
      'href="https://huggingface.co/philbert440/Qwen3.8-27B-Uncensored-Cyber-GGUF/tree/b2dc3ee9a0216898684d8d0607009626662724d4"'
    );
    expect(card("qwen3.8-27b-uncensored-cyber")).toContain("philbert440");
  });

  it("says plainly when refusals were removed", () => {
    expect(
      card("qwen3.8-27b-uncensored-cyber").match(/refusals were removed/g)
    ).toHaveLength(1);
    expect(card("gemma-4-26b-a4b")).not.toContain("refusals");
  });

  it("shows no scores for gpt-oss, and each score linked for the others", () => {
    expect(card("gpt-oss-120b")).not.toContain(">Scores");
    expect(card("gemma-4-26b-a4b")).toContain(">Scores");
    expect(card("gemma-4-26b-a4b")).toContain(
      'href="https://huggingface.co/google/gemma-4-26B-A4B-it/blob/4d7ae4984b7db7de8f8457170b3f1a419ee76d52/README.md"'
    );
    expect(card("gemma-4-26b-a4b")).toContain("†");
    expect(card("gemma-4-26b-a4b")).toContain(
      "(the original model&#x27;s score)"
    );
    expect(html).not.toMatch(/\d\.\d{4,}%/);
  });

  it("labels 6529's own runs, with the hardware", () => {
    expect(card("qwen3-4b-gguf")).toContain("Measured by 6529 AI");
    expect(card("qwen3-4b-gguf")).toContain("56.2 tokens a second");
    expect(card("qwen3-4b-gguf")).toContain("Intel Xeon, 96 vCPUs, no GPU");
    expect(card("qwen3-4b-gguf")).not.toContain("no speed recorded");
    expect(card("deepseek-v4.1-flash-q6k-engram")).toContain(
      "8 × H200, 141 GB each"
    );
    expect(html).not.toContain("demo catalog");
    expect(html).not.toContain("c7i.metal");
  });

  it("says why the app doesn't run a model yet", () => {
    expect(card("qwen3-4b-mlx-4bit")).toContain("Not in the app yet");
    expect(card("qwen3-4b-mlx-4bit")).toContain(
      "Its engine, MLX, is not built"
    );
  });

  it("folds the versions and scores behind a button on a phone", () => {
    expect(card("gemma-4-26b-a4b")).toMatch(
      /aria-expanded="false"[^>]*>Versions and scores/
    );
    expect(card("gemma-4-26b-a4b")).toContain("max-sm:tw-hidden");
  });
});
