// Writes published.json: for each model, the day its repository was made
// on Hugging Face (the original model's, for a quantization, conversion or
// repackaging), for the models page's "Newest" order.
// node scripts/ai-models-published.cjs <models.json> <published.json>
// It sends Hugging Face only each model's public repository name.
const fs = require("fs");
const path = require("path");
const [, , modelsPath, outPath] = process.argv;
const { models } = require(path.resolve(modelsPath));
// "owner/name", as Hugging Face names a repository.
const REPO = /^[\w.-]+\/[\w.-]+$/;
const SAME_MODEL = new Set([
  "quantization",
  "GGUF conversion",
  "repackaged for ComfyUI",
]);
(async () => {
  const out = {};
  const queue = [...models];
  async function worker() {
    for (let model = queue.shift(); model; model = queue.shift()) {
      const repo =
        model.original && SAME_MODEL.has(model.original.relation)
          ? model.original.repo
          : model.source.repo;
      if (!REPO.test(repo)) {
        continue;
      }
      const url = new URL(
        `/api/models/${repo.split("/").map(encodeURIComponent).join("/")}`,
        "https://huggingface.co"
      );
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(url, {
            headers: { "user-agent": "6529-ai-models-page/1 (metadata only)" },
          });
          if (res.ok) {
            const json = await res.json();
            if (json.createdAt)
              out[model.id] = { repo, date: json.createdAt.slice(0, 10) };
            break;
          }
          if (res.status === 401 || res.status === 404) break;
          await new Promise((r) => setTimeout(r, 2000));
        } catch {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  const sorted = Object.fromEntries(
    models.filter((m) => out[m.id]).map((m) => [m.id, out[m.id]])
  );
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        schema: "6529.io.ai-model-published.v1",
        source:
          "Hugging Face's createdAt for each model's repository, or the original model's for a quantization, conversion or repackaging",
        fetched: new Date().toISOString().slice(0, 10),
        models: sorted,
      },
      null,
      1
    ) + "\n"
  );
  console.log(
    "dated",
    Object.keys(sorted).length,
    "of",
    models.length,
    "missing:",
    models
      .filter((m) => !out[m.id])
      .map((m) => m.id)
      .join(" ")
  );
})();
