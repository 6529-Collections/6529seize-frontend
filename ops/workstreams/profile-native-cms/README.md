# Profile Native CMS Workstream

## Charter

Build a profile-native CMS for 6529 that launches on the current FE/BE stack while publishing decentralized-shaped, signed, content-addressed packages from day one.

## Reload Order

1. `ops/workstreams/profile-native-cms/active-context.md`
2. `ops/workstreams/profile-native-cms/run-log.md`
3. `D:\repos\6529mono\white-paper\research\2026-06-15-6529-decentralization\2026-06-16-profile-native-cms-build-spec.md`
4. Frontend branch: `D:\repos\6529seize-frontend-profile-native-cms`
5. Backend branch: `D:\repos\6529seize-backend-profile-native-cms`

## Owned Paths

- Frontend CMS package contract, fixture renderer, public CMS routes, CMS editor/wizard, profile website CTA, tests, docs.
- Backend CMS OpenAPI, generated models, entities, routes, repositories, services, tests, storage/publish skeletons.
- Workstream docs under this folder.

## Forbidden Paths

- Do not touch unrelated dirty work in `D:\repos\6529seize-frontend`.
- Do not touch unrelated dirty work in `D:\repos\6529seize-backend`.
- Do not migrate legacy museum/capital routes by hardcoding new special cases.
- Do not expose arbitrary raw HTML or JavaScript authoring.

## Evidence Standard

- Diffs must be scoped and reviewable.
- Public renderer must render from package fixtures without authoring API state.
- UI changes need browser verification and screenshots.
- Backend API changes need OpenAPI generation where applicable and focused tests.
- PRs need bot feedback review and iteration before handoff.

## Escalation Triggers

- Production secrets, destructive operations, merge/deploy actions, or irreversible product decisions.
- If signing, wallet authorization, or IPFS provider choices block a shippable vertical slice, record a narrow MVP assumption instead of stalling.
