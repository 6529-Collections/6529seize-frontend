const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const helpIndexSourcePath = path.join(
  repoRoot,
  "ops",
  "help",
  "help-index.json"
);
const llmsTemplatePath = path.join(
  repoRoot,
  "ops",
  "help",
  "llms.txt.template"
);
const defaultOutputDir = path.join(repoRoot, "public");

// Terms below this floor mean the glossary selection broke, not that the
// corpus shrank on purpose.
const MIN_GLOSSARY_TERMS = 15;
const GLOSSARY_TAG = "glossary";
// llms.txt must keep pointing agents at the published artifacts; a template
// edit that drops one of these paths is a regression, not a copy change.
const REQUIRED_LLMS_PATHS = [
  "/llms.txt",
  "/glossary.json",
  "/help-index.json",
  "/sitemap.xml",
];
const TEMPLATE_TOKEN_PATTERN = /\{\{([A-Z0-9_]+)\}\}/g;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

function isGlossaryRecord(record) {
  return (
    record.kind === "glossary" || (record.tags || []).includes(GLOSSARY_TAG)
  );
}

function buildGlossaryArtifact(helpIndex) {
  const terms = helpIndex.records
    .filter(isGlossaryRecord)
    .map((record) => {
      const term = {
        id: record.id,
        term: record.title,
        aliases: record.aliases,
        facts: record.facts,
        canonical_path: record.canonical_path,
      };
      if (record.related_paths) {
        term.related_paths = record.related_paths;
      }
      if (record.tags) {
        term.tags = record.tags;
      }
      return term;
    })
    .sort((a, b) => a.term.localeCompare(b.term, "en"));

  if (terms.length < MIN_GLOSSARY_TERMS) {
    throw new Error(
      `Expected at least ${MIN_GLOSSARY_TERMS} glossary terms, found ${terms.length}`
    );
  }

  return {
    schema_version: 1,
    generated_at: helpIndex.generated_at,
    base_url: helpIndex.base_url,
    description:
      "Glossary of 6529 terms projected from the site's curated help corpus. Each term links back to its help-index.json record via id.",
    source: "/help-index.json",
    term_count: terms.length,
    terms,
  };
}

function renderLlmsTemplate(template, replacements) {
  const unknownTokens = new Set();
  const rendered = template.replace(TEMPLATE_TOKEN_PATTERN, (match, token) => {
    if (Object.hasOwn(replacements, token)) {
      return String(replacements[token]);
    }
    unknownTokens.add(token);
    return match;
  });
  if (unknownTokens.size > 0) {
    throw new Error(
      `llms.txt template uses unknown tokens: ${[...unknownTokens].join(", ")}`
    );
  }
  for (const requiredPath of REQUIRED_LLMS_PATHS) {
    if (!rendered.includes(requiredPath)) {
      throw new Error(
        `llms.txt template no longer references required path: ${requiredPath}`
      );
    }
  }
  return rendered.endsWith("\n") ? rendered : `${rendered}\n`;
}

function syncAgentFiles({ outputDir = defaultOutputDir } = {}) {
  const helpIndex = readJson(helpIndexSourcePath);
  const template = fs.readFileSync(llmsTemplatePath, "utf8");

  const glossary = buildGlossaryArtifact(helpIndex);
  const llmsTxt = renderLlmsTemplate(template, {
    BASE_URL: helpIndex.base_url,
    GENERATED_AT: helpIndex.generated_at,
    HELP_RECORD_COUNT: helpIndex.records.length,
    GLOSSARY_TERM_COUNT: glossary.term_count,
  });

  fs.mkdirSync(outputDir, { recursive: true });
  const glossaryOutputPath = path.join(outputDir, "glossary.json");
  const llmsOutputPath = path.join(outputDir, "llms.txt");
  fs.writeFileSync(
    glossaryOutputPath,
    `${JSON.stringify(glossary, null, 2)}\n`
  );
  fs.writeFileSync(llmsOutputPath, llmsTxt);

  return {
    glossaryOutputPath,
    llmsOutputPath,
    termCount: glossary.term_count,
    recordCount: helpIndex.records.length,
  };
}

function parseOutputDir(argv) {
  const flagIndex = argv.indexOf("--out-dir");
  if (flagIndex === -1) {
    return defaultOutputDir;
  }
  const value = argv[flagIndex + 1];
  if (!value) {
    fail("--out-dir requires a directory path");
  }
  return path.resolve(value);
}

if (require.main === module) {
  try {
    const result = syncAgentFiles({
      outputDir: parseOutputDir(process.argv.slice(2)),
    });
    console.log(
      `Synced ${result.termCount} glossary terms and llms.txt (${result.recordCount} help records) to ${path.relative(repoRoot, result.glossaryOutputPath) || "."}`
    );
  } catch (error) {
    fail(error.message);
  }
}

module.exports = {
  GLOSSARY_TAG,
  MIN_GLOSSARY_TERMS,
  REQUIRED_LLMS_PATHS,
  repoRoot,
  buildGlossaryArtifact,
  isGlossaryRecord,
  renderLlmsTemplate,
  syncAgentFiles,
};
