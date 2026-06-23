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
6. `stack-audit.md`
7. `audit-inventory.md`
8. `combined-plan.md`
9. `testing-improvement-plan.md`
10. `mega-run-pr-playbook.md`
11. `continuous-swarm-engine-notes.md`
12. `run-log.md`

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
- pre-PR functionality, UX, safety, web, Mobile/Capacitor, and
  Electron/Desktop Shell impact assessment
- local testing strategy created before opening the PR
- selected test packs from `testing-improvement-plan.md`
- validation commands
- Playwright browser checks when visible behavior changes
- keyboard, focus, mobile, locale, and native-shell fallback decisions where
  relevant
- bot feedback decisions
- remaining risks or exceptions

Future self-organizing queue and Codex worker orchestration ideas live in
`continuous-swarm-engine-notes.md`. They should not expand the immediate testing
sidequest unless explicitly promoted into implementation work.

## Escalation Triggers

Ask for human input only for secrets, production access, destructive actions,
blocked merges that require approval, or product decisions not covered by the
standards.
