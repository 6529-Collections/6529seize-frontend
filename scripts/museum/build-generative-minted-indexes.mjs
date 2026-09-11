import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectSlugs = [
  "century",
  "pre-process",
  "phototaxis",
  "923-empty-rooms",
  "ex-nihilo-cosmos",
];

const sourceRoot = process.argv[2];
const descriptorRoot = process.argv[3];
if (!sourceRoot || !descriptorRoot) {
  throw new Error(
    "usage: node scripts/museum/build-generative-minted-indexes.mjs <snapshot-root> <descriptor-root>"
  );
}

const outputRoot = path.resolve(
  "lib/museum/generative-studies/minted-indexes"
);
await mkdir(outputRoot, { recursive: true });

for (const projectSlug of projectSlugs) {
  const sourcePath = path.join(sourceRoot, projectSlug, "snapshot.json");
  const snapshot = JSON.parse(await readFile(sourcePath, "utf8"));
  const descriptorPath = path.join(descriptorRoot, `${projectSlug}.json`);
  const descriptor = JSON.parse(await readFile(descriptorPath, "utf8"));
  const traitsByToken = new Map();
  const profileByToken = new Map(
    descriptor.result.per_token.map((token) => [String(token.id), token])
  );

  for (const row of snapshot.traits) {
    const tokenId = String(row.token_id);
    const traits = traitsByToken.get(tokenId) ?? {};
    traits[row.trait] = row.value;
    traitsByToken.set(tokenId, traits);
  }

  const output = {
    schema: "museum.generative.minted-index.v2",
    projectSlug,
    snapshotId: snapshot.snapshot_id,
    observedAt: snapshot.observed_at,
    population: snapshot.population,
    descriptor: {
      algorithmId: descriptor.result.algorithm.id,
      resultSha256: descriptor.result_sha256,
      reviewRef: "descriptor-package-review-2026-08-02",
    },
    tokens: snapshot.tokens.map((token) => {
      const profile = profileByToken.get(String(token.id));
      if (!profile) throw new Error(`${projectSlug}: missing profile for ${token.id}`);
      return {
        invocation: token.invocation,
        tokenId: String(token.id),
        tokenHash: token.token_hash,
        mediaUrl: token.media_url,
        traits: traitsByToken.get(String(token.id)) ?? {},
        editionProfile: {
          statisticalRank: profile.statistical_score_trait_count_normalised_rank,
          total: snapshot.tokens.length,
        },
      };
    }),
  };

  const outputPath = path.join(outputRoot, `${projectSlug}.json`);
  await writeFile(outputPath, `${JSON.stringify(output)}\n`, "utf8");
  console.log(`${projectSlug}: ${output.tokens.length} tokens`);
}
