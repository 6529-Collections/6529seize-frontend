/**
 * What a proof guarantees (TDH-DESIGN.md §5.12): the failure scenarios of
 * the model and the layer that stops each, from the D128 contract's checks
 * (contracts/README.md, "What a submission must satisfy"), the programs'
 * own checks (P53 §4.6) and the tests that show each stop. Pure data, so a
 * test can hold the model to the record.
 */

/** The layers a day passes on its way to being recorded, in order. */
export type Layer = "program" | "proof" | "second" | "contract" | "recorded";

export const LAYERS: readonly Layer[] = [
  "program",
  "proof",
  "second",
  "contract",
  "recorded",
];

export type ScenarioId =
  | "total"
  | "log"
  | "blocks"
  | "bugA"
  | "flaw"
  | "skip"
  | "rule";

/**
 * The contract's checks, in the order it runs them (contracts/README.md);
 * "program" is the programs' own evidence rule, which runs before any proof
 * exists.
 */
type RuleLine =
  | "program"
  | "decoding"
  | "outputs"
  | "network"
  | "chaining"
  | "time"
  | "cycleRoot"
  | "anchors"
  | "proofs";

interface Scenario {
  readonly id: ScenarioId;
  /** The layer that stops it. */
  readonly stoppedBy: Exclude<Layer, "recorded">;
  /** The rule line that stops it. */
  readonly line: RuleLine;
  /**
   * How the record shows the stop: a test that runs it (Tested), or the
   * design that requires it (Decided, D128).
   */
  readonly evidence: "tested" | "decided";
}

export const SCENARIOS: readonly Scenario[] = [
  { id: "total", stoppedBy: "proof", line: "proofs", evidence: "tested" },
  { id: "log", stoppedBy: "program", line: "program", evidence: "tested" },
  { id: "blocks", stoppedBy: "contract", line: "anchors", evidence: "tested" },
  // Program B is the reason these two stop, but the contract is what
  // refuses them: at its second check (outputs differ) and at its eighth
  // (RISC Zero's verification of the same words).
  { id: "bugA", stoppedBy: "contract", line: "outputs", evidence: "tested" },
  { id: "flaw", stoppedBy: "contract", line: "proofs", evidence: "decided" },
  { id: "skip", stoppedBy: "contract", line: "chaining", evidence: "tested" },
  { id: "rule", stoppedBy: "contract", line: "network", evidence: "tested" },
];

export function scenarioById(id: ScenarioId): Scenario {
  const found = SCENARIOS.find((scenario) => scenario.id === id);
  if (!found) {
    throw new Error(`Unknown scenario "${id}"`);
  }
  return found;
}

export type LayerState = "passed" | "stops" | "unreached" | "wrong";

/**
 * Each layer's state for a scenario: the layers before the stop let it
 * through, the stopping layer stops it, the rest are never reached. Broken
 * (the same mistake in the rules both programs follow), every layer lets it
 * through and the day is recorded wrong.
 */
export function layerStates(
  scenario: Scenario,
  broken: boolean
): Record<Layer, LayerState> {
  const stop = broken ? -1 : LAYERS.indexOf(scenario.stoppedBy);
  const states = {} as Record<Layer, LayerState>;
  LAYERS.forEach((layer, index) => {
    if (broken) {
      states[layer] = layer === "recorded" ? "wrong" : "passed";
    } else if (index < stop) {
      states[layer] = "passed";
    } else if (index === stop) {
      states[layer] = "stops";
    } else {
      states[layer] = "unreached";
    }
  });
  return states;
}
