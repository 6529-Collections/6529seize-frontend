# Release Bus v2 unrelated-concurrency frontend beta fixture 1

This file intentionally changes no runtime behavior. It gives the bounded
operator-only unrelated-concurrency acceptance test one exact green frontend
merge-tree. The matching backend candidate has no dependency relationship with
this candidate, allowing both independent paths to progress without
supersession.

- Test ID: `unrelated-concurrency-1`
- Candidate ID: `a2b56cbc-aa3e-4763-95cc-34a6f1ae78d3`
- Global Release Bus v2 mode: `OFF`
