const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  GLOSSARY_TAG,
  MIN_GLOSSARY_TERMS,
  REQUIRED_LLMS_PATHS,
  repoRoot,
  buildGlossaryArtifact,
  isGlossaryRecord,
  renderLlmsTemplate,
  syncAgentFiles,
} = require("../../scripts/sync-agent-files.cjs");
const {
  AGENT_DISCOVERY_ROBOTS_BLOCK,
  appendAgentDiscoveryBlock,
} = require("../../next-sitemap.config");

type GlossaryTerm = {
  id: string;
  term: string;
  canonical_path?: string;
  related_paths?: string[];
};

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: "network.example",
    kind: "route",
    title: "Example",
    aliases: ["example"],
    keywords: ["example"],
    facts: ["Example fact."],
    canonical_path: "/network",
    ...overrides,
  };
}

function helpIndex(records: unknown[]) {
  return {
    schema_version: 1,
    generated_at: "2026-06-29T09:23:18.000Z",
    commit_sha: "0123456789ab",
    base_url: "https://6529.io",
    records,
  };
}

function glossaryRecords(count: number) {
  return Array.from({ length: count }, (_value, index) =>
    record({
      id: `glossary.term-${index}`,
      kind: "glossary",
      title: `Term ${String(index).padStart(2, "0")}`,
    })
  );
}

