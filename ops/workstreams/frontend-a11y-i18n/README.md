# Frontend Accessibility And I18n Workstream

## Charter

Progressively migrate the frontend toward WCAG 2.2 AA and locale-aware UI. The
workstream starts with standards and repo-local skills, then moves through safe
page surfaces one PR at a time.

## Reload Order

1. `AGENTS.md`
2. `ops/skills/6529-autonomous-manager/SKILL.md`
3. `ops/skills/write-prs/SKILL.md`
4. `ops/standards/README.md`
5. `active-context.md`
6. `run-log.md`

## Owned Paths

- `ops/standards/`
- `ops/skills/wcag-22-aa/`
- `ops/skills/i18n-localization/`
- `ops/workstreams/frontend-a11y-i18n/`
- Future scoped implementation PRs for selected frontend surfaces.

## Forbidden Paths Without Explicit Need

- Generated files.
- Environment files.
- Minting or transaction flows during the first safe-page wave.
- Unrelated user changes.

## Evidence Standard

Every PR must record:

- changed surface
- validation commands
- browser or manual UI checks when visible behavior changes
- bot feedback decisions
- remaining risks or exceptions

## Escalation Triggers

Ask for human input only for secrets, production access, destructive actions,
blocked merges that require approval, or product decisions not covered by the
standards.
