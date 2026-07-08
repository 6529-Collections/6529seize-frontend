# 6529 Help Bot Corpus

`ops/help/help-index.json` is the frontend-owned source of truth for the
`@help6529` runtime knowledge corpus. The backend bot runtime consumes the
published copy at `/help-index.json`; it should not hardcode frontend product
knowledge.

The published `/help-index.json` artifact must stay publicly readable, including
on staging, so the backend help bot can fetch the environment-matching corpus.

When user-facing frontend behavior changes, update this corpus in the same PR if
users may reasonably ask `@help6529` about it. This includes routes, visible
controls, tabs, workflow steps, empty states, eligibility explanations, and
canonical links.

Each record should be short, factual, and linkable:

- `aliases` should include natural phrases users might type.
- `keywords` should include important retrieval terms.
- `facts` should be concise statements the bot can safely reuse.
- `canonical_path` should be the best 6529.io destination for the answer.
- `link_label` should be the page/action label used when the bot links to
  `canonical_path`; omit it only when the record `title` is already the best
  link text.
- `related_paths` should include only useful fallback or adjacent destinations.
- `source_refs` should point to the frontend docs, components, or route files
  that justify the record.
- Do not index migrated legacy WordPress pages. The sync script rejects records
  whose canonical or related paths resolve to WordPress-migrated `page.tsx`
  files, or whose `source_refs` point at those files.

Run both sync steps after editing:

```bash
./bin/6529 run help-index:sync
./bin/6529 run agent-files:sync
```

`help-index:sync` validates record shape, required V1 records, source refs, and
internal route paths, then writes `public/help-index.json`. `agent-files:sync`
regenerates `public/glossary.json` and `public/llms.txt` from the corpus and
`ops/help/llms.txt.template`.

Commit the regenerated `public/` artifacts with the corpus change. PR CI runs
`__tests__/scripts/sync-agent-files.test.ts` (the "Verify agent files sync"
step) whenever these files change and fails if the committed artifacts drift
from the corpus.
