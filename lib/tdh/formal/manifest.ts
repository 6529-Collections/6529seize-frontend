import { z } from "zod";

/**
 * The proof manifest of the Lean model of TDH-v1, `formal/manifest.json` on
 * the public TDH feed. 6529's design repository writes it with
 * `design/tdh-lean/tools/manifest.py`, which builds the model at one commit
 * and records what the build established: the vectors it ran and, for every
 * theorem of the axiom audit, its status and the axioms Lean reports for it.
 * Fields beyond the schema are ignored.
 *
 * Statuses: `proved` (checked by Lean's kernel, standard axioms only),
 * `counterexample` (a claim shown false, by a theorem or by evaluating the
 * model) and `deferred` (a claim the model's PROOFS.md names as not proved).
 *
 * Only a clean, passing build is accepted: a manifest from a tree that was
 * not its commit, or whose build or audit did not pass, is rejected whole.
 */

export const FORMAL_MANIFEST_FORMAT = "6529chain.tdh-lean-manifest.v1";
export const FORMAL_STATUSES = [
  "proved",
  "counterexample",
  "deferred",
] as const;
export type FormalStatus = (typeof FORMAL_STATUSES)[number];

/** Lean's three standard axioms, the only ones the audit allows. */
export const STANDARD_AXIOMS = [
  "propext",
  "Classical.choice",
  "Quot.sound",
] as const;

const MAX = Number.MAX_SAFE_INTEGER;
const count = z.number().int().nonnegative().max(MAX);
const fullCommit = z.string().regex(/^[0-9a-f]{40}$/);
const timestamp = z
  .string()
  .max(40)
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.\dZ+:-]{1,16}$/)
  .refine((value) => !Number.isNaN(Date.parse(value)), "invalid time");
const nullish = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .nullish()
    .transform(
      (value): z.infer<T> | null => (value ?? null) as z.infer<T> | null
    );

const axiomName = z.string().regex(/^[A-Za-z_][\w.]{0,63}$/);

const theorem = z.object({
  /** Stable within the manifest: `<PROOFS.md section>.<name>`. */
  id: z.string().min(1).max(120),
  /** The full Lean name; null for a #guard counterexample or a deferred claim. */
  leanName: nullish(z.string().min(1).max(200)),
  library: z.enum(["tdh", "p53"]),
  section: z.string().min(1).max(20),
  status: z.enum(FORMAL_STATUSES),
  statement: nullish(z.string().max(8_000)),
  doesNotGuarantee: nullish(z.string().max(8_000)),
  /** What `#print axioms` reports; null where no theorem is checked. */
  axioms: nullish(z.array(axiomName).max(16)),
  /** `kernel` for a theorem, `evaluation` for a #guard check. */
  checkedBy: nullish(z.string().max(32)),
  checks: nullish(count),
  file: nullish(z.string().max(200)),
  line: nullish(count),
});

const vectorRun = z
  .object({
    id: z.string().min(1).max(40),
    passed: count,
    total: count,
    failed: count,
    checks: count,
  })
  .refine((run) => run.passed <= run.total, "more passed than total");

const documentChange = z.object({
  path: z.string().max(200),
  lastChange: fullCommit,
  lastChangeDate: timestamp,
});

export const formalManifestSchema = z
  .object({
    format: z.literal(FORMAL_MANIFEST_FORMAT),
    generatedAt: timestamp,
    source: z.object({
      repository: z.string().min(1).max(64),
      commit: fullCommit,
      commitDate: timestamp,
      path: z.string().max(200),
      dirty: z.boolean(),
    }),
    documents: nullish(
      z.object({
        specification: nullish(documentChange),
        validatorProposal: nullish(documentChange),
        proofs: nullish(documentChange),
      })
    ),
    lean: z.object({
      version: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}[\w.-]{0,40}$/),
    }),
    build: z.object({
      ok: z.boolean().nullable(),
      audit: z.object({
        ok: z.boolean().nullable(),
        allowedAxioms: z.array(axiomName).max(16),
        theorems: count,
      }),
    }),
    vectors: z.array(vectorRun).max(32),
    facts: z.object({ checks: count }),
    summary: z.object({
      proved: count,
      counterexample: count,
      deferred: count,
      entries: count,
      audited: count,
      auditedTdh: count,
      auditedP53: count,
    }),
    theorems: z.array(theorem).min(1).max(2_000),
  })
  .refine(
    (manifest) =>
      !manifest.source.dirty &&
      manifest.build.ok === true &&
      manifest.build.audit.ok === true,
    { message: "not a clean, passing build" }
  )
  .refine(
    (manifest) =>
      manifest.vectors.every((run) => run.failed === 0) &&
      manifest.vectors.every((run) => run.passed === run.total),
    { message: "a vector run did not pass" }
  )
  .refine(
    (manifest) =>
      manifest.theorems.every((entry) =>
        (entry.axioms ?? []).every((axiom) =>
          (STANDARD_AXIOMS as readonly string[]).includes(axiom)
        )
      ),
    { message: "an axiom other than Lean's standard three" }
  )
  .refine((manifest) => manifest.theorems.length === manifest.summary.entries, {
    message: "the summary does not count the theorems",
  });

export type FormalManifestInput = z.input<typeof formalManifestSchema>;
export type FormalManifest = z.infer<typeof formalManifestSchema>;
export type FormalTheorem = FormalManifest["theorems"][number];
export type FormalVectorRun = FormalManifest["vectors"][number];

export function parseFormalManifest(value: unknown) {
  return formalManifestSchema.safeParse(value);
}

/**
 * The manifest entry a page names: a deferred claim or a #guard case by its
 * id (`1.case-H`), a theorem by its name as the model's PROOFS.md writes it
 * (`replay_ok`, `Stack.takeLast_some`), matched against the end of the full
 * Lean name.
 */
export function findFormalEntry(
  manifest: FormalManifest,
  name: string
): FormalTheorem | null {
  return (
    manifest.theorems.find(
      (entry) =>
        entry.id === name ||
        entry.leanName === name ||
        (entry.leanName?.endsWith(`.${name}`) ?? false)
    ) ?? null
  );
}

/** The run of P26's conformance vectors, or null when the manifest has none. */
export function conformanceRun(
  manifest: FormalManifest,
  id = "p26"
): FormalVectorRun | null {
  return manifest.vectors.find((run) => run.id === id) ?? null;
}
