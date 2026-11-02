/**
 * "Which machine should I use?": two or three yes-or-no questions, one
 * suggestion. Home and office come first: only a reader who cannot keep a
 * machine running at home or at work is pointed to a datacenter.
 */
export type Answer = "yes" | "no";

export interface Answers {
  /** Can a computer stay plugged in and online at your home or office? */
  readonly where: Answer;
  /** Will you also run your own Ethereum node? */
  readonly node: Answer;
  /** Do you already have a computer you can use for this? */
  readonly spare: Answer;
}

export type Suggestion = "acceptable" | "good" | "great" | "rack" | "cloud";

/**
 * The page opens on the computer you already have, the testing period's
 * advice: no purchase is suggested until a reader says they have none.
 */
export const DEFAULT_ANSWERS: Answers = {
  where: "yes",
  node: "no",
  spare: "yes",
};

/** The spare-computer question matters only at home, without a node. */
export function asksSpare(answers: Answers): boolean {
  return answers.where === "yes" && answers.node === "no";
}

export function suggest(answers: Answers): Suggestion {
  if (answers.where === "no") {
    return answers.node === "yes" ? "rack" : "cloud";
  }
  if (answers.node === "yes") {
    return "great";
  }
  return answers.spare === "yes" ? "acceptable" : "good";
}

/** Where each suggestion's details are on the page. */
export const SUGGESTION_ANCHOR: Readonly<Record<Suggestion, string>> = {
  acceptable: "#tier-acceptable",
  good: "#tier-good",
  great: "#tier-great",
  rack: "#own-node",
  cloud: "#instance-types",
};