describe("sync-agent-files", () => {
  describe("isGlossaryRecord", () => {
    it("selects records by glossary kind or glossary tag", () => {
      expect(isGlossaryRecord(record({ kind: "glossary" }))).toBe(true);
      expect(isGlossaryRecord(record({ tags: [GLOSSARY_TAG, "waves"] }))).toBe(
        true
      );
      expect(isGlossaryRecord(record({ tags: ["waves"] }))).toBe(false);
      expect(isGlossaryRecord(record())).toBe(false);
    });
  });

  describe("buildGlossaryArtifact", () => {
    it("projects glossary records sorted by term and keeps counts honest", () => {
      const records = [
        ...glossaryRecords(MIN_GLOSSARY_TERMS - 1),
        record({
          id: "waves.overview",
          title: "Waves",
          tags: ["waves", GLOSSARY_TAG],
          related_paths: ["/waves/create"],
        }),
        record({ id: "not-a-term", title: "AAA route without glossary tag" }),
      ];
      const artifact = buildGlossaryArtifact(helpIndex(records));

      expect(artifact.term_count).toBe(MIN_GLOSSARY_TERMS);
      expect(artifact.terms).toHaveLength(MIN_GLOSSARY_TERMS);
      expect(artifact.terms.map((term: GlossaryTerm) => term.id)).not.toContain(
        "not-a-term"
      );
      const titles = artifact.terms.map((term: GlossaryTerm) => term.term);
      expect([...titles].sort((a, b) => a.localeCompare(b, "en"))).toEqual(
        titles
      );
      const waves = artifact.terms.find(
        (term: GlossaryTerm) => term.id === "waves.overview"
      );
      expect(waves).toMatchObject({
        term: "Waves",
        canonical_path: "/network",
        related_paths: ["/waves/create"],
      });
      expect(artifact.generated_at).toBe("2026-06-29T09:23:18.000Z");
      expect(artifact.source).toBe("/help-index.json");
    });

    it("fails when the glossary selection collapses below the floor", () => {
      expect(() =>
        buildGlossaryArtifact(helpIndex(glossaryRecords(2)))
      ).toThrow(`at least ${MIN_GLOSSARY_TERMS}`);
    });
  });

  describe("renderLlmsTemplate", () => {
    const validTemplate = [
      "# Site",
      "Revision {{GENERATED_AT}} with {{HELP_RECORD_COUNT}} records and {{GLOSSARY_TERM_COUNT}} terms.",
      ...REQUIRED_LLMS_PATHS.map((requiredPath: string) => `- ${requiredPath}`),
    ].join("\n");
    const replacements = {
      BASE_URL: "https://6529.io",
      GENERATED_AT: "2026-06-29T09:23:18.000Z",
      HELP_RECORD_COUNT: 188,
      GLOSSARY_TERM_COUNT: 30,
    };

    it("replaces tokens and terminates with a newline", () => {
      const rendered = renderLlmsTemplate(validTemplate, replacements);
      expect(rendered).toContain("188 records and 30 terms");
      expect(rendered).not.toContain("{{");
      expect(rendered.endsWith("\n")).toBe(true);
    });

    it("fails on tokens the generator does not know", () => {
      expect(() =>
        renderLlmsTemplate(`${validTemplate}\n{{MYSTERY_TOKEN}}`, replacements)
      ).toThrow("unknown tokens: MYSTERY_TOKEN");
    });

    it("fails when a required artifact path is dropped from the template", () => {
      const withoutGlossary = validTemplate.replace("- /glossary.json", "");
      expect(() => renderLlmsTemplate(withoutGlossary, replacements)).toThrow(
        "required path: /glossary.json"
      );
    });
  });

  describe("syncAgentFiles", () => {
    let outputDir: string;

    beforeAll(() => {
      outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-files-"));
    });

    afterAll(() => {
      fs.rmSync(outputDir, { recursive: true, force: true });
    });

    it("generates a valid glossary.json and llms.txt from the real corpus", () => {
      const result = syncAgentFiles({ outputDir });

      const glossary = JSON.parse(
        fs.readFileSync(result.glossaryOutputPath, "utf8")
      );
      expect(glossary.schema_version).toBe(1);
      expect(glossary.term_count).toBe(glossary.terms.length);
      expect(glossary.term_count).toBeGreaterThanOrEqual(MIN_GLOSSARY_TERMS);
      const ids = glossary.terms.map((term: GlossaryTerm) => term.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toEqual(
        expect.arrayContaining(["network.tdh", "waves.drop"])
      );

      const llms = fs.readFileSync(result.llmsOutputPath, "utf8");
      expect(llms.startsWith("# 6529.io")).toBe(true);
      expect(llms).not.toContain("{{");
      for (const requiredPath of REQUIRED_LLMS_PATHS) {
        expect(llms).toContain(requiredPath);
      }
      expect(llms).toContain(`${glossary.term_count} term`);
    });

    it("matches the committed public artifacts (run `6529 run agent-files:sync` after editing the corpus)", () => {
      const result = syncAgentFiles({ outputDir });
      const committedGlossary = fs.readFileSync(
        path.join(repoRoot, "public/glossary.json"),
        "utf8"
      );
      const committedLlms = fs.readFileSync(
        path.join(repoRoot, "public/llms.txt"),
        "utf8"
      );
      expect(fs.readFileSync(result.glossaryOutputPath, "utf8")).toBe(
        committedGlossary
      );
      expect(fs.readFileSync(result.llmsOutputPath, "utf8")).toBe(
        committedLlms
      );
    });
  });

  describe("robots.txt agent discovery block", () => {
    it("appends the block after the generated directives", () => {
      const generated =
        "# *\nUser-agent: *\nAllow: /\n\n# Sitemaps\nSitemap: https://6529.io/sitemap.xml\n";
      const transformed = appendAgentDiscoveryBlock(generated);
      expect(transformed).toBe(
        `${generated}\n${AGENT_DISCOVERY_ROBOTS_BLOCK}\n`
      );
      expect(transformed).toContain("https://6529.io/llms.txt");
    });

    it("matches the committed public/robots.txt", () => {
      const committed = fs.readFileSync(
        path.join(repoRoot, "public/robots.txt"),
        "utf8"
      );
      expect(committed.endsWith(`\n${AGENT_DISCOVERY_ROBOTS_BLOCK}\n`)).toBe(
        true
      );
    });
  });
});

export {};
