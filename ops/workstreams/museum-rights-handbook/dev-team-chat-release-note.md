Museum rights practice revision is live on production.

What changed

- The rights handbook now describes what the Museum ordinarily does with a lawfully acquired work. A missing public reuse license does not prevent collection display, faithful online documentation, scholarship, or preservation. Adaptations and commercial exploitation remain separate questions.
- All 22 rights expressions now carry six practical Museum readings alongside the exact license or rights-statement record.
- The former colored chips and bordered card grid are gone. Rights pages now use a quiet six-row editorial register that follows the 6529 site typography and spacing.
- Artist and collector guides, public-domain education, exact legal text, official external references, and object-level license links remain part of the section.
- The revised public copy contains no em dashes.

Release record

- Museum source PR #33: https://github.com/6529-Collections/6529networkmuseum/pull/33
- Source release commit: `42236950a8976825861b6785613e3837405f486c`
- Current source snapshot: `6f7f8b2168347cb623d53eeb6b9d7fe1242d7a73`
- Current manifest: 345 entries, SHA-256 `81bcb7303692014e719870f9eaf97e5262940697a17e141a384a59c6617fc84d`, Keccak `0xa404564ca8bb5f6debf369be758c5efdbbfa90dc637d1a7421b20e3e5dc3e65e`
- Frontend PR #3634: https://github.com/6529-Collections/6529seize-frontend/pull/3634
- Production runtime: `81ddbf2a6dce7df785c87d9a3192d3ed7a74f1cf`
- Production deploy: https://github.com/6529-Collections/6529seize-frontend/actions/runs/31061048126
- Production E2E: https://github.com/6529-Collections/6529seize-frontend/actions/runs/31061460637, 15 of 15 read-only packs passed

Final checks

- The focused production rights suite passed 6 of 6 on desktop and 390px mobile.
- The overview, both guides, and all 22 expression pages return HTTP 200.
- Representative live pages have six practice rows, no status chips, no horizontal overflow, no browser errors, and no em dashes in the revised copy.

Live section: https://6529.io/museum/network/rights
