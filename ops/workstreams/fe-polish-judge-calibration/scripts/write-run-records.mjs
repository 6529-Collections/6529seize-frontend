#!/usr/bin/env node
// Writes run.json for every calibration case and the answer keys:
// labels.json for the rubric 2.0 set (c01-c15) and labels-2.1.json for the
// rubric 2.1 verification set (c16-c22). Run after prepare-cases.mjs.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const RUBRIC = "fe-polish-judge/2.0";
const RUBRIC_21 = "fe-polish-judge/2.1";
const PROD = "04d8b1e250984d73c2c537794e6b83e2ed1f6721";
const SCREENSHOT_ONLY = {
  J08: "Screenshot-only calibration; interactions were not exercised",
  J11: "Screenshot-only calibration; no performance evidence was captured",
  J12: "Calibration evidence is en-US only",
};
const NO_WALLET = "No wallet or chain interaction on this surface";
const DESKTOP = "1440x1000";
const TABLET = "820x1000";
const PHONE = "390x844";
const MUSEUM_HOME = "/museum/network";
const GIFT = "/museum/network/gifts/[accessionId]";
const OBJECT = "/museum/network/objects/[objectId]";
const PROGRAM = "/museum/network/programs/[programId]";
const ARTIST = "/museum/network/artists/[slug]";
const SEEDED = "seeded";
const CONTROL = "control";
const RECORDED = "recorded";
const NO_REQUIRED = "no-required";
const ADJUDICATE = "adjudicate";

function generalRun(id, scope, extraNa, candidate = PROD, rubric = RUBRIC) {
  return {
    rubric_version: rubric,
    run_id: `calibration-${id}`,
    candidate: { commit: candidate, build: "production" },
    scope,
    not_applicable: { ...SCREENSHOT_ONLY, ...extraNa },
    budget: { repair_batches: 6 },
  };
}

const ABOUT_SCOPE = {
  routes: ["/museum/network/about"],
  audience: "Visitors learning what the 6529 Network Museum is",
  primary_task:
    "Understand what the Museum holds, how it works, and where to go next",
  states: ["default"],
  viewports: [DESKTOP, PHONE],
  locales: ["en-US"],
};
const HOME_SCOPE = {
  routes: ["/"],
  audience: "Visitors and members arriving at 6529.io",
  primary_task:
    "Understand what 6529 is and take a first step: start here or connect a wallet",
  states: ["default"],
  viewports: [DESKTOP, PHONE],
  locales: ["en-US"],
};
const POPULATED_ONLY = {
  J09: "Screenshot-only calibration; only the populated state was captured",
};

function museumRun(id, cells, routes, candidate) {
  return {
    rubric_version: RUBRIC,
    profile: "museum",
    run_id: `calibration-${id}`,
    candidate: { commit: candidate, build: "production" },
    scope: {
      routes,
      audience: "Visitors to the 6529 Network Museum",
      primary_task:
        "Experience the Museum's art and understand what it holds and why",
      states: ["default"],
      // Historical evidence predates the three-width gate; scope.cells lists
      // the captures that exist.
      viewports: [DESKTOP, TABLET, PHONE],
      locales: ["en-US"],
      cells,
    },
    not_applicable: {
      ...SCREENSHOT_ONLY,
      ...POPULATED_ONLY,
      J13: NO_WALLET,
    },
    budget: { repair_batches: 6 },
  };
}

const cell = (route, viewport) => ({
  route,
  state: "default",
  viewport,
  locale: "en-US",
});

const runs = {};
for (const id of ["c01", "c02", "c03", "c04", "c05", "c06", "c09", "c10"]) {
  runs[id] = generalRun(id, ABOUT_SCOPE, { ...POPULATED_ONLY, J13: NO_WALLET });
}
for (const id of ["c07", "c08"]) {
  runs[id] = generalRun(id, HOME_SCOPE, POPULATED_ONLY);
}
runs.c11 = museumRun(
  "c11",
  [DESKTOP, TABLET, PHONE].map((v) => cell(MUSEUM_HOME, v)),
  [MUSEUM_HOME],
  "museum-home-consolidation-final"
);
runs.c12 = museumRun(
  "c12",
  [
    cell(MUSEUM_HOME, DESKTOP),
    cell(MUSEUM_HOME, PHONE),
    cell(GIFT, DESKTOP),
    cell(OBJECT, DESKTOP),
    cell(PROGRAM, DESKTOP),
  ],
  [
    MUSEUM_HOME,
    GIFT,
    OBJECT,
    PROGRAM,
  ],
  "museum-pre-art-first-production"
);
runs.c13 = museumRun(
  "c13",
  [
    cell(OBJECT, DESKTOP),
    cell(GIFT, PHONE),
    cell(ARTIST, PHONE),
  ],
  [
    OBJECT,
    GIFT,
    ARTIST,
  ],
  "museum-art-first-release-verified"
);
const MINT_SCOPE = (states) => ({
  routes: ["/the-memes/mint"],
  audience: "Collectors minting a Meme card, including people new to wallets",
  primary_task: "Mint a Meme card and understand what happened",
  states,
  viewports: ["1440x900", PHONE],
  locales: ["en-US"],
});
runs.c14 = generalRun(
  "c14",
  MINT_SCOPE(["confirm_wallet", "submitted"]),
  {},
  "mint-progress-modals-review"
);
runs.c15 = generalRun(
  "c15",
  MINT_SCOPE(["success"]),
  {},
  "mint-success-modal-review"
);

