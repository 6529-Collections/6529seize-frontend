import fs from "node:fs";
import path from "node:path";
import {
  buildMigration,
  migrationReport,
  readMigrationSources,
  type MigrationTarget,
} from "./migration";
import { MigrationInputError } from "./typed-content";

export function parseMigrationArgs(args: readonly string[]) {
  const values = new Map<string, string>();
  let reportOnly = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--report-only" && !reportOnly) {
      reportOnly = true;
      continue;
    }
    if (
      !arg ||
      !["--target", "--out-dir", "--now"].includes(arg) ||
      values.has(arg)
    ) {
      throw new MigrationInputError("cli.invalid_arguments");
    }
    const value = args[++index];
    if (!value || value.startsWith("--"))
      throw new MigrationInputError("cli.missing_value");
    values.set(arg, value);
  }
  const target = values.get("--target");
  if (target !== "capital" && target !== "museum")
    throw new MigrationInputError("cli.target_must_be_capital_or_museum");
  const outDir = values.get("--out-dir");
  if (!outDir) throw new MigrationInputError("cli.out_dir_required");
  // A required explicit timestamp makes regenerations reproducible, including on CI.
  const rawNow = values.get("--now");
  if (!rawNow || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(rawNow))
    throw new MigrationInputError("cli.invalid_now");
  const now = new Date(rawNow);
  if (!Number.isFinite(now.getTime()) || now.toISOString() !== rawNow)
    throw new MigrationInputError("cli.invalid_now");
  return { target: target as MigrationTarget, outDir, now, reportOnly };
}

function runMigrationCli(
  args: readonly string[],
  repoRoot: string
): boolean {
  const options = parseMigrationArgs(args);
  const input = readMigrationSources(repoRoot, options.target);
  const result = buildMigration(options.target, input.sources, options.now);
  const report = migrationReport(
    options.target,
    result,
    input.errors,
    input.discoveredFiles
  );
  const outDir = path.resolve(repoRoot, options.outDir);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- The local operator explicitly chooses the output directory; no remote input reaches this CLI.
  fs.mkdirSync(outDir, { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- File basename comes from the closed capital/museum enum under the operator's explicit output directory.
  fs.writeFileSync(
    path.join(outDir, `${options.target}-migration.json`),
    `${JSON.stringify(report, null, 2)}\n`
  );
  // Partial or invalid packages are never emitted as usable fixtures. The report
  // still enumerates every failed source/validation item for operator review.
  const complete = !input.errors.length && result.validation.valid;
  if (complete && !options.reportOnly) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Fixed fixture basename under the operator's explicit output directory, as above.
    fs.writeFileSync(
      path.join(outDir, `6529${options.target}.generated.package.json`),
      `${JSON.stringify(result.cmsPackage, null, 2)}\n`
    );
  }
  return complete;
}

if (require.main === module) {
  try {
    const complete = runMigrationCli(process.argv.slice(2), process.cwd());
    process.stdout.write(
      complete
        ? "Migration report generated; outputs remain fixtures.\n"
        : "Migration incomplete; inspect report errors and validation issues.\n"
    );
    if (!complete) process.exitCode = 1;
  } catch (error) {
    // Stable actionable codes, not filesystem paths, input URLs or raw fs errors.
    process.stderr.write(
      `Migration failed: ${error instanceof MigrationInputError ? error.code : "cli.io_failed"}\n`
    );
    process.exitCode = 1;
  }
}
