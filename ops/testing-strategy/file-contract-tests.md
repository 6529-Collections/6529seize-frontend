# Filesystem contracts in PR CI

App PR CI runs `scripts/file-contract-tests.cjs` in the quality lane before
publishing its merge-tree evidence. It selects tests by their on-disk inputs,
independently of the related-Jest check. Jest's import graph cannot discover
dependencies created by `readFileSync` or directory scans.

The selector covers the hover-control and wave compatibility source scans,
Museum publication workflow compatibility, coverage-floor configuration,
dependency-governance workflow, and runner benchmark workflows. Existing
deployment and agent-file contract steps retain their own suites. This is an
explicit dependency registry, not automatic discovery of every filesystem read.

When adding a filesystem contract, register its test path and every input file
or scanned directory in `CONTRACTS`. Add a selection regression test for an
input that Jest cannot reach through imports. Each registered test also selects
itself when edited. Selection, PR-workflow, and Jest toolchain changes run the
complete registered set to validate the gate.

Selection uses the exact PR base commit and includes deletions and both paths
of a rename. Tests run through `6529`, with coverage disabled, using explicit
test paths. Test failures, missing suites, and runner errors fail the quality
lane. Unrelated paths select no additional tests.

The workflow previously displayed as **Coverage Floor** now displays as
**Full Jest suite and coverage**. Its file remains `coverage-floor.yml`, and
its triggers, concurrency, coverage baseline, and tolerance are unchanged.
Its summary separates the Jest outcome from the coverage-floor outcome; either
can fail the job. If setup fails or Jest produces no coverage summary, the
summary reports the skipped check rather than implying coverage passed.
