# Run Record

Save as `<run-dir>/run.json` before the baseline round. Fields other than
`candidate` are frozen for the run; a genuine scope change starts a new run
directory. Update `candidate.commit` after each repair batch; the scoring script
requires the latest round to judge that commit.

The pinned coverage cells are every combination of `scope.routes`,
`scope.states` (default `default`), `scope.viewports`, and `scope.locales`
(default `en-US`). When only some combinations matter, list them instead as
`scope.cells`, an array of `{ "route", "state", "viewport", "locale" }`.

`not_applicable` pins dimensions, and S1–S5 when the reviewed states exclude the
lifecycle stage a check governs, each with a scope-based reason, for example
`"S4": "Rejection and failure states are unchanged and not reviewed"`. The
scoring script refuses a pin on an I, M, or S6 check, or a pin without a reason.

## Full template

Use for a new surface, a multi-route polish pass, or any crypto flow.

```json
{
  "rubric_version": "fe-polish-judge/2.1",
  "run_id": "2026-10-11-delegation-polish",
  "candidate": { "commit": "<sha>", "build": "dev | production" },
  "scope": {
    "routes": ["/delegation/delegation-center"],
    "audience": "Collector managing which wallets act for their vault",
    "primary_task": "Register a delegation to a hot wallet and confirm it",
    "states": [
      "loading",
      "empty",
      "populated",
      "error",
      "wallet:confirm",
      "wallet:submitted",
      "wallet:confirmed",
      "wallet:rejected",
      "wallet:failed",
      "wrong-network"
    ],
    "viewports": ["1440x1000", "390x844"],
    "locales": ["en-US", "de-DE"],
    "auth": "signed in via 6529-agent-login test wallet"
  },
  "not_applicable": {
    "J11": "Copy and layout only; no data-loading or rendering path changed"
  },
  "references": ["/waves", "mint progress and success modals"],
  "decisions": ["Fiat equivalents are out of scope for this run"],
  "budget": { "repair_batches": 6 }
}
```

## Lite template

Use for one surface and a narrow change. Viewports default to desktop and
mobile; states are the ones the diff can affect.

```json
{
  "rubric_version": "fe-polish-judge/2.1",
  "run_id": "2026-10-11-wave-empty-state",
  "candidate": { "commit": "<sha>", "build": "dev" },
  "scope": {
    "routes": ["/waves"],
    "primary_task": "Understand an empty wave list and start or join a wave",
    "states": ["empty"],
    "viewports": ["1440x1000", "390x844"],
    "locales": ["en-US", "de-DE"]
  },
  "not_applicable": {
    "J11": "Static empty-state copy and layout",
    "J13": "No wallet or chain interaction"
  },
  "budget": { "repair_batches": 3 }
}
```

## Museum template

Use for every visible change to `/museum/network` routes. The profile adds J14
and M1–M4, requires the three lens reviews, and fixes the viewports.

```json
{
  "rubric_version": "fe-polish-judge/2.1",
  "profile": "museum",
  "run_id": "2026-10-11-museum-research-landing",
  "candidate": { "commit": "<sha>", "build": "production" },
  "scope": {
    "routes": ["/museum/network/research", "/museum/network/stories"],
    "audience": "Visitors reading the Museum's research and stories",
    "primary_task": "Find a research essay and read it with its works and sources",
    "release_intent": "Rebalance the Research landing and essay lead images",
    "viewports": ["1440x1000", "820x1000", "390x844"],
    "locales": ["en-US"]
  },
  "not_applicable": {
    "J13": "No wallet or chain interaction"
  },
  "decisions": [
    "The Keys and Gates lead image repeats on both routes by design"
  ],
  "budget": { "repair_batches": 6 }
}
```

## Run directory

```text
<run-dir>/
  run.json
  evidence/          screenshots and interaction notes, named route-state-viewport-locale;
                     Museum runs add one contact sheet per viewport
  rounds/
    00-baseline.json judge output, round 0
    01.json          judge output after repair batch 1 (names start with the
                     round number; a rejudge of the same candidate is a new
                     round but spends no repair budget)
    00/              Museum runs: curatorial.json, visual.json, copy.json
  decisions.md       optional: scoring-script output and coordinator notes per round
```

Keep run directories under the owning workstream, for example
`ops/workstreams/<slug>/judge/<run-id>/`. Commit them only when the workstream
retains evidence; otherwise keep them local.
