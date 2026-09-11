# Museum institutional practice

## Charter

Publish the 6529 Network Museum's living comparative institutional study as a
native, exact-source Museum section. The source package consists of *A field of
practice*, twenty-seven institutional profiles, the adjacent digital-art and
chain-native study, the Museum's public scholarship and editorial standard,
and a primary-source register. The frontend treats the package atomically,
keeps the artwork and Museum voice primary, and exposes the governed GitHub
source and contribution route already used throughout the Museum.

## Reload order

1. `active-context.md`
2. `run-log.md`
3. `app/museum/network/layout.tsx`
4. `lib/museum/publication/legacyCasey.ts`
5. `lib/museum/publication/pageSources.ts`
6. the source package under `records/institutional-practice/` in the Museum
   repository

## Owned paths

- Museum publication contracts and assembler modules under
  `lib/museum/publication/`
- new public routes under `app/museum/network/`
- Museum presentation components under `components/museum/`
- focused Museum tests under `__tests__/`
- Museum help/docs and this workstream ledger

## Forbidden paths

- wallet, authentication, profile, Waves, minting, or transaction code
- third-party logos or images without an explicit reusable-rights basis
- accession, custody, governance, provenance, or contract state in the source
  repository

## Evidence standard

- exact canonical Museum commit and manifest commitments
- fail-closed atomic activation of the full study
- focused unit and route tests, changed lint and typecheck, React Doctor, full
  production build
- desktop and 390px mobile browser evidence with no horizontal overflow,
  keyboard/focus review, and clean console
- staging and production route sweeps against the exact deployed frontend SHA

## Escalation triggers

- source PR changes the public paths or manuscript structure
- required publication size exceeds the existing document or manifest ceiling
- the requested deployment exceeds the authorized phase or conflicts with
  another developer's active deployment
- a reviewer identifies a material source, rights, accessibility, or trust
  defect
