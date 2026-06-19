# 6529 Help Bot Corpus

`ops/help/help-index.json` is the frontend-owned source of truth for the
`@6529help` runtime knowledge corpus. The backend bot runtime consumes the
published copy at `/help-index.json`; it should not hardcode frontend product
knowledge.

When user-facing frontend behavior changes, update this corpus in the same PR if
users may reasonably ask `@6529help` about it. This includes routes, visible
controls, tabs, workflow steps, empty states, eligibility explanations, and
canonical links.

Each record should be short, factual, and linkable:

- `aliases` should include natural phrases users might type.
- `keywords` should include important retrieval terms.
- `facts` should be concise statements the bot can safely reuse.
- `canonical_path` should be the best 6529.io destination for the answer.
- `related_paths` should include only useful fallback or adjacent destinations.
- `source_refs` should point to the frontend docs, components, or route files
  that justify the record.

Run this after editing:

```bash
./bin/6529 run help-index:sync
```

The sync step validates record shape, required V1 records, source refs, and
internal route paths, then writes `public/help-index.json`. Build also runs the
sync step through `prebuild`, so stale links or missing source refs fail before
deployment.