// Rubric 2.1 verification set. c16 and c17 recapture the c01 and c07 pages with
// the phone device profile; c18-c20 rejudge c01, c02, and c08 evidence; c21 and
// c22 rejudge c14 and c15 with S checks pinned for stages outside their states.
const ABOUT_NA = { ...POPULATED_ONLY, J13: NO_WALLET };
runs.c16 = generalRun("c16", ABOUT_SCOPE, ABOUT_NA, PROD, RUBRIC_21);
runs.c17 = generalRun("c17", HOME_SCOPE, POPULATED_ONLY, PROD, RUBRIC_21);
runs.c18 = generalRun("c18", ABOUT_SCOPE, ABOUT_NA, PROD, RUBRIC_21);
runs.c19 = generalRun("c19", ABOUT_SCOPE, ABOUT_NA, PROD, RUBRIC_21);
runs.c20 = generalRun("c20", HOME_SCOPE, POPULATED_ONLY, PROD, RUBRIC_21);
const PRE_PROMPT =
  "The mint form before the wallet opens is unchanged and not reviewed";
const WALLET_AND_CHAIN =
  "Wallet selection and network switching happen before the reviewed states and are unchanged";
const REJECTION =
  "Rejection and failure states are unchanged and not reviewed";
runs.c21 = generalRun(
  "c21",
  MINT_SCOPE(["confirm_wallet", "submitted"]),
  { S1: PRE_PROMPT, S2: WALLET_AND_CHAIN, S4: REJECTION },
  "mint-progress-modals-review",
  RUBRIC_21
);
runs.c22 = generalRun(
  "c22",
  MINT_SCOPE(["success"]),
  {
    S1: PRE_PROMPT,
    S2: WALLET_AND_CHAIN,
    S4: REJECTION,
    S5: "A Meme mint requests no token approval or delegation",
  },
  "mint-success-modal-review",
  RUBRIC_21
);
// c23 rejudges c22 after the judge prompt added that S3 needs lifecycle
// evidence; c22's judge had passed S3 from a single success frame.
runs.c23 = { ...runs.c22, run_id: "calibration-c23" };

for (const [id, run] of Object.entries(runs)) {
  const file = path.join(ROOT, "cases", id, "run.json");
  fs.writeFileSync(file, `${JSON.stringify(run, null, 2)}\n`);
}

// Answer key. Judges never receive this file.
const labels = {
  c01: { kind: CONTROL, expect: NO_REQUIRED },
  c02: { kind: SEEDED, seed: "brief leakage in the intro", expect: ["I2"] },
  c03: { kind: SEEDED, seed: "fake profundity heading and paragraph", expect: ["J07"] },
  c04: { kind: SEEDED, seed: "governance theater paragraph", expect: ["I3"] },
  c05: { kind: SEEDED, seed: "invented metrics tiles", expect: ["I1"] },
  c06: { kind: SEEDED, seed: "internal path, commit, and TODO as a headline", expect: ["I2"] },
  c07: { kind: CONTROL, expect: NO_REQUIRED },
  c08: { kind: SEEDED, seed: "false urgency mint banner and misleading claim CTA", expect: ["S6"] },
  c09: { kind: "repeat", of: "c01", expect: NO_REQUIRED },
  c10: { kind: "repeat", of: "c01", expect: NO_REQUIRED },
  c11: { kind: RECORDED, source: "museum-home-consolidation: three reviewers PASS, shipped", expect: NO_REQUIRED },
  c12: { kind: RECORDED, source: "museum-art-first-rebuild: owner rejected registry-first pages with no artwork", expect: "required" },
  c13: { kind: RECORDED, source: "museum-art-first-rebuild: owner review passed release-verified captures", expect: NO_REQUIRED },
  c14: { kind: RECORDED, source: "mint-progress-modals: reviewed and shipped", expect: NO_REQUIRED },
  c15: { kind: RECORDED, source: "mint-success-modal: reviewed and shipped", expect: NO_REQUIRED },
};
fs.writeFileSync(
  path.join(ROOT, "labels.json"),
  `${JSON.stringify(labels, null, 2)}\n`
);
const labels21 = {
  c16: { kind: CONTROL, of: "c01", note: "phone device profile capture", expect: ADJUDICATE },
  c17: { kind: CONTROL, of: "c07", note: "phone device profile capture", expect: ADJUDICATE },
  c18: { kind: "evidence-gap", of: "c01", note: "same evidence as c01: truncated phone capture with the desktop shell", expect: ADJUDICATE },
  c19: { kind: SEEDED, of: "c02", seed: "brief leakage in the intro", expect: ["I2"] },
  c20: { kind: SEEDED, of: "c08", seed: "false urgency mint banner and misleading claim CTA", expect: ["S6"] },
  c21: { kind: RECORDED, of: "c14", source: "mint-progress-modals: reviewed and shipped", expect: "accepted" },
  c22: { kind: RECORDED, of: "c15", source: "mint-success-modal: reviewed and shipped", expect: NO_REQUIRED },
  c23: { kind: RECORDED, of: "c22", note: "after the S3 lifecycle-evidence prompt line", source: "mint-success-modal: reviewed and shipped", expect: NO_REQUIRED },
};
fs.writeFileSync(
  path.join(ROOT, "labels-2.1.json"),
  `${JSON.stringify(labels21, null, 2)}\n`
);
process.stdout.write(`wrote ${Object.keys(runs).length} run records and both answer keys\n`);
